import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

type Sb = SupabaseClient<Database>;

export type EventOutcome = 'win' | 'draw' | 'loss';

// Пересчитывает сохранённый исход события (events.outcome) по голам result_points.
// Имеет смысл только для type='game'; для тренировок и для игр без зафиксированных
// голов запись очищается в NULL. Вызывается из мутаций голов: POST/PATCH/DELETE
// /api/events/[id]/goals[/goalId]. Ошибки нижнего уровня не валят родительский
// запрос — это вспомогательный пересчёт.
export async function recomputeEventOutcome(
  sb: Sb,
  eventId: string,
): Promise<EventOutcome | null> {
  const { data: ev, error: evErr } = await sb
    .from('events')
    .select('id, type')
    .eq('id', eventId)
    .maybeSingle();
  if (evErr || !ev) return null;

  if (ev.type !== 'game') {
    await sb.from('events').update({ outcome: null }).eq('id', eventId);
    return null;
  }

  const { data: pts, error: ptsErr } = await sb
    .from('result_points')
    .select('team_side')
    .eq('event_id', eventId)
    .eq('type', 'goal');
  if (ptsErr) return null;

  let own = 0;
  let opp = 0;
  for (const p of pts ?? []) {
    if (p.team_side === 'own') own += 1;
    else if (p.team_side === 'opponent') opp += 1;
  }

  if (own === 0 && opp === 0) {
    await sb.from('events').update({ outcome: null }).eq('id', eventId);
    return null;
  }

  const next: EventOutcome = own > opp ? 'win' : own < opp ? 'loss' : 'draw';
  await sb.from('events').update({ outcome: next }).eq('id', eventId);
  return next;
}
