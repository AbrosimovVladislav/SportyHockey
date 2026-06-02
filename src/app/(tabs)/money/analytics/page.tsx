'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { Skeleton } from '@/components/skeleton';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import {
  PeriodPickerRange,
  defaultRange,
  type RangeValue,
} from '@/components/period-picker-range';
import { StateCard } from '@/components/finance-analytics/state-card';
import { ForecastCard } from '@/components/finance-analytics/forecast-card';
import { BalanceTrendChart } from '@/components/finance-analytics/balance-trend-chart';
import { IncomeExpenseBars } from '@/components/finance-analytics/income-expense-bars';
import { DebtsLineChart } from '@/components/finance-analytics/debts-line-chart';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useMe } from '@/hooks/use-me';
import { useFinanceAnalytics } from '@/hooks/use-finance-analytics';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatMoney } from '@/lib/format-money';

// `/money/analytics` (итерация 55). По вертикали:
//   • LightHeader «Аналитика финансов», back на /money;
//   • period-picker (3 / 6 / 12 / всё / кастом);
//   • карточка «Финансовое состояние» с расчётным балансом и тренд-чипами;
//   • динамика баланса (LineChart);
//   • доходы и расходы (paired BarChart);
//   • долги и переплаты (LineChart, 2 линии);
//   • прогноз на 3 месяца (фиксированный горизонт).
export default function MoneyAnalyticsPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader(colors.bg);

  const me = useMe();
  const hasTeam = (me.data?.memberships.length ?? 0) > 0;

  const [range, setRange] = useState<RangeValue>(defaultRange);
  const analytics = useFinanceAnalytics(
    { from: range.from, to: range.to },
    hasTeam,
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
    padding: `${spacing['8']}px ${spacing['16']}px ${spacing['12']}px`,
  };

  const card: CSSProperties = {
    background: colors.bg,
    border: `1px solid ${colors.divider}`,
    borderRadius: radius.lg,
    padding: spacing['16'],
  };

  const data = analytics.data;
  const monthly = data?.monthly ?? [];
  const periodMonths = monthly.length;
  const lastMonth = monthly[monthly.length - 1];

  return (
    <div style={root}>
      <LightHeader
        title={t('money.analytics.title')}
        onBack={() => router.push('/money')}
      />

      <div style={stickyPicker}>
        <PeriodPickerRange value={range} onChange={setRange} />
      </div>

      <div style={content}>
        {!hasTeam && me.isSuccess ? (
          <div style={card}>{t('money.empty.noTeam.title')}</div>
        ) : analytics.isLoading || analytics.isPending ? (
          <AnalyticsSkeleton />
        ) : analytics.isError || !data ? (
          <div style={card}>{t('common.error')}</div>
        ) : (
          <>
            <StateCard
              total={data.balance.total}
              trends={data.trends}
              forecast={data.forecast}
              periodMonths={periodMonths}
            />

            <div style={card}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: spacing['12'],
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>
                  {t('money.analytics.balance.title')}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color:
                      data.trends.balance_change > 0
                        ? colors.success
                        : data.trends.balance_change < 0
                          ? colors.error
                          : colors.textSecondary,
                  }}
                >
                  {data.trends.balance_change > 0 ? '+' : data.trends.balance_change < 0 ? '−' : ''}
                  {formatMoney(Math.abs(data.trends.balance_change))} за период
                </div>
              </div>
              <BalanceTrendChart monthly={monthly} />
            </div>

            <div style={card}>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: spacing['8'] }}>
                {t('money.analytics.cashflow.title')}
              </div>
              <Legend
                items={[
                  {
                    color: colors.success,
                    label: 'Сборы',
                    value: lastMonth ? formatMoney(lastMonth.income) : null,
                    hint: lastMonth ? lastMonthShort(lastMonth.month) : null,
                  },
                  {
                    color: colors.error,
                    label: 'Расходы',
                    value: lastMonth ? formatMoney(lastMonth.expenses) : null,
                    hint: lastMonth ? lastMonthShort(lastMonth.month) : null,
                  },
                ]}
              />
              <IncomeExpenseBars monthly={monthly} />
            </div>

            <div style={card}>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: spacing['8'] }}>
                {t('money.analytics.debts.title')}
              </div>
              <Legend
                items={[
                  {
                    color: colors.error,
                    label: 'Долги игроков',
                    value: lastMonth ? formatMoney(lastMonth.debts) : null,
                    hint: null,
                  },
                  {
                    color: colors.textTertiary,
                    label: 'Переплаты',
                    value: lastMonth ? formatMoney(lastMonth.overpayments) : null,
                    hint: null,
                  },
                ]}
              />
              <DebtsLineChart monthly={monthly} />
            </div>

            <ForecastCard forecast={data.forecast} />
          </>
        )}
      </div>
    </div>
  );
}

type LegendItem = {
  color: string;
  label: string;
  value: string | null;
  hint: string | null;
};

function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing['12'],
        marginBottom: spacing['8'],
      }}
    >
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: it.color,
            }}
            aria-hidden
          />
          <span style={{ fontSize: 12, color: colors.textSecondary }}>
            {it.label}
            {it.value != null ? <strong style={{ color: colors.text, fontWeight: 700 }}>: {it.value}</strong> : null}
            {it.hint ? <span> в {it.hint}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

const MONTHS_PREP = [
  'январе',
  'феврале',
  'марте',
  'апреле',
  'мае',
  'июне',
  'июле',
  'августе',
  'сентябре',
  'октябре',
  'ноябре',
  'декабре',
];

function lastMonthShort(iso: string): string {
  const m = Number.parseInt(iso.slice(5, 7), 10);
  return MONTHS_PREP[m - 1] ?? '';
}

function AnalyticsSkeleton() {
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
          <Skeleton width="40%" height={28} />
        </div>
      </div>
      <div style={card}>
        <Skeleton width="45%" height={14} />
        <div style={{ marginTop: spacing['12'] }}>
          <Skeleton width="100%" height={160} />
        </div>
      </div>
      <div style={card}>
        <Skeleton width="45%" height={14} />
        <div style={{ marginTop: spacing['12'] }}>
          <Skeleton width="100%" height={180} />
        </div>
      </div>
    </>
  );
}
