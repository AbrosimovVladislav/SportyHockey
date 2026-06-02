'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { colors } from '@/theme/colors';
import { formatMoney } from '@/lib/format-money';

// Линейный график `on_hand` по дням периода. Recharts AreaChart с
// градиентной заливкой. По оси X — только крайние даты (как на мокапе),
// по оси Y — без подписей. ReferenceLine y=0 — пунктир, чтобы видеть знак.
type Point = { date: string; on_hand: number };

type Props = {
  data: Point[];
};

export function BalanceLineChart({ data }: Props) {
  const { first, last } = useMemo(() => {
    if (data.length === 0) return { first: '', last: '' };
    return {
      first: formatDate(data[0].date),
      last: formatDate(data[data.length - 1].date),
    };
  }, [data]);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ width: '100%', height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 4, left: 4, bottom: 4 }}
          >
            <defs>
              <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.success} stopOpacity={0.25} />
                <stop offset="95%" stopColor={colors.success} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <ReferenceLine
              y={0}
              stroke={colors.divider}
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Tooltip
              cursor={{ stroke: colors.divider, strokeWidth: 1 }}
              contentStyle={{
                background: colors.bg,
                border: `1px solid ${colors.divider}`,
                borderRadius: 8,
                fontSize: 12,
                padding: '6px 10px',
              }}
              labelFormatter={(v) => formatDate(String(v ?? ''))}
              formatter={(v) => [formatMoney(Number(v) || 0), 'На руках']}
            />
            <Area
              type="monotone"
              dataKey="on_hand"
              stroke={colors.success}
              strokeWidth={2}
              fill="url(#balanceFill)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 4,
          fontSize: 12,
          color: colors.textSecondary,
        }}
      >
        <span>{first}</span>
        <span>{last}</span>
      </div>
    </div>
  );
}

const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

function formatDate(iso: string): string {
  // iso: YYYY-MM-DD → «1 мая» / «31 мая».
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  const day = Number.parseInt(d, 10);
  const month = MONTHS_SHORT[Number.parseInt(m, 10) - 1] ?? '';
  return `${day} ${month}`;
}
