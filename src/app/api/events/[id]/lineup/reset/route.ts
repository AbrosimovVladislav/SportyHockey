import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventType } from '@/lib/event-enum';
import { buildDefaultLineupRows, insertDefaultLineupRows } from '@/lib/apply-default-lineup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// Сброс раскидки события к дефолту команды: удаляем текущие звенья/стороны события и
// заново копируем дефолт. Явку (event_attendances) не трогаем — это другая таблица.
export async function POST(_req: Request, { params }: Params): Promise<Response> {
  try {
    const ctx = await requireOrganizer(_req);
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
    if (!event || event.team_id !== ctx.team_id) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    // Сначала собираем новую раскидку из дефолта команды. Если собрать не удалось —
    // НЕ трогаем текущую (иначе сброс мог бы молча обнулить состав).
    const rows = await buildDefaultLineupRows(
      event.id,
      asEventType(event.type),
      event.team_id,
    );
    if (!rows) {
      return NextResponse.json(
        { error: 'Не удалось собрать дефолтную раскидку' },
        { status: 500 },
      );
    }

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

    const inserted = await insertDefaultLineupRows(rows);
    if (!inserted) {
      return NextResponse.json(
        { error: 'Не удалось записать дефолтную раскидку' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
