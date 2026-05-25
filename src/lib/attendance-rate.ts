import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import { asEventStatus } from '@/lib/event-enum';

type SB = SupabaseClient<Database>;

// Прошедшее событие: не отменено + время уже наступило (ends_at, иначе starts_at).
function isPastEvent(
  status: string | null,
  endsAt: string | null,
  startsAt: string,
  now: number,
): boolean {
  const s = asEventStatus(status);
  if (s === 'cancelled') return false;
  if (s === 'completed') return true;
  const ref = endsAt ?? startsAt;
  const ts = new Date(ref).getTime();
  return !Number.isNaN(ts) && ts < now;
}

/**
 * Считает посещаемость каждого игрока: showed_up=true / число прошедших
 * не-отменённых событий команды. Знаменатель общий по команде.
 * Возвращает Map user_id → процент (0–100) или null, если у команды нет
 * прошедших событий.
 */
export async function computeAttendanceRates(
  sb: SB,
  teamId: string,
  userIds: string[],
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>();
  if (userIds.length === 0) return result;

  const { data: events } = await sb
    .from('events')
    .select('id, status, ends_at, starts_at')
    .eq('team_id', teamId);

  const now = Date.now();
  const pastIds = (events ?? [])
    .filter((e) => isPastEvent(e.status, e.ends_at, e.starts_at, now))
    .map((e) => e.id);

  if (pastIds.length === 0) {
    for (const id of userIds) result.set(id, null);
    return result;
  }

  const { data: attendances } = await sb
    .from('event_attendances')
    .select('user_id')
    .eq('showed_up', true)
    .in('event_id', pastIds)
    .in('user_id', userIds);

  const showed = new Map<string, number>();
  for (const a of attendances ?? []) {
    showed.set(a.user_id, (showed.get(a.user_id) ?? 0) + 1);
  }

  const total = pastIds.length;
  for (const id of userIds) {
    result.set(id, Math.round(((showed.get(id) ?? 0) / total) * 100));
  }
  return result;
}
