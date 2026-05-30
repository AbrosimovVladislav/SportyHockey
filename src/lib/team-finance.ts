import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type { TeamBalance, TeamBalanceBreakdown, PlayerBalance } from '@/types/api';

type SB = SupabaseClient<Database>;

// Разбивка баланса команды для карточки на `/money`.
// Подплитки — четыре независимых среза, не сумма:
//  • on_hand          = ∑ player_payment − ∑ expense (occurred_on ≤ today)
//  • arenas_this_month= ∑ expense (category=arena) c occurred_on внутри текущего календарного месяца
//                       (включая уже оплаченные и запланированные)
//  • overpayments     = ∑ |balance| у игроков, где команда должна игроку
//  • debts            = ∑ balance у игроков, где игрок должен команде
//
// Формула total — без вычета аренд (они уже учтены в on_hand как expense):
//   total = on_hand − overpayments + debts
//
// Баланс игрока = ∑ cost_per_player × showed_up по прошедшим событиям
//               − ∑ player_payment − ∑ adjustment + ∑ refund этого игрока.
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
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const { firstDay, lastDay } = monthRange(today);
  const nowIso = today.toISOString();

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

  // Начисления по игрокам.
  const charged = new Map<string, number>();
  for (const r of (attRes.data ?? []) as AttendanceRow[]) {
    const cost = r.events?.cost_per_player != null ? Number(r.events.cost_per_player) : 0;
    if (cost <= 0) continue;
    charged.set(r.user_id, (charged.get(r.user_id) ?? 0) + cost);
  }

  // Оплаты и расходы.
  const paid = new Map<string, number>();
  let onHand = 0;
  let arenasThisMonth = 0;

  for (const tx of (txRes.data ?? []) as TxRow[]) {
    const amt = Number(tx.amount);
    if (!Number.isFinite(amt)) continue;
    const day = tx.occurred_on;

    if (tx.type === 'player_payment') {
      onHand += amt;
      if (tx.user_id) paid.set(tx.user_id, (paid.get(tx.user_id) ?? 0) + amt);
    } else if (tx.type === 'expense') {
      // В кассу уже не входит только то, что ещё не наступило.
      if (day <= todayIso) onHand -= amt;
      // В «Аренды этого месяца» — все аренды текущего календарного месяца
      // (и прошедшие, и запланированные).
      if (tx.category === 'arena' && day >= firstDay && day <= lastDay) {
        arenasThisMonth += amt;
      }
    } else if (tx.type === 'refund') {
      if (day <= todayIso) onHand -= amt;
      if (tx.user_id) charged.set(tx.user_id, (charged.get(tx.user_id) ?? 0) + amt);
    } else if (tx.type === 'adjustment') {
      if (tx.user_id) paid.set(tx.user_id, (paid.get(tx.user_id) ?? 0) + amt);
    }
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
    arenas_this_month: arenasThisMonth,
    overpayments,
    debts,
  };
  // Аренды в total не вычитаем — они уже учтены в on_hand для уже оплаченных,
  // запланированные показываются справочно в подплитке.
  const total = onHand - overpayments + debts;

  return { total, breakdown, players };
}

function monthRange(d: Date): { firstDay: string; lastDay: string } {
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = new Date(Date.UTC(y, m, 1));
  const last = new Date(Date.UTC(y, m + 1, 0));
  return { firstDay: first.toISOString().slice(0, 10), lastDay: last.toISOString().slice(0, 10) };
}
