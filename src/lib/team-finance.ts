import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type { TeamBalance, TeamBalanceBreakdown, PlayerBalance } from '@/types/api';

type SB = SupabaseClient<Database>;

// Допущения, на которых построена разбивка (см. docs/roadmap/v0.5.md):
//  • Долг игрока = ∑ cost_per_player по посещённым прошедшим событиям
//    минус ∑ player_payment минус ∑ adjustment плюс ∑ refund для этого игрока.
//  • На руках = ∑ player_payment (по всем игрокам, любой даты) минус
//    ∑ expense с occurred_on ≤ today (refund и adjustment в кассу команды
//    не входят — refund «вытекает» из кассы наружу как expense к игроку,
//    adjustment — это списание/прощение долга без движения денег).
//  • Будущие аренды = ∑ expense (category=arena) с occurred_on > today.
//  • Переплаты = сумма |balance| игроков с balance < 0.
//  • Долги = сумма balance игроков с balance > 0.
//
// Все суммы хранятся как числа без знака (positive amount); знак трактуется
// типом операции на агрегации.

type AttendanceRow = {
  user_id: string;
  events: { cost_per_player: number | null } | null;
};

type TxRow = {
  amount: number;
  category: string | null;
  occurred_on: string;
  type: string;
  user_id: string | null;
};

export async function computeTeamBalance(sb: SB, teamId: string): Promise<TeamBalance> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  const [attRes, txRes] = await Promise.all([
    sb
      .from('event_attendances')
      .select('user_id, events!inner(cost_per_player)')
      .eq('showed_up', true)
      .eq('events.team_id', teamId)
      .neq('events.status', 'cancelled')
      .lt('events.starts_at', nowIso),
    sb
      .from('finance_transactions')
      .select('amount, category, occurred_on, type, user_id')
      .eq('team_id', teamId),
  ]);

  if (attRes.error) throw new Error(attRes.error.message);
  if (txRes.error) throw new Error(txRes.error.message);

  // Начисления игрокам по событиям — копилка charged по user_id.
  const charged = new Map<string, number>();
  for (const r of (attRes.data ?? []) as AttendanceRow[]) {
    const cost = r.events?.cost_per_player != null ? Number(r.events.cost_per_player) : 0;
    if (cost <= 0) continue;
    charged.set(r.user_id, (charged.get(r.user_id) ?? 0) + cost);
  }

  // Оплаты / возвраты / корректировки по игрокам + наличные / будущие аренды.
  const paid = new Map<string, number>();
  let onHand = 0;
  let futureArenas = 0;

  for (const tx of (txRes.data ?? []) as TxRow[]) {
    const amt = Number(tx.amount);
    if (!Number.isFinite(amt)) continue;
    const day = tx.occurred_on;

    if (tx.type === 'player_payment') {
      onHand += amt;
      if (tx.user_id) paid.set(tx.user_id, (paid.get(tx.user_id) ?? 0) + amt);
    } else if (tx.type === 'expense') {
      if (tx.category === 'arena' && day > todayIso) {
        futureArenas += amt;
      } else if (day <= todayIso) {
        onHand -= amt;
      }
    } else if (tx.type === 'refund') {
      // Возврат игроку: деньги ушли из кассы наружу — как обычный расход;
      // долг игрока «возвращается обратно» (зачисление в charged).
      if (day <= todayIso) onHand -= amt;
      if (tx.user_id) charged.set(tx.user_id, (charged.get(tx.user_id) ?? 0) + amt);
    } else if (tx.type === 'adjustment') {
      // Корректировка баланса игрока без движения денег. Положительная
      // (amount > 0) — уменьшает долг (как оплата без кассы); реализация
      // отрицательных корректировок — позже, через знак в отдельном поле.
      if (tx.user_id) paid.set(tx.user_id, (paid.get(tx.user_id) ?? 0) + amt);
    }
  }

  // Итог по игрокам: положительный balance — игрок должен; отрицательный — переплата.
  const userIds = new Set<string>([...charged.keys(), ...paid.keys()]);
  let debts = 0;
  let overpayments = 0;
  const players: PlayerBalance[] = [];
  for (const uid of userIds) {
    const ch = charged.get(uid) ?? 0;
    const pd = paid.get(uid) ?? 0;
    const balance = ch - pd;
    players.push({ user_id: uid, total_charged: ch, total_paid: pd, balance });
    if (balance > 0) debts += balance;
    else if (balance < 0) overpayments += -balance;
  }

  const breakdown: TeamBalanceBreakdown = {
    on_hand: onHand,
    future_arenas: futureArenas,
    overpayments,
    debts,
  };
  const total = onHand - futureArenas - overpayments + debts;

  return { total, breakdown, players };
}
