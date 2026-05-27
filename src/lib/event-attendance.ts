import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type { AttendanceCount } from '@/types/api';

export function emptyAttendance(): AttendanceCount {
  return { going: 0, not_going: 0 };
}

export async function loadAttendance(
  sb: SupabaseClient<Database>,
  eventIds: string[],
): Promise<Map<string, AttendanceCount>> {
  const map = new Map<string, AttendanceCount>();
  for (const id of eventIds) map.set(id, emptyAttendance());
  if (eventIds.length === 0) return map;

  // TODO: при росте до тысяч голосов перевести на агрегацию SQL (group by event_id, vote)
  const { data } = await sb
    .from('event_attendances')
    .select('event_id, vote')
    .in('event_id', eventIds);

  for (const row of data ?? []) {
    const cnt = map.get(row.event_id);
    if (!cnt) continue;
    if (row.vote === 'going') cnt.going += 1;
    else if (row.vote === 'not_going') cnt.not_going += 1;
  }
  return map;
}
