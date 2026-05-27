import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { LINE_SLOT_REGEX } from '@/lib/event-lines';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  user_id: z.string().uuid(),
  team_side: z.enum(['light', 'dark']),
  slot: z.string().regex(LINE_SLOT_REGEX).nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params): Promise<Response> {
  try {
    const ctx = await requireOrganizer(req);
    const { id: eventId } = await params;
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные звена' }, { status: 400 });
    }

    const sb = supabaseServer();

    const { data: event, error: evErr } = await sb
      .from('events')
      .select('id, team_id, type')
      .eq('id', eventId)
      .maybeSingle();
    if (evErr) {
      return NextResponse.json({ error: evErr.message }, { status: 500 });
    }
    if (!event || event.team_id !== ctx.team_id) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    const isGame = event.type === 'game';
    // Для игры стороны нет — нормализуем к 'light'.
    const sideForStorage = isGame ? 'light' : parsed.data.team_side;

    if (parsed.data.slot === null) {
      const { error: delErr } = await sb
        .from('event_lines')
        .delete()
        .eq('event_id', event.id)
        .eq('team_side', sideForStorage)
        .eq('user_id', parsed.data.user_id);
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    // На игру в звено можно поставить любого участника команды — в том числе ещё не
    // записавшегося (roadmap 33.8). Для тренировки игрок сначала должен быть распределён
    // на сторону (Светлые/Тёмные).
    if (!isGame) {
      const { data: lineup } = await sb
        .from('event_lineups')
        .select('team_side')
        .eq('event_id', event.id)
        .eq('user_id', parsed.data.user_id)
        .maybeSingle();
      if (!lineup || lineup.team_side !== parsed.data.team_side) {
        return NextResponse.json({ error: 'Игрок не в этой команде' }, { status: 400 });
      }
    }

    // Текущий слот перетаскиваемого и тот, кто уже стоит на целевом слоте — для свапа
    // (как в разделе «Состав», POST /api/teams/me/lines): два игрока в звеньях меняются
    // местами, а не вытесняют друг друга в пул.
    const { data: existing, error: selErr } = await sb
      .from('event_lines')
      .select('user_id, slot')
      .eq('event_id', event.id)
      .eq('team_side', sideForStorage)
      .or(`user_id.eq.${parsed.data.user_id},slot.eq.${parsed.data.slot}`);
    if (selErr) {
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }
    const sourceSlot = existing?.find((r) => r.user_id === parsed.data.user_id)?.slot ?? null;
    const occupant =
      existing?.find((r) => r.slot === parsed.data.slot && r.user_id !== parsed.data.user_id)
        ?.user_id ?? null;

    const { error: delPrevErr } = await sb
      .from('event_lines')
      .delete()
      .eq('event_id', event.id)
      .eq('team_side', sideForStorage)
      .or(`user_id.eq.${parsed.data.user_id},slot.eq.${parsed.data.slot}`);
    if (delPrevErr) {
      return NextResponse.json({ error: delPrevErr.message }, { status: 500 });
    }

    const now = new Date().toISOString();
    const rows = [
      {
        event_id: event.id,
        team_side: sideForStorage,
        slot: parsed.data.slot,
        user_id: parsed.data.user_id,
        updated_at: now,
      },
    ];
    // Оба были в звеньях → свап: вытесненный встаёт на освободившийся слот перетащенного.
    // Перетащили из пула (sourceSlot нет) → прежний владелец слота уходит в пул.
    if (occupant && sourceSlot) {
      rows.push({
        event_id: event.id,
        team_side: sideForStorage,
        slot: sourceSlot,
        user_id: occupant,
        updated_at: now,
      });
    }

    const { error: insErr } = await sb.from('event_lines').insert(rows);
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
