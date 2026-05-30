'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { Skeleton } from '@/components/skeleton';
import { formatMoney, formatSignedMoney } from '@/lib/format-money';
import type { TeamBalanceBreakdown } from '@/types/api';

// Главная карточка хаба «Деньги»: итог + четыре подплитки разбивки.
// Подплитки рендерятся внутри той же карточки на сером сабстрейте — образ
// баланса со всеми оговорками сразу, без дополнительных карточек.
//
// Цвет подзнака для каждой подплитки задаётся типом её вклада в total:
//  • on_hand — нейтральный текст (вклад положительный, но в продукте всегда «есть деньги в копилке»);
//  • future_arenas — красный (вычитается из total);
//  • overpayments — красный (вычитается);
//  • debts — зелёный (добавляется к total).

type BalanceCardProps = {
  total: number;
  breakdown: TeamBalanceBreakdown;
  title: string;
  hint: string;
  labels: {
    on_hand: string;
    future_arenas: string;
    overpayments: string;
    debts: string;
  };
};

export function BalanceCard({ total, breakdown, title, hint, labels }: BalanceCardProps) {
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

  const hintStyle: CSSProperties = {
    ...typography.sm,
    color: colors.textSecondary,
    lineHeight: 1.4,
  };

  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing['10'],
  };

  return (
    <div style={card}>
      <div>
        <div style={titleStyle}>{title}</div>
        <div style={{ ...totalStyle, marginTop: spacing['8'] }}>{formatSignedMoney(total)}</div>
        <div style={{ ...hintStyle, marginTop: spacing['8'] }}>{hint}</div>
      </div>
      <div style={grid}>
        <Subtile label={labels.on_hand} value={formatMoney(breakdown.on_hand)} tone="neutral" />
        <Subtile
          label={labels.future_arenas}
          value={formatSignedMoney(-breakdown.future_arenas)}
          tone="negative"
        />
        <Subtile
          label={labels.overpayments}
          value={formatSignedMoney(-breakdown.overpayments)}
          tone="negative"
        />
        <Subtile
          label={labels.debts}
          value={formatSignedMoney(breakdown.debts)}
          tone="positive"
        />
      </div>
    </div>
  );
}

type Tone = 'neutral' | 'positive' | 'negative';

function toneColor(tone: Tone): string {
  if (tone === 'positive') return colors.successDark;
  if (tone === 'negative') return colors.errorDark;
  return colors.text;
}

function Subtile({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  const wrap: CSSProperties = {
    background: colors.bgOffWhite,
    border: `1px solid ${colors.line}`,
    borderRadius: radius.md,
    padding: `${spacing['10']}px ${spacing['12']}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['4'],
    minHeight: 64,
  };
  const labelStyle: CSSProperties = {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: 500,
  };
  const valueStyle: CSSProperties = {
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.2,
    color: toneColor(tone),
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

// Скелетон балансовой карточки — для первого рендера, пока крутится запрос
// `/api/finance/balance`. Геометрия совпадает с реальной — нет «прыжка».
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
    gridTemplateColumns: '1fr 1fr',
    gap: spacing['10'],
  };
  return (
    <div style={card} aria-hidden>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
        <Skeleton width={110} height={13} />
        <Skeleton width={180} height={36} borderRadius={8} />
        <Skeleton width="80%" height={13} />
      </div>
      <div style={grid}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={64} borderRadius={radius.md} />
        ))}
      </div>
    </div>
  );
}
