import { NextResponse } from 'next/server';
import { AuthError, requireUser, assertTeamMember } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventType } from '@/lib/event-enum';
import { applyDefaultLineup } from '@/lib/apply-default-lineup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// Сброс раскидки события к дефолту команды: удаляем текущие звенья/стороны события и
// заново копируем дефолт. Явку (event_attendances) не трогаем — это другая таблица.
export async function POST(_req: Request, { params }: Params): Promise<Response> {
  try {
    const user = await requireUser(_req);
    const { id: eventId } = await params;

    const sb = supabaseServer();
    const { data: event, error: evErr } = await sb
      .from('events')
      .select('id, team_id, type')
      .eq('id', eventId)
      .maybeSingle();
    if (evErr) {
      return NextResponse.json({ error: evErr.message }, { status: 500 });
    }
    if (!event) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }
    // Раскидку двигают все участники команды (см. roadmap 32.5) — сброс тоже.
    await assertTeamMember(user.id, event.team_id);

    const { error: delLinesErr } = await sb
      .from('event_lines')
      .delete()
      .eq('event_id', event.id);
    if (delLinesErr) {
      return NextResponse.json({ error: delLinesErr.message }, { status: 500 });
    }
    const { error: delSidesErr } = await sb
      .from('event_lineups')
      .delete()
      .eq('event_id', event.id);
    if (delSidesErr) {
      return NextResponse.json({ error: delSidesErr.message }, { status: 500 });
    }

    await applyDefaultLineup(event.id, asEventType(event.type), event.team_id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
