'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export type MatchOutcome = 'win' | 'draw' | 'loss';

type Props = {
  outcome: MatchOutcome;
  labels: Record<MatchOutcome, string>;
};

const toneStyles: Record<MatchOutcome, CSSProperties> = {
  win: { background: colors.successBg, color: colors.successText },
  draw: { background: colors.bgMuted, color: colors.textSecondary },
  loss: { background: colors.errorBg, color: colors.errorText },
};

export function MatchResultChip({ outcome, labels }: Props) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing['6']}px ${spacing['12']}px`,
    borderRadius: radius.pill,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.02em',
    ...toneStyles[outcome],
  };
  return <span style={base}>{labels[outcome]}</span>;
}

export function outcomeForScore(scoreA: number, scoreB: number): MatchOutcome {
  if (scoreA > scoreB) return 'win';
  if (scoreA < scoreB) return 'loss';
  return 'draw';
}
