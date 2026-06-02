import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type {
  TeamBalance,
  TeamBalanceBreakdown,
  TeamBalanceSummary,
  TeamBalanceDetails,
  PlayerBalance,
} from '@/types/api';

type SB = SupabaseClient<Database>;

// Разбивка баланса команды для карточки на `/money` (v0.5, итерации 51.1 + 57).
// Четыре независимых среза + два агрегата + переплаты площадкам:
//  • on_hand              — текущий баланс: ∑ player_payment − ∑ expense − ∑ refund
//  • players_debts        — долги игроков (плюс)
//  • players_overpayments — переплаты игроков (минус, команда должна им вернуть)
//  • arena_debts          — долги площадкам: ∑ max(0, arena_cost − arena_paid) по активным событиям
//  • arena_overpayments   — переплаты площадкам: ∑ max(0, arena_paid − arena_cost) по активным событиям
//
// Агрегаты для нового layout `/money`:
//   owed_to_us = players_debts + arena_overpayments   (плюс к балансу)
//   owed_by_us = players_overpayments + arena_debts   (минус к балансу)
//
// Расчётный баланс:
//   total = on_hand + owed_to_us − owed_by_us
//         = on_hand + players_debts + arena_overpayments − players_overpayments − arena_debts
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
  category: string | null;
  user_id: string | null;
  event_id: string | null;
};

type EventArenaRow = {
  id: string;
  arena_cost: number | null;
};

// `asOf` (YYYY-MM-DD) — день, на конец которого считаем срез. По умолчанию —
// сегодня. Для финансового среза `/money/report` сюда передаётся последний
// день выбранного месяца, и все 4 плитки + расчётный баланс пересчитываются
// «как будто этот день закончился»:
//   • on_hand     = ∑ player_payment(o ≤ asOf) − ∑ expense/refund(o ≤ asOf)
//   • charged     = ∑ cost_per_player по showed_up на событиях starts_at ≤ asOf
//   • paid        = ∑ player_payment(o ≤ asOf) + ∑ adjustment(o ≤ asOf) по игроку
//   • arena_debts = ∑ max(0, arena_cost − arena_paid_at_asOf) по событиям ≠ cancelled,
//                   где arena_paid_at_asOf считается из expense-категории 'arena'
//                   с occurred_on ≤ asOf (а не из денормализованной колонки).
export async function computeTeamBalance(
  sb: SB,
  teamId: string,
  asOf?: string,
): Promise<TeamBalance> {
  const today = new Date();
  const effectiveAsOf = asOf ?? today.toISOString().slice(0, 10);
  // Для starts_at сравнения берём конец дня asOf в UTC — событие, которое
  // началось 31 мая в любой час, должно попасть в срез за май.
  const cutoffIso = `${effectiveAsOf}T23:59:59.999Z`;

  const [attRes, txRes, evRes] = await Promise.all([
    sb
      .from('event_attendances')
      .select('user_id, events!inner(cost_per_player)')
      .eq('showed_up', true)
      .eq('events.team_id', teamId)
      .neq('events.status', 'cancelled')
      .lt('events.starts_at', cutoffIso),
    sb
      .from('finance_transactions')
      .select('amount, occurred_on, type, category, user_id, event_id')
      .eq('team_id', teamId)
      .lte('occurred_on', effectiveAsOf),
    sb
      .from('events')
      .select('id, arena_cost')
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

  // Оплаты и расходы. SQL уже отфильтровал occurred_on ≤ asOf, поэтому
  // здесь просто суммируем.
  const paid = new Map<string, number>();
  let onHand = 0;
  // arena_paid по каждому событию — считаем из транзакций, а не из колонки
  // events.arena_paid_amount: денормализованная колонка хранит «сегодняшнее»
  // состояние, а для среза на прошлый/будущий месяц нужно «состояние на asOf».
  const arenaPaidByEvent = new Map<string, number>();

  for (const tx of (txRes.data ?? []) as TxRow[]) {
    const amt = Number(tx.amount);
    if (!Number.isFinite(amt)) continue;

    if (tx.type === 'player_payment') {
      onHand += amt;
      if (tx.user_id) paid.set(tx.user_id, (paid.get(tx.user_id) ?? 0) + amt);
    } else if (tx.type === 'expense') {
      onHand -= amt;
      if (tx.category === 'arena' && tx.event_id) {
        arenaPaidByEvent.set(
          tx.event_id,
          (arenaPaidByEvent.get(tx.event_id) ?? 0) + amt,
        );
      }
    } else if (tx.type === 'refund') {
      onHand -= amt;
      if (tx.user_id) charged.set(tx.user_id, (charged.get(tx.user_id) ?? 0) + amt);
    } else if (tx.type === 'adjustment') {
      if (tx.user_id) paid.set(tx.user_id, (paid.get(tx.user_id) ?? 0) + amt);
    }
  }

  // Долги и переплаты по площадкам на дату `asOf`. Считаем симметрично:
  // недоплата уходит в arena_debts (минус к балансу), переплата — в
  // arena_overpayments (плюс, у площадки наш «депозит»).
  let arenaDebts = 0;
  let arenaOverpayments = 0;
  for (const e of (evRes.data ?? []) as EventArenaRow[]) {
    const cost = e.arena_cost != null ? Number(e.arena_cost) : 0;
    const paidAmt = arenaPaidByEvent.get(e.id) ?? 0;
    const diff = paidAmt - cost;
    if (diff < 0) arenaDebts += -diff;
    else if (diff > 0) arenaOverpayments += diff;
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

  const owedToUs = debts + arenaOverpayments;
  const owedByUs = overpayments + arenaDebts;

  const summary: TeamBalanceSummary = {
    on_hand: onHand,
    owed_to_us: owedToUs,
    owed_by_us: owedByUs,
  };

  const details: TeamBalanceDetails = {
    owed_to_us: {
      players_debts: debts,
      arena_overpayments: arenaOverpayments,
    },
    owed_by_us: {
      arena_debts: arenaDebts,
      players_overpayments: overpayments,
    },
  };

  // Расчётный баланс: реальное положение с учётом обязательств в обе стороны.
  const total = onHand + owedToUs - owedByUs;

  return { total, breakdown, summary, details, players };
}
