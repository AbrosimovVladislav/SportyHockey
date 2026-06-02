'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { colors } from '@/theme/colors';
import { formatMoney } from '@/lib/format-money';
import type { FinanceAnalyticsMonthly } from '@/types/api';

// «Доходы и расходы» — парные столбцы по месяцам: зелёные income, красные
// expenses. Подписи и легенда (с числами в последнем месяце периода) —
// над графиком, рисует родитель.
type Props = { monthly: FinanceAnalyticsMonthly[] };

export function IncomeExpenseBars({ monthly }: Props) {
  const data = monthly.map((m) => ({
    month: monthShort(m.month),
    income: m.income,
    expenses: m.expenses,
  }));
  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid stroke={colors.divider} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: colors.textSecondary }}
            tickLine={false}
            axisLine={{ stroke: colors.divider }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: colors.textSecondary }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${Math.round(Number(v) / 1000)}к`}
            width={40}
          />
          <Tooltip
            cursor={{ fill: colors.bgMuted }}
            contentStyle={{
              background: colors.bg,
              border: `1px solid ${colors.divider}`,
              borderRadius: 8,
              fontSize: 12,
              padding: '6px 10px',
            }}
            formatter={(v, name) => [
              formatMoney(Number(v) || 0),
              name === 'income' ? 'Сборы' : 'Расходы',
            ]}
          />
          <Bar
            dataKey="income"
            fill={colors.success}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="expenses"
            fill={colors.error}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const MONTHS_SHORT = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек',
];

function monthShort(iso: string): string {
  const m = Number.parseInt(iso.slice(5, 7), 10);
  return MONTHS_SHORT[m - 1] ?? '';
}
