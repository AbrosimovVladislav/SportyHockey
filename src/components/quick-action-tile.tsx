'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

// Большая плитка быстрых действий на хабе «Деньги». Иконка в круге (тон-под-смысл),
// под ней — двух-строчный лейбл. Используется в строке из трёх плиток.

type Tone = 'positive' | 'neutral' | 'negative';

type Props = {
  icon: ReactNode;
  label: string;
  // positive — оплата/доход (зелёная иконка), neutral — нейтральное действие,
  // negative — расход (красная иконка).
  tone?: Tone;
  onClick?: () => void;
};

export function QuickActionTile({ icon, label, tone = 'neutral', onClick }: Props) {
  const ring = toneBackground(tone);
  const fg = toneForeground(tone);

  const tile: CSSProperties = {
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    borderRadius: radius.lg,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02)',
    padding: `${spacing['16']}px ${spacing['10']}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing['10'],
    cursor: onClick ? 'pointer' : 'default',
    width: '100%',
    minHeight: 108,
  };

  const iconCircle: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: ring,
    color: fg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const labelStyle: CSSProperties = {
    ...typography.sm,
    color: colors.text,
    fontWeight: 600,
    lineHeight: 1.25,
    textAlign: 'center',
  };

  return (
    <button type="button" className="pressable" onClick={onClick} style={tile}>
      <span style={iconCircle} aria-hidden>
        {icon}
      </span>
      <span style={labelStyle}>{label}</span>
    </button>
  );
}

function toneBackground(tone: Tone): string {
  if (tone === 'positive') return colors.successBg;
  if (tone === 'negative') return colors.errorBg;
  return colors.bgMuted;
}

function toneForeground(tone: Tone): string {
  if (tone === 'positive') return colors.successDark;
  if (tone === 'negative') return colors.errorDark;
  return colors.text;
}

// Экспорт тонов — чтобы вызывающая страница могла подобрать цвет иконки одной
// функцией, не дублируя enum-логику.
export function quickActionForeground(tone: Tone): string {
  return toneForeground(tone);
}
