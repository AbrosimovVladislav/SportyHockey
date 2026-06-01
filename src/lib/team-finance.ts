import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type { TeamBalance, TeamBalanceBreakdown, PlayerBalance } from '@/types/api';

type SB = SupabaseClient<Database>;

// Разбивка баланса команды для карточки на `/money` (v0.5, итерация 51.1).
// Четыре подплитки = четыре независимых среза состояния:
//  • on_hand        — текущий баланс: ∑ player_payment − ∑ expense (occurred_on ≤ today)
//  • debts          — долги игроков (плюс к балансу, будущие поступления)
//  • overpayments   — переплаты игрокам (минус к балансу, команда должна вернуть)
//  • arena_debts    — долги перед площадками: ∑ max(0, arena_cost − arena_paid_amount)
//                     по всем не отменённым событиям (минус к балансу)
//
// Расчётный баланс — реальное финансовое положение:
//   total = on_hand + debts − overpayments − arena_debts
//
// Баланс игрока = ∑ cost_per_player × showed_up по прошедшим событиям
//               − ∑ player_payment − ∑ adjustment + ∑ refund этого игрока.
type AttendanceRow = {
  user_id: string;
  events: { cost_per_player: number | null } | null;
};

type TxRow = {
  amount: number;
  occurred_on: string;
  type: string;
  user_id: string | null;
};

type EventArenaRow = {
  arena_cost: number | null;
  arena_paid_amount: number;
};

export async function computeTeamBalance(sb: SB, teamId: string): Promise<TeamBalance> {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const nowIso = today.toISOString();

  const [attRes, txRes, evRes] = await Promise.all([
    sb
      .from('event_attendances')
      .select('user_id, events!inner(cost_per_player)')
      .eq('showed_up', true)
      .eq('events.team_id', teamId)
      .neq('events.status', 'cancelled')
      .lt('events.starts_at', nowIso),
    sb
      .from('finance_transactions')
      .select('amount, occurred_on, type, user_id')
      .eq('team_id', teamId),
    sb
      .from('events')
      .select('arena_cost, arena_paid_amount')
      .eq('team_id', teamId)
      .neq('status', 'cancelled'),
  ]);

  if (attRes.error) throw new Error(attRes.error.message);
  if (txRes.error) throw new Error(txRes.error.message);
  if (evRes.error) throw new Error(evRes.error.message);

  // Начисления по игрокам.
  const charged = new Map<string, number>();
  for (const r of (attRes.data ?? []) as AttendanceRow[]) {
    const cost = r.events?.cost_per_player != null ? Number(r.events.cost_per_player) : 0;
    if (cost <= 0) continue;
    charged.set(r.user_id, (charged.get(r.user_id) ?? 0) + cost);
  }

  // Оплаты и расходы. on_hand учитывает только occurred_on ≤ today.
  const paid = new Map<string, number>();
  let onHand = 0;

  for (const tx of (txRes.data ?? []) as TxRow[]) {
    const amt = Number(tx.amount);
    if (!Number.isFinite(amt)) continue;
    const day = tx.occurred_on;

    if (tx.type === 'player_payment') {
      onHand += amt;
      if (tx.user_id) paid.set(tx.user_id, (paid.get(tx.user_id) ?? 0) + amt);
    } else if (tx.type === 'expense') {
      // В кассу не входит только то, что ещё не наступило.
      if (day <= todayIso) onHand -= amt;
    } else if (tx.type === 'refund') {
      if (day <= todayIso) onHand -= amt;
      if (tx.user_id) charged.set(tx.user_id, (charged.get(tx.user_id) ?? 0) + amt);
    } else if (tx.type === 'adjustment') {
      if (tx.user_id) paid.set(tx.user_id, (paid.get(tx.user_id) ?? 0) + amt);
    }
  }

  // Долги перед площадками: сумма недоплаты по всем активным событиям.
  let arenaDebts = 0;
  for (const e of (evRes.data ?? []) as EventArenaRow[]) {
    const cost = e.arena_cost != null ? Number(e.arena_cost) : 0;
    const paidAmt = Number(e.arena_paid_amount) || 0;
    const unpaid = cost - paidAmt;
    if (unpaid > 0) arenaDebts += unpaid;
  }

  // Балансы игроков и агрегаты долгов/переплат.
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
    debts,
    overpayments,
    arena_debts: arenaDebts,
  };
  // Расчётный баланс: реальное положение с учётом всех обязательств в обе стороны.
  const total = onHand + debts - overpayments - arenaDebts;

  return { total, breakdown, players };
}
