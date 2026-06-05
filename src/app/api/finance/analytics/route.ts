import { NextResponse } from 'next/server';
import { requireUser, resolveActiveTeamId } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { computeTeamBalance } from '@/lib/team-finance';
import type {
  FinanceAnalyticsResponse,
  FinanceAnalyticsMonthly,
  FinanceAnalyticsTrends,
  FinanceForecast,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/finance/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD — данные для
// экрана `/money/analytics`. Один запрос отдаёт:
//   • текущий баланс (для шапки);
//   • месячные точки внутри [from, to] — balance / income / expenses /
//     debts / overpayments на конец каждого месяца;
//   • тренды (баланс/долги/переплаты — первый → последний месяц);
//   • прогноз на 3 месяца вперёд от сегодня (ожидаемые взносы по будущим
//     событиям, плановые аренды и средние «прочие расходы»).

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
        { error: 'Период задан некорректно (нужны from и to)' },
        { status: 400 },
      );
    }

    const sb = supabaseServer();

    // Месячные точки. Делаем последовательно — N запросов из computeTeamBalance,
    // но N небольшое (≤ 12). Параллельно бы сэкономили время — пока хватает.
    const months = monthEnds(from, to);
    const monthly: FinanceAnalyticsMonthly[] = await Promise.all(
      months.map((m) => buildMonthly(sb, teamId, m.year, m.month, m.lastDay)),
    );

    // Текущий баланс — без asOf.
    const currentBalance = await computeTeamBalance(sb, teamId);

    // Прогноз — 3 месяца вперёд от сегодня.
    const forecast = await buildForecast(sb, teamId, currentBalance.breakdown.on_hand);

    const trends: FinanceAnalyticsTrends = {
      balance_change:
        monthly.length >= 2
          ? monthly[monthly.length - 1].balance - monthly[0].balance
          : 0,
      debts_change:
        monthly.length >= 2
          ? monthly[monthly.length - 1].debts - monthly[0].debts
          : 0,
      overpayments_change:
        monthly.length >= 2
          ? monthly[monthly.length - 1].overpayments - monthly[0].overpayments
          : 0,
    };

    const body: FinanceAnalyticsResponse = {
      from,
      to,
      balance: {
        total: currentBalance.total,
        breakdown: currentBalance.breakdown,
        summary: currentBalance.summary,
        details: currentBalance.details,
      },
      monthly,
      trends,
      forecast,
    };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

type SB = ReturnType<typeof supabaseServer>;

async function buildMonthly(
  sb: SB,
  teamId: string,
  year: number,
  month: number,
  lastDayIso: string,
): Promise<FinanceAnalyticsMonthly> {
  // Срез на конец месяца — он же даёт debts/overpayments/balance.
  const tb = await computeTeamBalance(sb, teamId, lastDayIso);

  // income/expenses за этот месяц — отдельным запросом по occurred_on.
  const mm = String(month).padStart(2, '0');
  const monthStart = `${year}-${mm}-01`;
  const { data, error } = await sb
    .from('finance_transactions')
    .select('amount, kind, from_kind, to_kind')
    .eq('team_id', teamId)
    .gte('occurred_on', monthStart)
    .lte('occurred_on', lastDayIso);
  if (error) throw new Error(error.message);

  // income = поступления в кассу команды (user→team).
  // expenses = списания из кассы (team→venue/external/user) — без adjustment.
  let income = 0;
  let expenses = 0;
  for (const tx of (data ?? []) as Array<{
    amount: number;
    kind: string;
    from_kind: string | null;
    to_kind: string | null;
  }>) {
    const amt = Number(tx.amount);
    if (!Number.isFinite(amt)) continue;
    if (tx.kind !== 'transfer') continue;
    if (tx.to_kind === 'team') income += amt;
    else if (tx.from_kind === 'team') expenses += amt;
  }

  return {
    month: monthStart,
    balance: tb.total,
    income,
    expenses,
    debts: tb.breakdown.debts,
    overpayments: tb.breakdown.overpayments,
  };
}

async function buildForecast(
  sb: SB,
  teamId: string,
  onHandNow: number,
): Promise<FinanceForecast> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const horizonIso = addMonthsIso(todayIso, 3);

  // 1) Будущие события в горизонте: starts_at ∈ (today, today+3m].
  const { data: futureEvents, error: feErr } = await sb
    .from('events')
    .select('id, type, cost_per_player, arena_cost')
    .eq('team_id', teamId)
    .neq('status', 'cancelled')
    .gt('starts_at', `${todayIso}T23:59:59.999Z`)
    .lte('starts_at', `${horizonIso}T23:59:59.999Z`);
  if (feErr) throw new Error(feErr.message);

  // 2) Прошедшие события для средней явки. Берём всё прошедшее, выберем по 6
  // последних на каждый тип в JS.
  const { data: pastEvents, error: peErr } = await sb
    .from('events')
    .select('id, type, starts_at')
    .eq('team_id', teamId)
    .neq('status', 'cancelled')
    .lt('starts_at', `${todayIso}T00:00:00.000Z`)
    .order('starts_at', { ascending: false });
  if (peErr) throw new Error(peErr.message);

  const { data: attendances, error: attErr } = await sb
    .from('event_attendances')
    .select('event_id, showed_up')
    .in('event_id', (pastEvents ?? []).map((e) => e.id));
  if (attErr) throw new Error(attErr.message);

  // Группируем showed_up по event_id.
  const showedByEvent = new Map<string, number>();
  for (const a of (attendances ?? []) as Array<{ event_id: string; showed_up: boolean | null }>) {
    if (a.showed_up) {
      showedByEvent.set(a.event_id, (showedByEvent.get(a.event_id) ?? 0) + 1);
    }
  }

  // Средняя явка по последним 6 событиям каждого типа.
  const avgByType = new Map<string, number>();
  const lastByType = new Map<string, number[]>();
  for (const e of (pastEvents ?? []) as Array<{ id: string; type: string }>) {
    const arr = lastByType.get(e.type) ?? [];
    if (arr.length < 6) {
      arr.push(showedByEvent.get(e.id) ?? 0);
      lastByType.set(e.type, arr);
    }
  }
  for (const [type, arr] of lastByType) {
    if (arr.length === 0) continue;
    const sum = arr.reduce((a, b) => a + b, 0);
    avgByType.set(type, sum / arr.length);
  }

  // 3) Прогноз ожидаемых взносов и аренд.
  let expectedIncome = 0;
  let expectedArenas = 0;
  for (const ev of (futureEvents ?? []) as Array<{
    type: string;
    cost_per_player: number | null;
    arena_cost: number | null;
  }>) {
    const cpp = ev.cost_per_player != null ? Number(ev.cost_per_player) : 0;
    const avg = avgByType.get(ev.type) ?? 0;
    expectedIncome += cpp * avg;
    expectedArenas += ev.arena_cost != null ? Number(ev.arena_cost) : 0;
  }

  // 4) Прогноз «прочих» расходов: среднее по последним 3 завершённым месяцам × 3.
  const threeMonthsAgo = addMonthsIso(todayIso, -3);
  const { data: recentTx, error: rtErr } = await sb
    .from('finance_transactions')
    .select('amount, kind, from_kind, to_kind, occurred_on')
    .eq('team_id', teamId)
    .gte('occurred_on', threeMonthsAgo)
    .lt('occurred_on', todayIso);
  if (rtErr) throw new Error(rtErr.message);

  // «Прочие» расходы = из кассы, но не на аренду (тех уже учли через
  // expectedArenas по будущим событиям). То есть team→external (инвентарь/
  // прочее) и team→user (refund).
  let otherTotal3m = 0;
  for (const tx of (recentTx ?? []) as Array<{
    amount: number;
    kind: string;
    from_kind: string | null;
    to_kind: string | null;
    occurred_on: string;
  }>) {
    const amt = Number(tx.amount);
    if (!Number.isFinite(amt)) continue;
    if (tx.kind !== 'transfer') continue;
    if (tx.from_kind !== 'team') continue;
    if (tx.to_kind === 'external' || tx.to_kind === 'user') otherTotal3m += amt;
  }
  // На 3 месяца вперёд — оставляем как есть (среднее за 3 завершённых × 3 / 3 = за 3 завершённых).
  const expectedOtherExpenses = otherTotal3m;

  const net = expectedIncome - expectedArenas - expectedOtherExpenses;
  const hasFunds = onHandNow + net >= 0;

  return {
    expected_income: expectedIncome,
    expected_arenas: expectedArenas,
    expected_other_expenses: expectedOtherExpenses,
    net,
    has_funds: hasFunds,
  };
}

// Возвращает массив «концов месяца» внутри [from, to]: для каждого месяца —
// последний день (либо `to`, если месяц обрезан справа).
function monthEnds(
  from: string,
  to: string,
): Array<{ year: number; month: number; lastDay: string }> {
  const out: Array<{ year: number; month: number; lastDay: string }> = [];
  const start = new Date(`${from}T00:00:00.000Z`);
  const endLimit = new Date(`${to}T00:00:00.000Z`);
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth() + 1;
  while (true) {
    const lastDayDate = new Date(Date.UTC(y, m, 0));
    const lastDayIso = lastDayDate.toISOString().slice(0, 10);
    const clipped = lastDayIso > to ? to : lastDayIso;
    out.push({ year: y, month: m, lastDay: clipped });
    if (lastDayDate >= endLimit) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    // Защита от бесконечного цикла на странных вводах.
    if (out.length > 24) break;
  }
  return out;
}

function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map((v) => Number.parseInt(v, 10));
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  return dt.toISOString().slice(0, 10);
}
