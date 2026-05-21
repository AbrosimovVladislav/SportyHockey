import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireOrganizer } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventType } from '@/lib/event-enum';
import { isValidSideForEvent } from '@/lib/event-result';
import type { DeleteGoalResponse, UpdateGoalResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; goalId: string }> };

const Body = z.object({
  team_side: z.enum(['own', 'opponent', 'light', 'dark']),
  scorer_user_id: z.string().uuid().nullable().optional(),
  time_seconds: z.number().int().min(0).max(35999).nullable().optional(),
  assist1_user_id: z.string().uuid().nullable().optional(),
  assist2_user_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  try {
    const ctx = await requireOrganizer(req);
    const { id, goalId } = await params;
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные гола' }, { status: 400 });
    }
    const d = parsed.data;

    const sb = supabaseServer();
    const { data: ev } = await sb
      .from('events')
      .select('id, team_id, type')
      .eq('id', id)
      .maybeSingle();
    if (!ev || ev.team_id !== ctx.team_id) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    const { data: goal } = await sb
      .from('event_goals')
      .select('id, event_id')
      .eq('id', goalId)
      .maybeSingle();
    if (!goal || goal.event_id !== ev.id) {
      return NextResponse.json({ error: 'Гол не найден' }, { status: 404 });
    }

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

    const { error: updErr } = await sb
      .from('event_goals')
      .update({
        team_side: d.team_side,
        scorer_user_id: scorerId,
        time_seconds: d.time_seconds ?? null,
      })
      .eq('id', goalId);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    const { error: delAssistsErr } = await sb
      .from('event_goal_assists')
      .delete()
      .eq('goal_id', goalId);
    if (delAssistsErr) {
      return NextResponse.json({ error: delAssistsErr.message }, { status: 500 });
    }
    if (assists.length > 0) {
      const { error: insAssistsErr } = await sb.from('event_goal_assists').insert(
        assists.map((a) => ({ goal_id: goalId, user_id: a.user_id, assist_order: a.order })),
      );
      if (insAssistsErr) {
        return NextResponse.json({ error: insAssistsErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true } satisfies UpdateGoalResponse);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

export async function DELETE(req: Request, { params }: Params): Promise<Response> {
  try {
    const ctx = await requireOrganizer(req);
    const { id, goalId } = await params;
    const sb = supabaseServer();

    const { data: ev } = await sb
      .from('events')
      .select('id, team_id')
      .eq('id', id)
      .maybeSingle();
    if (!ev || ev.team_id !== ctx.team_id) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    const { error } = await sb
      .from('event_goals')
      .delete()
      .eq('id', goalId)
      .eq('event_id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true } satisfies DeleteGoalResponse);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
