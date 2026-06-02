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

// «Долги и переплаты» — две линии (красная и серая) с круглыми маркерами.
// Долги игроков на конец каждого месяца + переплаты игрокам.
type Props = { monthly: FinanceAnalyticsMonthly[] };

export function DebtsLineChart({ monthly }: Props) {
  const data = monthly.map((m) => ({
    month: monthShort(m.month),
    debts: m.debts,
    overpayments: m.overpayments,
  }));
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
            formatter={(v, name) => [
              formatMoney(Number(v) || 0),
              name === 'debts' ? 'Долги' : 'Переплаты',
            ]}
          />
          <Line
            type="monotone"
            dataKey="debts"
            stroke={colors.error}
            strokeWidth={2}
            dot={{ r: 4, stroke: colors.error, fill: colors.bg, strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="overpayments"
            stroke={colors.textTertiary}
            strokeWidth={2}
            dot={{ r: 4, stroke: colors.textTertiary, fill: colors.bg, strokeWidth: 2 }}
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
