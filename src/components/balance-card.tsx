'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { Skeleton } from '@/components/skeleton';
import { formatMoney, formatSignedMoney } from '@/lib/format-money';
import type { TeamBalanceSummary } from '@/types/api';

// Главная карточка хаба «Деньги» (v0.5, итерация 57). Сверху — расчётный
// баланс (реальное финансовое положение команды), под ним 3 плашки в ряд:
//  • На руках   — нейтральный (текущий кэш в кассе/на счёте);
//  • Нам должны — зелёный фон (плюс к total: долги игроков + переплаты площадкам);
//  • Мы должны  — красный фон (минус к total: переплаты игрокам + долги площадкам).
// Формула: total = on_hand + owed_to_us − owed_by_us.
// Подробная разбивка по категориям — в `BalanceDetailsCard` ниже.

type BalanceCardProps = {
  total: number;
  summary: TeamBalanceSummary;
  title: string;
  labels: {
    on_hand: string;
    owed_to_us: string;
    owed_by_us: string;
  };
};

export function BalanceCard({ total, summary, title, labels }: BalanceCardProps) {
  const totalColor =
    total > 0 ? colors.successDark : total < 0 ? colors.errorDark : colors.text;

  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['20'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };

  const titleStyle: CSSProperties = {
    ...typography.sm,
    color: colors.textSecondary,
    fontWeight: 600,
  };

  const totalStyle: CSSProperties = {
    ...typography.display,
    color: totalColor,
    lineHeight: 1.05,
    letterSpacing: '-0.025em',
  };

  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: spacing['8'],
  };

  return (
    <div style={card}>
      <div>
        <div style={titleStyle}>{title}</div>
        <div style={{ ...totalStyle, marginTop: spacing['8'] }}>{formatSignedMoney(total)}</div>
      </div>
      <div style={grid}>
        <Subtile label={labels.on_hand} value={formatMoney(summary.on_hand)} tone="neutral" />
        <Subtile
          label={labels.owed_to_us}
          value={formatSignedMoney(summary.owed_to_us)}
          tone="positive"
        />
        <Subtile
          label={labels.owed_by_us}
          value={formatSignedMoney(-summary.owed_by_us)}
          tone="negative"
        />
      </div>
    </div>
  );
}

type Tone = 'neutral' | 'positive' | 'negative';

function toneStyles(tone: Tone): { bg: string; label: string; value: string } {
  if (tone === 'positive') {
    return { bg: colors.successBg, label: colors.successDark, value: colors.successDark };
  }
  if (tone === 'negative') {
    return { bg: colors.errorBg, label: colors.errorDark, value: colors.errorDark };
  }
  return { bg: colors.bgOffWhite, label: colors.textSecondary, value: colors.text };
}

function Subtile({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  const c = toneStyles(tone);
  const wrap: CSSProperties = {
    background: c.bg,
    borderRadius: radius.md,
    padding: `${spacing['10']}px ${spacing['12']}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['4'],
    minHeight: 64,
  };
  const labelStyle: CSSProperties = {
    ...typography.caption,
    color: c.label,
    fontWeight: 600,
  };
  const valueStyle: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.2,
    color: c.value,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.01em',
  };
  return (
    <div style={wrap}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  );
}

// Скелетон карточки — геометрически совпадает с реальной (нет «прыжка»).
export function BalanceCardSkeleton() {
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['20'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };
  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: spacing['8'],
  };
  return (
    <div style={card} aria-hidden>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
        <Skeleton width={110} height={13} />
        <Skeleton width={200} height={40} borderRadius={8} />
      </div>
      <div style={grid}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={64} borderRadius={radius.md} />
        ))}
      </div>
    </div>
  );
}
