import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

type SB = SupabaseClient<Database>;

// Пересчёт events.arena_paid_amount по фактическим транзакциям аренды события.
// Вызывается из POST/PATCH/DELETE /api/finance после успешной мутации.
// Денормализация (колонка вместо on-fly агрегата) сделана сознательно — она
// сильно упрощает чтение списков событий и расчёт долгов по аренде, цена —
// этот хелпер, который запускается из трёх роутов.
export async function syncArenaPaidAmount(sb: SB, eventId: string | null | undefined): Promise<void> {
  if (!eventId) return;
  const { data, error } = await sb
    .from('finance_transactions')
    .select('amount')
    .eq('event_id', eventId)
    .eq('to_kind', 'venue');
  if (error) throw new Error(error.message);
  const total = (data ?? []).reduce((acc, r) => acc + Number(r.amount), 0);
  const { error: updErr } = await sb
    .from('events')
    .update({ arena_paid_amount: total })
    .eq('id', eventId);
  if (updErr) throw new Error(updErr.message);
}

// Helper для PATCH: получает старое и новое event_id, отфильтровывает дубли
// и null'ы, синхронизирует каждое уникальное.
export async function syncArenaPaidAmountForChange(
  sb: SB,
  oldEventId: string | null | undefined,
  newEventId: string | null | undefined,
): Promise<void> {
  const ids = new Set<string>();
  if (oldEventId) ids.add(oldEventId);
  if (newEventId) ids.add(newEventId);
  for (const id of ids) {
    await syncArenaPaidAmount(sb, id);
  }
}
