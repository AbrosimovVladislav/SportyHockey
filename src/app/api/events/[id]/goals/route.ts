import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, assertTeamMember } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventType } from '@/lib/event-enum';
import { isValidSideForEvent } from '@/lib/event-result';
import { recomputeEventOutcome } from '@/lib/event-outcome';
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
    const user = await requireUser(req);
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
    if (!ev) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }
    await assertTeamMember(user.id, ev.team_id);

    const isGame = asEventType(ev.type) === 'game';
    if (!isValidSideForEvent(d.team_side, isGame)) {
      return NextResponse.json({ error: 'Неверная сторона для этого события' }, { status: 400 });
    }
    const allowsPlayers = isGame ? d.team_side === 'own' : true;
    if (!allowsPlayers) {
      if (d.scorer_user_id || d.assist1_user_id || d.assist2_user_id) {
        return NextResponse.json(
          { error: 'Для соперника игроки не указываются' },
          { status: 400 },
        );
      }
    }

    const { data: memberRows } = await sb
      .from('team_memberships')
      .select('user_id')
      .eq('team_id', ev.team_id);
    const memberIds = new Set((memberRows ?? []).map((r) => r.user_id));

    const scorerId = d.scorer_user_id ?? null;
    if (allowsPlayers && scorerId && !memberIds.has(scorerId)) {
      return NextResponse.json({ error: 'Автор не в команде' }, { status: 400 });
    }
    const assists: { user_id: string; order: 1 | 2 }[] = [];
    if (allowsPlayers && d.assist1_user_id) {
      if (!memberIds.has(d.assist1_user_id)) {
        return NextResponse.json({ error: 'Ассистент не в команде' }, { status: 400 });
      }
      assists.push({ user_id: d.assist1_user_id, order: 1 });
    }
    if (allowsPlayers && d.assist2_user_id) {
      if (!memberIds.has(d.assist2_user_id)) {
        return NextResponse.json({ error: 'Ассистент не в команде' }, { status: 400 });
      }
      if (assists.some((a) => a.user_id === d.assist2_user_id)) {
        return NextResponse.json({ error: 'Ассистент уже указан' }, { status: 400 });
      }
      assists.push({ user_id: d.assist2_user_id, order: 2 });
    }

    const { data: created, error: insErr } = await sb
      .from('result_points')
      .insert({
        event_id: ev.id,
        type: 'goal',
        team_side: d.team_side,
        user_id: scorerId,
        time_seconds: d.time_seconds ?? null,
        created_by: user.id,
      })
      .select('id')
      .single();
    if (insErr || !created) {
      return NextResponse.json({ error: insErr?.message ?? 'Не удалось создать гол' }, { status: 500 });
    }

    if (assists.length > 0) {
      const createdAssistIds: string[] = [];
      for (const a of assists) {
        const { data: ap, error: apErr } = await sb
          .from('result_points')
          .insert({
            event_id: ev.id,
            type: 'assist',
            team_side: d.team_side,
            user_id: a.user_id,
            created_by: user.id,
          })
          .select('id')
          .single();
        if (apErr || !ap) {
          await sb.from('result_points').delete().in('id', [created.id, ...createdAssistIds]);
          return NextResponse.json({ error: apErr?.message ?? 'Не удалось создать передачу' }, { status: 500 });
        }
        createdAssistIds.push(ap.id);
      }
      const { error: linkErr } = await sb.from('result_point_links').insert(
        assists.map((a, i) => ({
          goal_point_id: created.id,
          assist_point_id: createdAssistIds[i],
          assist_order: a.order,
        })),
      );
      if (linkErr) {
        await sb.from('result_points').delete().in('id', [created.id, ...createdAssistIds]);
        return NextResponse.json({ error: linkErr.message }, { status: 500 });
      }
    }

    await recomputeEventOutcome(sb, ev.id);

    return NextResponse.json({ id: created.id } satisfies CreateGoalResponse);
  } catch (e) {
    return handleRouteError(e);
  }
}
