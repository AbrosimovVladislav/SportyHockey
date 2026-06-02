'use client';

import { type CSSProperties, type ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatMoney } from '@/lib/format-money';

// Карточка метрики в 2×2 grid под графиком баланса. Слева — круглая иконка
// (цвет/фон передаются через `tone`), справа — лейбл и сумма. Знак числа
// определяет тон значения: положительный/нулевой — зелёный, отрицательный
// — красный. У переплат и долгов аренам знак указывается явно через
// `sign='negative'`, потому что в БД эти величины хранятся без знака.
export type MetricTone = 'positive' | 'negative';

type Props = {
  icon: ReactNode;
  tone: MetricTone;
  label: string;
  amount: number;
  sign: '+' | '-' | 'auto';
};

export function MetricTile({ icon, tone, label, amount, sign }: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: spacing['12'],
    background: colors.bg,
    border: `1px solid ${colors.divider}`,
    borderRadius: radius.md,
    minHeight: 64,
  };

  const iconBox: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: tone === 'positive' ? colors.mediaDepositBg : colors.errorBg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tone === 'positive' ? colors.mediaDepositFg : colors.error,
    flexShrink: 0,
  };

  const valueColor =
    sign === '+'
      ? colors.success
      : sign === '-'
        ? colors.error
        : amount > 0
          ? colors.success
          : amount < 0
            ? colors.error
            : colors.text;

  const formatted =
    sign === '+'
      ? `+${formatMoney(amount)}`
      : sign === '-'
        ? `−${formatMoney(amount)}`
        : formatMoney(amount);

  return (
    <div style={wrap}>
      <span style={iconBox} aria-hidden>
        {icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontSize: 12, color: colors.textSecondary }}>{label}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: valueColor }}>
          {formatted} ₽
        </span>
      </div>
    </div>
  );
}
