'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { Skeleton } from '@/components/skeleton';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { TransactionCard, type TransactionCardLabels } from '@/components/transaction-card';
import {
  IconWallet,
  IconPeople,
  IconPerson,
  IconBuilding,
  IconCalendar,
} from '@/components/icons';
import {
  PeriodPickerMonth,
  currentYearMonth,
  periodFromYearMonth,
  type YearMonth,
} from '@/components/period-picker-month';
import { BalanceLineChart } from '@/components/finance-report/balance-line-chart';
import { CashFlowBar } from '@/components/finance-report/cash-flow-bar';
import { MetricTile } from '@/components/finance-report/metric-tile';
import { EventRow } from '@/components/finance-report/event-row';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useMe } from '@/hooks/use-me';
import { useFinanceReport } from '@/hooks/use-finance-report';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatMoney } from '@/lib/format-money';

// `/money/report` — финансовый срез за месяц. По вертикали:
//   • LightHeader + period-picker (стрелки месяца) + кнопка «сегодня» справа;
//   • расчётный баланс (на текущий момент, не зависит от периода);
//   • график on_hand по дням периода + 2×2 grid метрик (4 плитки);
//   • движение денег за период (поступления / аренды / прочие расходы);
//   • события периода с собрано/арена/нетто;
//   • последние операции периода (превью на 5 строк, кнопка «Все» ведёт
//     в `/money/transactions` с тем же диапазоном дат).
export default function MoneyReportPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader(colors.bg);

  const me = useMe();
  const hasTeam = (me.data?.memberships.length ?? 0) > 0;

  const [ym, setYm] = useState<YearMonth>(currentYearMonth());
  const period = useMemo(() => periodFromYearMonth(ym), [ym]);
  const report = useFinanceReport(period, hasTeam);

  const labels: TransactionCardLabels = useMemo(
    () => ({
      playerPayment: t('money.transactions.fallback.playerPayment'),
      deposit: t('money.transactions.fallback.deposit'),
      refund: t('money.transactions.fallback.refund'),
      adjustment: t('money.transactions.fallback.adjustment'),
      sub: {
        paymentForEvent: t('money.transactions.sub.paymentForEvent'),
        deposit: t('money.transactions.sub.deposit'),
        refund: t('money.transactions.sub.refund'),
        adjustment: t('money.transactions.sub.adjustment'),
        arena: t('money.transactions.sub.arena'),
        inventory: t('money.transactions.sub.inventory'),
        uniform: t('money.transactions.sub.uniform'),
        otherExpense: t('money.transactions.sub.otherExpense'),
      },
    }),
    [t],
  );

  const root: CSSProperties = {
    minHeight: '100dvh',
    background: colors.bg,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['16'],
  };

  const content: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
    padding: `${spacing['12']}px ${spacing['16']}px 0`,
  };

  const stickyPicker: CSSProperties = {
    position: 'sticky',
    top: 56,
    zIndex: 4,
    background: colors.bg,
    padding: `${spacing['8']}px 0 ${spacing['12']}px`,
  };

  const card: CSSProperties = {
    background: colors.bg,
    border: `1px solid ${colors.divider}`,
    borderRadius: radius.lg,
    padding: spacing['16'],
  };

  const cardTitle: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
    marginBottom: spacing['12'],
  };

  const linkRight: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: colors.primary,
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    padding: 0,
  };

  const isCurrent =
    ym.year === currentYearMonth().year && ym.month === currentYearMonth().month;
  const r = report.data;
  const ts = r?.timeseries ?? [];
  const ev = r?.events ?? [];
  const ops = r?.recent_operations ?? [];
  const cash = r?.cash_flow;
  const bd = r?.balance.breakdown;
  const total = r?.balance.total ?? 0;

  return (
    <div style={root}>
      <LightHeader
        title={t('money.report.title')}
        onBack={() => router.push('/money')}
        right={
          <button
            type="button"
            className="pressable"
            aria-label={t('money.report.todayAria')}
            onClick={() => setYm(currentYearMonth())}
            disabled={isCurrent}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: colors.bgMuted,
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isCurrent ? 'default' : 'pointer',
              opacity: isCurrent ? 0.5 : 1,
            }}
          >
            <IconCalendar size={20} color={colors.text} />
          </button>
        }
      />

      <div style={stickyPicker}>
        <PeriodPickerMonth value={ym} onChange={setYm} />
      </div>

      <div style={content}>
        {!hasTeam && me.isSuccess ? (
          <div style={card}>{t('money.empty.noTeam.title')}</div>
        ) : report.isLoading || report.isPending ? (
          <ReportSkeleton />
        ) : report.isError || !r ? (
          <div style={card}>{t('common.error')}</div>
        ) : (
          <>
            {/* Расчётный баланс (текущее состояние) */}
            <div style={card}>
              <div style={{ fontSize: 14, color: colors.textSecondary }}>
                {t('money.report.balance.title')}
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: total >= 0 ? colors.success : colors.error,
                  marginTop: spacing['4'],
                }}
              >
                {total >= 0 ? '+' : '−'}
                {formatMoney(Math.abs(total))} ₽
              </div>
              <div
                style={{ fontSize: 13, color: colors.textSecondary, marginTop: spacing['4'] }}
              >
                {t('money.report.balance.subtitle')}
              </div>
            </div>

            {/* График + 2×2 grid метрик */}
            <div style={card}>
              <div style={cardTitle}>{t('money.report.chart.title')}</div>
              <BalanceLineChart data={ts} />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: spacing['8'],
                  marginTop: spacing['16'],
                }}
              >
                <MetricTile
                  icon={<IconWallet size={18} color={colors.mediaDepositFg} />}
                  tone="positive"
                  label={t('money.balance.onHand')}
                  amount={bd?.on_hand ?? 0}
                  sign="auto"
                />
                <MetricTile
                  icon={<IconPeople size={18} color={colors.mediaDepositFg} />}
                  tone="positive"
                  label={t('money.balance.debts')}
                  amount={bd?.debts ?? 0}
                  sign="+"
                />
                <MetricTile
                  icon={<IconPerson size={18} color={colors.error} />}
                  tone="negative"
                  label={t('money.balance.overpayments')}
                  amount={bd?.overpayments ?? 0}
                  sign="-"
                />
                <MetricTile
                  icon={<IconBuilding size={18} color={colors.error} />}
                  tone="negative"
                  label={t('money.balance.arenaDebts')}
                  amount={bd?.arena_debts ?? 0}
                  sign="-"
                />
              </div>
            </div>

            {/* Движение денег за период */}
            <div style={card}>
              <div style={cardTitle}>
                {t('money.report.cashflow.title').replace('{month}', monthLabel(ym))}
              </div>
              <CashFlowBar
                income={cash?.income ?? 0}
                arenas={cash?.arenas ?? 0}
                expenses={cash?.expenses ?? 0}
                net={cash?.net ?? 0}
                netLabel={t('money.report.cashflow.net')}
                incomeLabel={t('money.report.cashflow.income')}
                arenasLabel={t('money.report.cashflow.arenas')}
                expensesLabel={t('money.report.cashflow.expenses')}
              />
            </div>

            {/* События периода */}
            <div style={card}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: spacing['12'],
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>
                  {t('money.report.events.title').replace('{month}', monthLabel(ym))}
                </div>
                <button
                  type="button"
                  style={linkRight}
                  onClick={() => router.push('/events')}
                >
                  {t('money.report.all')}
                </button>
              </div>
              {ev.length === 0 ? (
                <div style={{ fontSize: 13, color: colors.textSecondary }}>
                  {t('money.report.events.empty')}
                </div>
              ) : (
                ev.map((e) => (
                  <EventRow
                    key={e.id}
                    ev={e}
                    collectedLabel={t('money.report.events.collected')}
                    arenaLabel={t('money.report.events.arena')}
                  />
                ))
              )}
            </div>

            {/* Последние операции периода */}
            <div style={card}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: spacing['12'],
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>
                  {t('money.report.recent.title')}
                </div>
                <button
                  type="button"
                  style={linkRight}
                  onClick={() =>
                    router.push(
                      `/money/transactions?from=${period.from}&to=${period.to}`,
                    )
                  }
                >
                  {t('money.report.all')}
                </button>
              </div>
              {ops.length === 0 ? (
                <div style={{ fontSize: 13, color: colors.textSecondary }}>
                  {t('money.report.recent.empty')}
                </div>
              ) : (
                ops
                  .slice(0, 5)
                  .map((tx) => <TransactionCard key={tx.id} tx={tx} labels={labels} />)
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function monthLabel(ym: YearMonth): string {
  // Для подписей вида «за май» — только название месяца в родительном падеже.
  const MONTHS_GEN = [
    'январь',
    'февраль',
    'март',
    'апрель',
    'май',
    'июнь',
    'июль',
    'август',
    'сентябрь',
    'октябрь',
    'ноябрь',
    'декабрь',
  ];
  return MONTHS_GEN[ym.month - 1] ?? '';
}

function ReportSkeleton() {
  const card: CSSProperties = {
    background: colors.bg,
    border: `1px solid ${colors.divider}`,
    borderRadius: radius.lg,
    padding: spacing['16'],
  };
  return (
    <>
      <div style={card}>
        <Skeleton width="55%" height={14} />
        <div style={{ marginTop: spacing['8'] }}>
          <Skeleton width="40%" height={32} />
        </div>
      </div>
      <div style={card}>
        <Skeleton width="45%" height={14} />
        <div style={{ marginTop: spacing['12'] }}>
          <Skeleton width="100%" height={120} />
        </div>
      </div>
      <div style={card}>
        <Skeleton width="50%" height={14} />
        <div style={{ marginTop: spacing['12'] }}>
          <Skeleton width="100%" height={60} />
        </div>
      </div>
    </>
  );
}
