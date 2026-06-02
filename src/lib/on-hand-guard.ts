import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

type SB = SupabaseClient<Database>;

// Кассу команды нельзя загонять в минус: на руках не может быть меньше нуля
// рублей. Перед записью/правкой/удалением любой транзакции, которая трогает
// on_hand, считаем итог и отказываем, если результат отрицательный.
//
// Формула on_hand копирует team-finance.ts:
//   player_payment: всегда +amount
//   expense, refund: −amount, но только если occurred_on ≤ сегодня
//   adjustment: 0 (это перенос долга, не движение денег)

type MinimalTx = { type: string; amount: number | string; occurred_on: string };

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function onHandDelta(tx: MinimalTx, today: string): number {
  const amt = Number(tx.amount);
  if (!Number.isFinite(amt)) return 0;
  if (tx.type === 'player_payment') return amt;
  if (tx.type === 'expense' || tx.type === 'refund') {
    return tx.occurred_on <= today ? -amt : 0;
  }
  return 0;
}

export async function currentOnHand(sb: SB, teamId: string): Promise<number> {
  const today = todayIso();
  const { data, error } = await sb
    .from('finance_transactions')
    .select('amount, occurred_on, type')
    .eq('team_id', teamId);
  if (error) throw new Error(error.message);
  let onHand = 0;
  for (const r of (data ?? []) as MinimalTx[]) {
    onHand += onHandDelta(r, today);
  }
  return onHand;
}

// Текст для ответа API; client выводит как `e.message` в bottomsheet'е.
export function insufficientOnHandMessage(available: number): string {
  const formatted = Math.max(0, available).toLocaleString('ru-RU');
  return `Недостаточно денег на руках: доступно ${formatted} ₽`;
}
