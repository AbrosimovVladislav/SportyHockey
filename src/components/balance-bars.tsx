'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { formatMoney } from '@/lib/format-money';

// Карточка детализации с bar-chart внутри (v0.5, итерация 59).
// Используется парой в гриде 1fr 1fr: слева «Нам должны» (positive),
// справа «Мы должны» (negative). В каждой карточке три строки, отсортированные
// по сумме убыванию; ширина столбца пропорциональна значению относительно
// максимального в карточке, цвет — насыщеннее у большего значения. Сумма по
// всем строкам = `TeamBalanceSummary.owed_by_us` / `owed_to_us`.
//
// Дизайн-логика «насыщенности»: первое место — базовый цвет (`success` /
// `error`), второе — alpha 0.65, третье — 0.35. Нулевые строки рендерятся
// как тонкая бледная плашка (alpha 0.15) без label, чтобы строка занимала
// фиксированное место и карточки не дрожали при обнулении категории.

type Tone = 'positive' | 'negative';

export type BalanceDetailItem = {
  label: string;
  value: number;
};

type Props = {
  title: string;
  tone: Tone;
  items: BalanceDetailItem[];
};

const ALPHAS = [1.0, 0.65, 0.35];
const ZERO_ALPHA = 0.15;
// Минимальная ширина непустого столбца — чтобы label умещался читаемо даже
// когда значение многократно меньше максимума.
const MIN_WIDTH_PCT = 28;
// Ширина нулевого столбца — узкая «пилл-намёк», просто чтобы строка не была
// пустой.
const ZERO_WIDTH_PCT = 14;

export function BalanceBars({ title, tone, items }: Props) {
  if (items.length === 0) return null;

  const base = tone === 'positive' ? colors.success : colors.error;
  const titleColor = tone === 'positive' ? colors.successDark : colors.errorDark;

  // Сортировка по значению убыванию — самый большой сверху.
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const maxValue = Math.max(0, ...sorted.map((it) => it.value));

  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['16'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
    minWidth: 0,
  };

  const titleStyle: CSSProperties = {
    ...typography.caption,
    color: titleColor,
    fontWeight: 700,
    letterSpacing: '-0.005em',
  };

  return (
    <div style={card}>
      <div style={titleStyle}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['6'] }}>
        {sorted.map((it, i) => {
          const isZero = !(it.value > 0);
          const alpha = isZero ? ZERO_ALPHA : ALPHAS[i] ?? ZERO_ALPHA;
          const widthPct = isZero
            ? ZERO_WIDTH_PCT
            : maxValue > 0
              ? Math.max(MIN_WIDTH_PCT, (it.value / maxValue) * 100)
              : MIN_WIDTH_PCT;
          return (
            <Row
              key={i}
              label={it.label}
              value={it.value}
              widthPct={widthPct}
              color={rgba(base, alpha)}
              showLabel={!isZero}
            />
          );
        })}
      </div>
    </div>
  );
}

type RowProps = {
  label: string;
  value: number;
  widthPct: number;
  color: string;
  showLabel: boolean;
};

function Row({ label, value, widthPct, color, showLabel }: RowProps) {
  const row: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: spacing['10'],
    alignItems: 'center',
  };
  // Track — невидимая дорожка во всю доступную ширину; в ней лежит сам bar
  // на широту widthPct%.
  const track: CSSProperties = {
    height: 28,
    minWidth: 0,
  };
  const bar: CSSProperties = {
    width: `${widthPct}%`,
    height: '100%',
    background: color,
    color: colors.textInverse,
    borderRadius: radius.sm,
    padding: `0 ${spacing['10']}px`,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  };
  const labelSpan: CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  };
  const valueStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: colors.text,
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
  };
  return (
    <div style={row}>
      <div style={track}>
        <div style={bar}>{showLabel ? <span style={labelSpan}>{label}</span> : null}</div>
      </div>
      <span style={valueStyle}>{formatMoney(value)}</span>
    </div>
  );
}

// Перевод hex (#rrggbb) → rgba с указанной непрозрачностью.
// Альтернативу через `color-mix()` пока не используем — поддержка
// в WebView Telegram не везде гарантирована.
function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
