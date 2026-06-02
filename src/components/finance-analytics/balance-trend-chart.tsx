'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { colors } from '@/theme/colors';
import { formatMoney } from '@/lib/format-money';
import type { FinanceAnalyticsMonthly } from '@/types/api';

// «Динамика баланса» — линейный график расчётного баланса по концам месяца.
// Точки-маркеры, ось Y с подписями, ось X — короткие названия месяцев.
type Props = { monthly: FinanceAnalyticsMonthly[] };

export function BalanceTrendChart({ monthly }: Props) {
  const data = monthly.map((m) => ({ month: monthShort(m.month), balance: m.balance }));
  return (
    <div style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
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
            contentStyle={{
              background: colors.bg,
              border: `1px solid ${colors.divider}`,
              borderRadius: 8,
              fontSize: 12,
              padding: '6px 10px',
            }}
            formatter={(v) => [formatMoney(Number(v) || 0), 'Баланс']}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke={colors.success}
            strokeWidth={2}
            dot={{ r: 4, stroke: colors.success, fill: colors.bg, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </LineChart>
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
