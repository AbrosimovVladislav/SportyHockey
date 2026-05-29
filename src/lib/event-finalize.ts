import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

type Sb = SupabaseClient<Database>;

// Минимальный набор полей, который нужен finalize. Любая выборка событий,
// которая включает id/status/ends_at, может пройти через finalizeRows перед
// возвратом наружу.
type FinalizableRow = { id: string; status: string | null; ends_at: string | null };

// Приводит хранимый status события к реальному состоянию по времени окончания
// и сразу пишет изменение в БД. Логика — симметричная:
//  • scheduled + ends_at < now → completed (событие прошло);
//  • completed + ends_at >= now → scheduled (организатор перенёс уже-завершённое
//    событие на будущее через reschedule).
// События без ends_at не трогаем — длительность неизвестна. cancelled не
// трогаем никогда — это отдельная ось.
//
// UPDATE отправляется только при наличии конкретных id для обновления —
// холостых запросов в БД нет. Возвращает тот же массив с подменённым status
// у затронутых строк, чтобы вызывающий код мог сразу формировать DTO.
export async function finalizeRows<T extends FinalizableRow>(
  sb: Sb,
  rows: T[],
): Promise<T[]> {
  const now = Date.now();
  const toComplete: string[] = [];
  const toReopen: string[] = [];

  for (const r of rows) {
    if (!r.ends_at) continue;
    const endsTs = new Date(r.ends_at).getTime();
    if (Number.isNaN(endsTs)) continue;
    if (r.status === 'scheduled' && endsTs < now) toComplete.push(r.id);
    else if (r.status === 'completed' && endsTs >= now) toReopen.push(r.id);
  }

  if (toComplete.length === 0 && toReopen.length === 0) return rows;

  if (toComplete.length > 0) {
    await sb.from('events').update({ status: 'completed' }).in('id', toComplete);
  }
  if (toReopen.length > 0) {
    await sb.from('events').update({ status: 'scheduled' }).in('id', toReopen);
  }

  const completeSet = new Set(toComplete);
  const reopenSet = new Set(toReopen);
  return rows.map((r) => {
    if (completeSet.has(r.id)) return { ...r, status: 'completed' } as T;
    if (reopenSet.has(r.id)) return { ...r, status: 'scheduled' } as T;
    return r;
  });
}
