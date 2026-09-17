import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { publishEventAnnouncement, type AnnounceFailReason } from '@/lib/announce';
import type { AnnounceEventResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Анонс в канал скачивает фото и загружает его в Telegram — даём запас по времени
// сверх стандартных 10 с serverless-функции.
export const maxDuration = 30;

// Итерация 70 — ручная публикация анонса события в Telegram-канал команды.
// Повторный вызов публикует новый пост (старый не трогаем — так видно историю).

const FAIL_STATUS: Record<AnnounceFailReason, number> = {
  event_not_found: 404,
  no_channel: 409,
  bot_no_access: 409,
  send_failed: 502,
};

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const { id } = await params;

    const { data: event, error } = await supabaseServer()
      .from('events')
      .select('id, team_id, status')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!event || event.team_id !== org.team_id) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }
    if (event.status === 'cancelled') {
      return NextResponse.json({ error: 'Событие отменено — анонсировать нечего' }, { status: 409 });
    }

    const result = await publishEventAnnouncement(event.id, org.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: FAIL_STATUS[result.reason] });
    }

    const body: AnnounceEventResponse = { ok: true, announced_at: new Date().toISOString() };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
