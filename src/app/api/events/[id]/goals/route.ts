import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireOrganizer } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventType } from '@/lib/event-enum';
import { isValidSideForEvent } from '@/lib/event-result';
import type { CreateGoalResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const Body = z.object({
  team_side: z.enum(['own', 'opponent', 'light', 'dark']),
  scorer_user_id: z.string().uuid().nullable().optional(),
  time_seconds: z
    .number()
    .int()
    .min(0)
    .max(35999)
    .nullable()
    .optional(),
  assist1_user_id: z.string().uuid().nullable().optional(),
  assist2_user_id: z.string().uuid().nullable().optional(),
});

export async function POST(req: Request, { params }: Params): Promise<Response> {
  try {
    const ctx = await requireOrganizer(req);
    const { id } = await params;
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные гола' }, { status: 400 });
    }
    const d = parsed.data;

    const sb = supabaseServer();
    const { data: ev, error: evErr } = await sb
      .from('events')
      .select('id, team_id, type')
      .eq('id', id)
      .maybeSingle();
    if (evErr) {
      return NextResponse.json({ error: evErr.message }, { status: 500 });
    }
    if (!ev || ev.team_id !== ctx.team_id) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    const isGame = asEventType(ev.type) === 'game';
    if (!isValidSideForEvent(d.team_side, isGame)) {
      return NextResponse.json({ error: 'Неверная сторона для этого события' }, { status: 400 });
    }

    const memberIds = await loadTeamMemberIds(sb, ev.team_id);

    const scorerId = d.scorer_user_id ?? null;
    if (scorerId && !memberIds.has(scorerId)) {
      return NextResponse.json({ error: 'Автор не в команде' }, { status: 400 });
    }
    const assists: { user_id: string; order: 1 | 2 }[] = [];
    if (d.assist1_user_id) {
      if (!memberIds.has(d.assist1_user_id)) {
        return NextResponse.json({ error: 'Ассистент не в команде' }, { status: 400 });
      }
      assists.push({ user_id: d.assist1_user_id, order: 1 });
    }
    if (d.assist2_user_id) {
      if (!memberIds.has(d.assist2_user_id)) {
        return NextResponse.json({ error: 'Ассистент не в команде' }, { status: 400 });
      }
      if (assists.some((a) => a.user_id === d.assist2_user_id)) {
        return NextResponse.json({ error: 'Ассистент уже указан' }, { status: 400 });
      }
      assists.push({ user_id: d.assist2_user_id, order: 2 });
    }

    const { data: created, error: insErr } = await sb
      .from('event_goals')
      .insert({
        event_id: ev.id,
        team_side: d.team_side,
        scorer_user_id: scorerId,
        time_seconds: d.time_seconds ?? null,
        created_by: ctx.id,
      })
      .select('id')
      .single();
    if (insErr || !created) {
      return NextResponse.json({ error: insErr?.message ?? 'Не удалось создать гол' }, { status: 500 });
    }

    if (assists.length > 0) {
      const { error: assistErr } = await sb.from('event_goal_assists').insert(
        assists.map((a) => ({
          goal_id: created.id,
          user_id: a.user_id,
          assist_order: a.order,
        })),
      );
      if (assistErr) {
        await sb.from('event_goals').delete().eq('id', created.id);
        return NextResponse.json({ error: assistErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ id: created.id } satisfies CreateGoalResponse);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

async function loadTeamMemberIds(
  sb: ReturnType<typeof supabaseServer>,
  teamId: string,
): Promise<Set<string>> {
  const { data } = await sb
    .from('team_memberships')
    .select('user_id')
    .eq('team_id', teamId);
  return new Set((data ?? []).map((r) => r.user_id));
}
