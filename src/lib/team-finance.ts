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

// Разбивка баланса команды для карточки на `/money` (v0.5, итерация 60 — полиморфный ledger).
// Все движения денег — это transfer-транзакции с заполненными from/to сторонами
// (`from_kind`+`from_id` / `to_kind`+`to_id`). adjustment — без движения денег,
// одностороннее начисление на счёт игрока (только to_kind='user' + to_id).
//
// Балансы любого счёта универсально считаются как `Σ(to=X) − Σ(from=X)`:
//   on_hand           = Σ(to_kind='team') − Σ(from_kind='team')
//   player(U) charged = Σ(to_kind='user', to_id=U)      // refund + adjustment + явка
//   player(U) paid    = Σ(from_kind='user', from_id=U)  // взносы
//   venue(V) paid     = Σ(to_kind='venue', to_id=V) − Σ(from_kind='venue', from_id=V)
//   external_kind(K)  = Σ(to_kind='external', external_kind=K) − Σ(from_kind='external', external_kind=K)
//
// Per-venue (а не per-event): депозит / переплата на одном событии гасит долг
// на другом за той же площадкой. Командный total от этого не зависит
// (Σ paid − Σ cost одинаков при любой группировке).
//
// Расчётный баланс:
//   total = on_hand + owed_to_us − owed_by_us
//   owed_to_us = players_debts + arena_overpayments + external_receivables
//   owed_by_us = players_overpayments + arena_debts + external_overpayments
//
// «Начисление игроку» собирается из двух источников:
//   • явка с cost_per_player — приходит из `event_attendances` (это не ledger);
//   • refund/adjustment — это transfer team→user / adjustment to_user.
// Оба суммируются в `charged`. Оплаты (paid) — только transfer user→team.
type AttendanceRow = {
  user_id: string;
  events: { cost_per_player: number | null } | null;
};

type TxRow = {
  amount: number;
  occurred_on: string;
  kind: string;
  from_kind: string | null;
  from_id: string | null;
  to_kind: string | null;
  to_id: string | null;
  external_kind: string | null;
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
        'amount, occurred_on, kind, from_kind, from_id, to_kind, to_id, external_kind',
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
  // Балансы каждого «счёта» сводим как Σ to − Σ from. Касса (team) считается так же.
  const paid = new Map<string, number>(); // user_id → Σ платежей user→team
  // venue: net = Σ to=venue − Σ from=venue. Положительный → команда «дала» больше
  // площадке, чем «получила» обратно (= depositon арендой); сравним с cost_v.
  const netByVenue = new Map<string, number>();
  // external (по external_kind): net = Σ to=external − Σ from=external.
  // Положительный → мы отдали больше, чем получили (значит они нам должны).
  const netByExternal = new Map<string, number>();
  let onHand = 0;

  for (const tx of (txRes.data ?? []) as TxRow[]) {
    const amt = Number(tx.amount);
    if (!Number.isFinite(amt)) continue;

    if (tx.kind === 'transfer') {
      // on_hand: касса меняется только когда team — одна из сторон.
      if (tx.to_kind === 'team') onHand += amt;
      if (tx.from_kind === 'team') onHand -= amt;

      // Балансы игроков.
      if (tx.from_kind === 'user' && tx.from_id) {
        paid.set(tx.from_id, (paid.get(tx.from_id) ?? 0) + amt);
      }
      if (tx.to_kind === 'user' && tx.to_id) {
        charged.set(tx.to_id, (charged.get(tx.to_id) ?? 0) + amt);
      }

      // Балансы площадок.
      if (tx.to_kind === 'venue' && tx.to_id) {
        netByVenue.set(tx.to_id, (netByVenue.get(tx.to_id) ?? 0) + amt);
      }
      if (tx.from_kind === 'venue' && tx.from_id) {
        netByVenue.set(tx.from_id, (netByVenue.get(tx.from_id) ?? 0) - amt);
      }

      // External-балансы (по external_kind).
      if (tx.to_kind === 'external' && tx.external_kind) {
        netByExternal.set(
          tx.external_kind,
          (netByExternal.get(tx.external_kind) ?? 0) + amt,
        );
      }
      if (tx.from_kind === 'external' && tx.external_kind) {
        netByExternal.set(
          tx.external_kind,
          (netByExternal.get(tx.external_kind) ?? 0) - amt,
        );
      }
    } else if (tx.kind === 'adjustment') {
      // adjustment — одностороннее начисление в пользу игрока. Касса не двигается.
      if (tx.to_id) {
        paid.set(tx.to_id, (paid.get(tx.to_id) ?? 0) + amt);
      }
    }
  }

  // 3) Долги и переплаты по площадкам. Стоимость аренды — по событиям с
  // venue_id, чей starts_at ≤ asOf.
  const costByVenue = new Map<string, number>();
  for (const e of (evRes.data ?? []) as EventArenaRow[]) {
    if (!e.venue_id) continue;
    const cost = e.arena_cost != null ? Number(e.arena_cost) : 0;
    if (cost <= 0) continue;
    costByVenue.set(e.venue_id, (costByVenue.get(e.venue_id) ?? 0) + cost);
  }
  let arenaDebts = 0;
  let arenaOverpayments = 0;
  const venueIds = new Set<string>([...costByVenue.keys(), ...netByVenue.keys()]);
  for (const vid of venueIds) {
    const cost = costByVenue.get(vid) ?? 0;
    const paidNet = netByVenue.get(vid) ?? 0;
    const diff = paidNet - cost;
    if (diff < 0) arenaDebts += -diff;
    else if (diff > 0) arenaOverpayments += diff;
  }

  // 4) External:
  //   net > 0 (мы отдали больше, чем получили) → external нам должен  → external_receivables
  //   net < 0 (нам пришло больше) → мы должны external               → external_overpayments
  let externalOverpayments = 0;
  let externalReceivables = 0;
  for (const net of netByExternal.values()) {
    if (net > 0) externalReceivables += net;
    else if (net < 0) externalOverpayments += -net;
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
