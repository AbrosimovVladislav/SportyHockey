import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

type SB = SupabaseClient<Database>;

// Кассу команды нельзя загонять в минус: на руках не может быть меньше нуля
// рублей. Перед записью/правкой/удалением любой транзакции, которая трогает
// on_hand, считаем итог и отказываем, если результат отрицательный.
//
// Формула on_hand копирует team-finance.ts (v0.5, итерация 60 — ledger):
//   to_kind='team'   : +amount
//   from_kind='team' : −amount  (только если occurred_on ≤ сегодня)
//   adjustment: 0 (это перенос долга, не движение денег)
//
// В POST/PATCH/[id] до записи в БД у нас на руках только legacy-формат
// (type/amount/occurred_on) — поэтому `onHandDelta` принимает legacy и сам
// мапит type → направление кассы.

type MinimalTx = { type: string; amount: number | string; occurred_on: string };

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Дельта on_hand от одной транзакции.
//   player_payment: +amount (касса растёт всегда — депозиты могут лечь на будущую дату,
//     но в нашей модели взносы оформляются по факту, occurred_on ≤ today)
//   expense, refund: −amount, но только если occurred_on ≤ today
//   adjustment: 0
export function onHandDelta(tx: MinimalTx, today: string): number {
  const amt = Number(tx.amount);
  if (!Number.isFinite(amt)) return 0;
  if (tx.type === 'player_payment') return amt;
  if (tx.type === 'expense' || tx.type === 'refund') {
    return tx.occurred_on <= today ? -amt : 0;
  }
  return 0;
}

// Текущая касса команды. SELECT'им ledger-поля и считаем кассу как
// `Σ(to=team) − Σ(from=team)` с поправкой на «будущие» расходы (они в кассу
// пока не падают).
export async function currentOnHand(sb: SB, teamId: string): Promise<number> {
  const today = todayIso();
  const { data, error } = await sb
    .from('finance_transactions')
    .select('amount, occurred_on, kind, from_kind, to_kind')
    .eq('team_id', teamId);
  if (error) throw new Error(error.message);
  let onHand = 0;
  for (const r of (data ?? []) as Array<{
    amount: number | string;
    occurred_on: string;
    kind: string;
    from_kind: string | null;
    to_kind: string | null;
  }>) {
    const amt = Number(r.amount);
    if (!Number.isFinite(amt)) continue;
    if (r.kind !== 'transfer') continue; // adjustment кассу не двигает
    if (r.to_kind === 'team') {
      // Поступление в кассу. В нашей модели оформляется по факту — без
      // фильтра по дате (как в исторической логике до итерации 60).
      onHand += amt;
    }
    if (r.from_kind === 'team') {
      // Списание. Будущие расходы (запланированные аренды) в кассу не падают
      // — они вычитаются только когда дата операции наступит.
      if (r.occurred_on <= today) onHand -= amt;
    }
  }
  return onHand;
}

// Текст для ответа API; client выводит как `e.message` в bottomsheet'е.
export function insufficientOnHandMessage(available: number): string {
  const formatted = Math.max(0, available).toLocaleString('ru-RU');
  return `Недостаточно денег на руках: доступно ${formatted} ₽`;
}
