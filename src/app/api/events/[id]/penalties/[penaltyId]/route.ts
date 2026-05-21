import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireOrganizer } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventType } from '@/lib/event-enum';
import { isValidSideForEvent } from '@/lib/event-result';
import type { DeletePenaltyResponse, UpdatePenaltyResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; penaltyId: string }> };

const Body = z.object({
  team_side: z.enum(['own', 'opponent', 'light', 'dark']),
  player_user_id: z.string().uuid().nullable().optional(),
  minutes: z.number().int().min(1).max(60),
  time_seconds: z.number().int().min(0).max(35999).nullable().optional(),
});

export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  try {
    const ctx = await requireOrganizer(req);
    const { id, penaltyId } = await params;
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные удаления' }, { status: 400 });
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

    const { data: pen } = await sb
      .from('event_penalties')
      .select('id, event_id')
      .eq('id', penaltyId)
      .maybeSingle();
    if (!pen || pen.event_id !== ev.id) {
      return NextResponse.json({ error: 'Удаление не найдено' }, { status: 404 });
    }

    const isGame = asEventType(ev.type) === 'game';
    if (!isValidSideForEvent(d.team_side, isGame)) {
      return NextResponse.json({ error: 'Неверная сторона для этого события' }, { status: 400 });
    }
    const allowsPlayer = isGame ? d.team_side === 'own' : true;
    if (!allowsPlayer && d.player_user_id) {
      return NextResponse.json(
        { error: 'Для соперника игрок не указывается' },
        { status: 400 },
      );
    }

    if (allowsPlayer && d.player_user_id) {
      const { data: mem } = await sb
        .from('team_memberships')
        .select('id')
        .eq('user_id', d.player_user_id)
        .eq('team_id', ev.team_id)
        .maybeSingle();
      if (!mem) {
        return NextResponse.json({ error: 'Игрок не в команде' }, { status: 400 });
      }
    }

    const { error: updErr } = await sb
      .from('event_penalties')
      .update({
        team_side: d.team_side,
        player_user_id: d.player_user_id ?? null,
        minutes: d.minutes,
        time_seconds: d.time_seconds ?? null,
      })
      .eq('id', penaltyId);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true } satisfies UpdatePenaltyResponse);
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
    const { id, penaltyId } = await params;
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
      .from('event_penalties')
      .delete()
      .eq('id', penaltyId)
      .eq('event_id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true } satisfies DeletePenaltyResponse);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
