'use client';

import { type CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatMoney } from '@/lib/format-money';

// Горизонтальная stacked-bar для блока «Движение денег за период».
// Три сегмента (поступления / аренды / прочие расходы) с пропорциональной
// шириной, легенда снизу. Без recharts — обычные div'ы, проще и легче.
type Props = {
  income: number;
  arenas: number;
  expenses: number;
  net: number;
  netLabel: string;
  incomeLabel: string;
  arenasLabel: string;
  expensesLabel: string;
};

export function CashFlowBar({
  income,
  arenas,
  expenses,
  net,
  netLabel,
  incomeLabel,
  arenasLabel,
  expensesLabel,
}: Props) {
  const total = income + arenas + expenses;
  const segs = total > 0
    ? [
        { value: income, color: colors.success, share: income / total },
        { value: arenas, color: colors.error, share: arenas / total },
        { value: expenses, color: colors.warning, share: expenses / total },
      ]
    : null;

  const bar: CSSProperties = {
    display: 'flex',
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    background: colors.bgMuted,
    marginBottom: spacing['12'],
  };

  const legend: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: spacing['8'],
  };

  return (
    <div>
      <div style={bar}>
        {segs?.map((s, i) => (
          <div
            key={i}
            style={{
              width: `${s.share * 100}%`,
              background: s.color,
              minWidth: s.share > 0 ? 4 : 0,
            }}
          />
        ))}
      </div>

      <div style={legend}>
        <LegendItem color={colors.success} label={incomeLabel} value={income} />
        <LegendItem color={colors.error} label={arenasLabel} value={arenas} />
        <LegendItem color={colors.warning} label={expensesLabel} value={expenses} />
      </div>

      <div
        style={{
          marginTop: spacing['16'],
          paddingTop: spacing['12'],
          borderTop: `1px solid ${colors.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span style={{ fontSize: 14, color: colors.text }}>{netLabel}</span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: net > 0 ? colors.success : net < 0 ? colors.error : colors.text,
          }}
        >
          {formatNet(net)}
        </span>
      </div>
    </div>
  );
}

type LegendItemProps = {
  color: string;
  label: string;
  value: number;
};

function LegendItem({ color, label, value }: LegendItemProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
          }}
          aria-hidden
        />
        <span style={{ fontSize: 12, color: colors.textSecondary }}>{label}</span>
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>
        {formatMoney(value)}
      </span>
    </div>
  );
}

function formatNet(n: number): string {
  if (n > 0) return `+${formatMoney(n)}`;
  if (n < 0) return `−${formatMoney(Math.abs(n))}`;
  return formatMoney(0);
}
