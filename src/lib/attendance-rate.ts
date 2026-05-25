import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import { asEventStatus } from '@/lib/event-enum';

type SB = SupabaseClient<Database>;

// Прошедшее событие: не отменено + время уже наступило (ends_at, иначе starts_at).
export function isPastEvent(
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

function joinedTs(joinedAt: string | null): number {
  if (!joinedAt) return 0;
  const ts = new Date(joinedAt).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

/**
 * Посещаемость («Надёжность») каждого игрока: showed_up=true / число прошедших
 * не-отменённых событий команды, начавшихся ПОСЛЕ вступления игрока (joined_at).
 * Справедливо к новичкам. null — у игрока ещё не было событий за период членства.
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
  const pastEvents = (events ?? [])
    .filter((e) => isPastEvent(e.status, e.ends_at, e.starts_at, now))
    .map((e) => ({ id: e.id, startsTs: new Date(e.starts_at).getTime() }));

  if (pastEvents.length === 0) {
    for (const id of userIds) result.set(id, null);
    return result;
  }

  const { data: mems } = await sb
    .from('team_memberships')
    .select('user_id, joined_at')
    .eq('team_id', teamId)
    .in('user_id', userIds);
  const joinedByUser = new Map<string, number>();
  for (const m of mems ?? []) joinedByUser.set(m.user_id, joinedTs(m.joined_at));

  const pastIds = pastEvents.map((e) => e.id);
  const { data: attendances } = await sb
    .from('event_attendances')
    .select('user_id, event_id')
    .eq('showed_up', true)
    .in('event_id', pastIds)
    .in('user_id', userIds);
  const showedByUser = new Map<string, Set<string>>();
  for (const a of attendances ?? []) {
    const set = showedByUser.get(a.user_id) ?? new Set<string>();
    set.add(a.event_id);
    showedByUser.set(a.user_id, set);
  }

  for (const uid of userIds) {
    const joined = joinedByUser.get(uid) ?? 0;
    const eligible = pastEvents.filter((e) => e.startsTs >= joined);
    if (eligible.length === 0) {
      result.set(uid, null);
      continue;
    }
    const showed = showedByUser.get(uid) ?? new Set<string>();
    let num = 0;
    for (const e of eligible) if (showed.has(e.id)) num += 1;
    result.set(uid, Math.round((num / eligible.length) * 100));
  }
  return result;
}
