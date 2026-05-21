import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireOrganizer } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventType } from '@/lib/event-enum';
import {
  isPlayerEligibleForSide,
  isValidSideForEvent,
  loadLineupMap,
} from '@/lib/event-result';
import type { CreatePenaltyResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const Body = z.object({
  team_side: z.enum(['own', 'opponent', 'light', 'dark']),
  player_user_id: z.string().uuid().nullable().optional(),
  minutes: z.number().int().min(1).max(60),
  time_seconds: z.number().int().min(0).max(35999).nullable().optional(),
});

export async function POST(req: Request, { params }: Params): Promise<Response> {
  try {
    const ctx = await requireOrganizer(req);
    const { id } = await params;
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
      const lineup = await loadLineupMap(sb, ev.id);
      if (!isPlayerEligibleForSide(d.player_user_id, d.team_side, isGame, lineup)) {
        return NextResponse.json(
          { error: 'Игрок не в составе на эту сторону' },
          { status: 400 },
        );
      }
    }

    const { data: created, error: insErr } = await sb
      .from('event_penalties')
      .insert({
        event_id: ev.id,
        team_side: d.team_side,
        player_user_id: d.player_user_id ?? null,
        minutes: d.minutes,
        time_seconds: d.time_seconds ?? null,
        created_by: ctx.id,
      })
      .select('id')
      .single();
    if (insErr || !created) {
      return NextResponse.json({ error: insErr?.message ?? 'Не удалось создать удаление' }, { status: 500 });
    }
    return NextResponse.json({ id: created.id } satisfies CreatePenaltyResponse);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
