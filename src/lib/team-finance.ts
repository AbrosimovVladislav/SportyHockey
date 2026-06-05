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

// Разбивка баланса команды для карточки на `/money` (v0.5, итерация 58 — ledger).
// Все движения денег — это transfer-транзакции с заполненными from/to сторонами
// (`from_kind`, `to_kind` ∈ {user, team, venue, external}). adjustment — без
// движения денег, односторонне начисляет/списывает на счёт игрока.
//
// Шесть независимых срезов в `details` + три агрегата в `summary`:
//   on_hand              = Σ(to_kind='team') − Σ(from_kind='team')
//   players_debts        = Σ max(0, charged − paid) по игрокам
//   players_overpayments = Σ max(0, paid − charged) по игрокам
//   arena_debts          = Σ max(0, cost_v − paid_v) по площадкам v
//   arena_overpayments   = Σ max(0, paid_v − cost_v) по площадкам v
//   external_*           = Σ max(0, ±) по external_label
//
// Per-venue, а не per-event: депозит / переплата на одном событии гасит долг
// на другом за той же площадкой. Командный total от этого не зависит
// (Σ paid − Σ cost одинаков при любой группировке).
//
// Расчётный баланс:
//   total = on_hand + owed_to_us − owed_by_us
//   owed_to_us = players_debts + arena_overpayments + external_receivables
//   owed_by_us = players_overpayments + arena_debts + external_overpayments
//
// charged игрока = ∑ cost_per_player по showed_up + ∑ refund (transfer team→user).
// paid игрока    = ∑ player_payment (transfer user→team) + ∑ adjustment(to_user_id=U).
//
// `asOf` (YYYY-MM-DD) — день, на конец которого считаем срез. По умолчанию —
// сегодня. Для финансового среза `/money/report` сюда передаётся последний
// день выбранного месяца, и все плитки + расчётный баланс пересчитываются
// «как будто этот день закончился».
type AttendanceRow = {
  user_id: string;
  events: { cost_per_player: number | null } | null;
};

type TxRow = {
  amount: number;
  occurred_on: string;
  kind: string;
  from_kind: string | null;
  to_kind: string | null;
  from_user_id: string | null;
  to_user_id: string | null;
  from_venue_id: string | null;
  to_venue_id: string | null;
  external_label: string | null;
};

type EventArenaRow = {
  id: string;
  venue_id: string | null;
  arena_cost: number | null;
};

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
      .select(
        'amount, occurred_on, kind, from_kind, to_kind, from_user_id, to_user_id, from_venue_id, to_venue_id, external_label',
      )
      .eq('team_id', teamId)
      .lte('occurred_on', effectiveAsOf),
    sb
      .from('events')
      .select('id, venue_id, arena_cost')
      .eq('team_id', teamId)
      .neq('status', 'cancelled')
      .lt('starts_at', cutoffIso),
  ]);

  if (attRes.error) throw new Error(attRes.error.message);
  if (txRes.error) throw new Error(txRes.error.message);
  if (evRes.error) throw new Error(evRes.error.message);

  // 1) Начисления по игрокам по факту showed_up.
  const charged = new Map<string, number>();
  for (const r of (attRes.data ?? []) as AttendanceRow[]) {
    const cost = r.events?.cost_per_player != null ? Number(r.events.cost_per_player) : 0;
    if (cost <= 0) continue;
    charged.set(r.user_id, (charged.get(r.user_id) ?? 0) + cost);
  }

  // 2) Прогон транзакций. SQL уже отфильтровал occurred_on ≤ asOf.
  const paid = new Map<string, number>();
  const paidByVenue = new Map<string, number>(); // venue_id → Σ amount транзакций to_venue
  // external по label считается симметрично: paid — мы отдали наружу, received —
  // нам вернули. Из положительной дельты следует переплата (они должны нам),
  // из отрицательной — задолженность (мы должны им).
  const externalPaid = new Map<string, number>(); // label → Σ amount to_external
  const externalReceived = new Map<string, number>(); // label → Σ amount from_external
  let onHand = 0;

  for (const tx of (txRes.data ?? []) as TxRow[]) {
    const amt = Number(tx.amount);
    if (!Number.isFinite(amt)) continue;

    if (tx.kind === 'transfer') {
      // on_hand: касса меняется только когда team — одна из сторон.
      if (tx.to_kind === 'team') onHand += amt;
      if (tx.from_kind === 'team') onHand -= amt;

      // Балансы игроков.
      if (tx.from_kind === 'user' && tx.from_user_id) {
        paid.set(tx.from_user_id, (paid.get(tx.from_user_id) ?? 0) + amt);
      }
      if (tx.to_kind === 'user' && tx.to_user_id) {
        charged.set(tx.to_user_id, (charged.get(tx.to_user_id) ?? 0) + amt);
      }

      // Балансы площадок.
      if (tx.to_kind === 'venue' && tx.to_venue_id) {
        paidByVenue.set(
          tx.to_venue_id,
          (paidByVenue.get(tx.to_venue_id) ?? 0) + amt,
        );
      }
      if (tx.from_kind === 'venue' && tx.from_venue_id) {
        paidByVenue.set(
          tx.from_venue_id,
          (paidByVenue.get(tx.from_venue_id) ?? 0) - amt,
        );
      }

      // Балансы external (по label).
      if (tx.to_kind === 'external' && tx.external_label) {
        externalPaid.set(
          tx.external_label,
          (externalPaid.get(tx.external_label) ?? 0) + amt,
        );
      }
      if (tx.from_kind === 'external' && tx.external_label) {
        externalReceived.set(
          tx.external_label,
          (externalReceived.get(tx.external_label) ?? 0) + amt,
        );
      }
    } else if (tx.kind === 'adjustment') {
      // adjustment — одностороннее начисление в пользу игрока. Касса не двигается.
      if (tx.to_user_id) {
        paid.set(tx.to_user_id, (paid.get(tx.to_user_id) ?? 0) + amt);
      }
    }
  }

  // 3) Долги и переплаты по площадкам. Стоимость аренды считаем по событиям
  // на дату asOf — все не отменённые события с venue_id, чей starts_at ≤ asOf.
  const costByVenue = new Map<string, number>();
  for (const e of (evRes.data ?? []) as EventArenaRow[]) {
    if (!e.venue_id) continue;
    const cost = e.arena_cost != null ? Number(e.arena_cost) : 0;
    if (cost <= 0) continue;
    costByVenue.set(e.venue_id, (costByVenue.get(e.venue_id) ?? 0) + cost);
  }
  let arenaDebts = 0;
  let arenaOverpayments = 0;
  const venueIds = new Set<string>([...costByVenue.keys(), ...paidByVenue.keys()]);
  for (const vid of venueIds) {
    const cost = costByVenue.get(vid) ?? 0;
    const paidAmt = paidByVenue.get(vid) ?? 0;
    const diff = paidAmt - cost;
    if (diff < 0) arenaDebts += -diff;
    else if (diff > 0) arenaOverpayments += diff;
  }

  // 4) External: сводим paid/received per label, дельта определяет сторону.
  //   paid > received → external должен нам (external_receivables)
  //   received > paid → мы должны external (external_overpayments)
  let externalOverpayments = 0;
  let externalReceivables = 0;
  const labels = new Set<string>([
    ...externalPaid.keys(),
    ...externalReceived.keys(),
  ]);
  for (const label of labels) {
    const p = externalPaid.get(label) ?? 0;
    const r = externalReceived.get(label) ?? 0;
    const diff = p - r;
    if (diff > 0) externalReceivables += diff;
    else if (diff < 0) externalOverpayments += -diff;
  }

  // 5) Балансы игроков и агрегаты долгов/переплат.
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

  const owedToUs = debts + arenaOverpayments + externalReceivables;
  const owedByUs = overpayments + arenaDebts + externalOverpayments;

  const summary: TeamBalanceSummary = {
    on_hand: onHand,
    owed_to_us: owedToUs,
    owed_by_us: owedByUs,
  };

  const details: TeamBalanceDetails = {
    owed_to_us: {
      players_debts: debts,
      arena_overpayments: arenaOverpayments,
      external_receivables: externalReceivables,
    },
    owed_by_us: {
      arena_debts: arenaDebts,
      players_overpayments: overpayments,
      external_overpayments: externalOverpayments,
    },
  };

  const total = onHand + owedToUs - owedByUs;

  return { total, breakdown, summary, details, players };
}
