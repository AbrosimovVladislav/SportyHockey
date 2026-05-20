import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireOrganizer } from '@/lib/auth';
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

    if (isGame) {
      const { data: att } = await sb
        .from('event_attendances')
        .select('vote, showed_up')
        .eq('event_id', event.id)
        .eq('user_id', parsed.data.user_id)
        .maybeSingle();
      const isEligible = att && (att.vote === 'going' || att.showed_up === true);
      if (!isEligible) {
        return NextResponse.json({ error: 'Игрок не идёт на игру' }, { status: 400 });
      }
    } else {
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

    const { error: delPrevErr } = await sb
      .from('event_lines')
      .delete()
      .eq('event_id', event.id)
      .eq('team_side', sideForStorage)
      .or(`user_id.eq.${parsed.data.user_id},slot.eq.${parsed.data.slot}`);
    if (delPrevErr) {
      return NextResponse.json({ error: delPrevErr.message }, { status: 500 });
    }

    const { error: insErr } = await sb.from('event_lines').insert({
      event_id: event.id,
      team_side: sideForStorage,
      slot: parsed.data.slot,
      user_id: parsed.data.user_id,
      updated_at: new Date().toISOString(),
    });
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
