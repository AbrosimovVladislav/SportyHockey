import { NextResponse } from 'next/server';
import { requireUser, resolveActiveTeamId } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { computeTeamBalance } from '@/lib/team-finance';
import {
  FINANCE_SELECT,
  mapFinanceTransaction,
  type RawFinanceRow,
} from '@/lib/finance-mapper';
import type {
  FinanceReportResponse,
  FinanceReportEvent,
  FinanceReportTimeseriesPoint,
  FinanceReportCashFlow,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/finance/report?from=YYYY-MM-DD&to=YYYY-MM-DD — финансовый срез
// за период. Один запрос собирает всё, что рендерит `/money/report`:
//
//   • текущий разложенный баланс (computeTeamBalance, не зависит от периода);
//   • временной ряд `on_hand` по каждому дню периода (нарастающий итог);
//   • агрегаты движения денег за период (поступления / аренды / прочие расходы);
//   • события периода с «собрано / арена / нетто» по каждому;
//   • последние 20 транзакций периода.
//
// «Собрано» по событию — ∑ player_payment с этим event_id за всё время,
// потому что подпись «собрано N ₽» относится к событию, а не к окну периода.

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const teamId = await resolveActiveTeamId(req, user.id);
    if (!teamId) {
      return NextResponse.json({ error: 'Активная команда не выбрана' }, { status: 400 });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get('from') ?? '';
    const to = url.searchParams.get('to') ?? '';
    if (!DATE.test(from) || !DATE.test(to) || from > to) {
      return NextResponse.json(
        { error: 'Период задан некорректно (нужны from и to в формате YYYY-MM-DD)' },
        { status: 400 },
      );
    }

    const sb = supabaseServer();

    // Все три запроса — независимые, гоним параллельно.
    const [balance, txAllRes, eventsRes, recentRes] = await Promise.all([
      // Разбивка текущего баланса — те же 4 плитки, что и на хабе.
      computeTeamBalance(sb, teamId),
      // Все транзакции до конца периода — нужны для нарастающего on_hand на каждый день.
      sb
        .from('finance_transactions')
        .select('amount, occurred_on, type, category, event_id')
        .eq('team_id', teamId)
        .lte('occurred_on', to),
      // События периода — границы по starts_at (UTC).
      sb
        .from('events')
        .select('id, type, title, opponent_name, starts_at, arena_cost, arena_paid_amount')
        .eq('team_id', teamId)
        .neq('status', 'cancelled')
        .gte('starts_at', `${from}T00:00:00.000Z`)
        .lte('starts_at', `${to}T23:59:59.999Z`)
        .order('starts_at', { ascending: true }),
      // Последние операции периода — для блока «Последние операции».
      sb
        .from('finance_transactions')
        .select(FINANCE_SELECT)
        .eq('team_id', teamId)
        .gte('occurred_on', from)
        .lte('occurred_on', to)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (txAllRes.error) {
      return NextResponse.json({ error: txAllRes.error.message }, { status: 500 });
    }
    if (eventsRes.error) {
      return NextResponse.json({ error: eventsRes.error.message }, { status: 500 });
    }
    if (recentRes.error) {
      return NextResponse.json({ error: recentRes.error.message }, { status: 500 });
    }

    type TxRow = {
      amount: number;
      occurred_on: string;
      type: string;
      category: string | null;
      event_id: string | null;
    };
    const txAll = (txAllRes.data ?? []) as TxRow[];

    // 1) Timeseries on_hand по дням периода.
    // Базовое значение — on_hand на день перед `from`. Затем по каждому дню
    // периода прибавляем дельту дня (player_payment − expense − refund).
    const todayStr = todayIso();
    const dayDelta = new Map<string, number>(); // day → net delta of on_hand
    let baseOnHand = 0;
    for (const tx of txAll) {
      const amt = Number(tx.amount);
      if (!Number.isFinite(amt)) continue;
      const d = tx.occurred_on;
      const delta = onHandDelta(tx.type, amt, d, todayStr);
      if (delta === 0) continue;
      if (d < from) {
        baseOnHand += delta;
      } else {
        dayDelta.set(d, (dayDelta.get(d) ?? 0) + delta);
      }
    }
    const timeseries: FinanceReportTimeseriesPoint[] = [];
    {
      let running = baseOnHand;
      for (const d of dateRange(from, to)) {
        running += dayDelta.get(d) ?? 0;
        timeseries.push({ date: d, on_hand: running });
      }
    }

    // 2) Cash flow за период. Тут смотрим только транзакции с occurred_on ∈ [from, to].
    const cash: FinanceReportCashFlow = { income: 0, arenas: 0, expenses: 0, net: 0 };
    for (const tx of txAll) {
      if (tx.occurred_on < from || tx.occurred_on > to) continue;
      const amt = Number(tx.amount);
      if (!Number.isFinite(amt)) continue;
      if (tx.type === 'player_payment') {
        cash.income += amt;
      } else if (tx.type === 'expense') {
        if (tx.category === 'arena') cash.arenas += amt;
        else cash.expenses += amt;
      } else if (tx.type === 'refund') {
        cash.expenses += amt;
      }
    }
    cash.net = cash.income - cash.arenas - cash.expenses;

    // 3) События периода. «Собрано» — ∑ player_payment с этим event_id за всё
    // время; берём из txAll (там лежат все транзакции до `to`).
    const collectedByEvent = new Map<string, number>();
    for (const tx of txAll) {
      if (tx.type !== 'player_payment' || !tx.event_id) continue;
      const amt = Number(tx.amount);
      if (!Number.isFinite(amt)) continue;
      collectedByEvent.set(tx.event_id, (collectedByEvent.get(tx.event_id) ?? 0) + amt);
    }

    type EvRow = {
      id: string;
      type: string;
      title: string | null;
      opponent_name: string | null;
      starts_at: string;
      arena_cost: number | null;
      arena_paid_amount: number;
    };
    const events: FinanceReportEvent[] = ((eventsRes.data ?? []) as EvRow[]).map((e) => {
      const collected = collectedByEvent.get(e.id) ?? 0;
      const arenaCost = e.arena_cost != null ? Number(e.arena_cost) : 0;
      const arenaPaid = Number(e.arena_paid_amount) || 0;
      return {
        id: e.id,
        type: e.type,
        title: e.title,
        opponent_name: e.opponent_name,
        starts_at: e.starts_at,
        collected,
        arena_cost: arenaCost,
        arena_paid: arenaPaid,
        net: collected - arenaCost,
      };
    });

    // 4) Последние операции.
    const recent_operations = ((recentRes.data ?? []) as unknown as RawFinanceRow[]).map(
      mapFinanceTransaction,
    );

    const body: FinanceReportResponse = {
      from,
      to,
      balance: { total: balance.total, breakdown: balance.breakdown },
      timeseries,
      cash_flow: cash,
      events,
      recent_operations,
    };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

// Дельта on_hand от одной транзакции. Совпадает с логикой
// `computeTeamBalance` и `onHandDelta` из `on-hand-guard`: будущие расходы
// и возвраты в кассу не входят.
function onHandDelta(
  type: string,
  amount: number,
  day: string,
  today: string,
): number {
  if (type === 'player_payment') return amount;
  if (type === 'expense' || type === 'refund') {
    return day <= today ? -amount : 0;
  }
  return 0;
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  for (let d = start; d <= end; d = new Date(d.getTime() + 86_400_000)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
