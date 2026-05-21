'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { GoalDto, PenaltyDto, ResultSide } from '@/types/api';

type Props = {
  goals: GoalDto[];
  penalties: PenaltyDto[];
  sideAValue: ResultSide;
  sideBValue: ResultSide;
  sideALabel: string;
  sideBLabel: string;
  labels: { goals: string; pim: string };
};

export function SideComparison({
  goals,
  penalties,
  sideAValue,
  sideBValue,
  sideALabel,
  sideBLabel,
  labels,
}: Props) {
  const goalsA = goals.filter((g) => g.team_side === sideAValue).length;
  const goalsB = goals.filter((g) => g.team_side === sideBValue).length;
  const pimA = penalties
    .filter((p) => p.team_side === sideAValue)
    .reduce((sum, p) => sum + p.minutes, 0);
  const pimB = penalties
    .filter((p) => p.team_side === sideBValue)
    .reduce((sum, p) => sum + p.minutes, 0);

  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['12'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing['8'],
  };

  const sideBox = (highlight: boolean): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
    padding: spacing['12'],
    background: highlight ? colors.primaryLight : colors.bgMuted,
    borderRadius: radius.md,
    border: highlight ? `1.5px solid ${colors.primary}` : '1.5px solid transparent',
  });

  const sideLabelStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  };

  const num: CSSProperties = {
    fontSize: 22,
    fontWeight: 800,
    color: colors.text,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
  };

  const lbl: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const highlightA = goalsA > goalsB;
  const highlightB = goalsB > goalsA;

  return (
    <div style={card}>
      <div style={sideBox(highlightA)}>
        <div style={sideLabelStyle}>{sideALabel}</div>
        <div style={row}>
          <span style={num}>{goalsA}</span>
          <span style={lbl}>{labels.goals}</span>
        </div>
        <div style={row}>
          <span style={{ ...num, fontSize: 18, color: pimA > 0 ? colors.warning : colors.textTertiary }}>
            {pimA}
          </span>
          <span style={lbl}>{labels.pim}</span>
        </div>
      </div>
      <div style={sideBox(highlightB)}>
        <div style={sideLabelStyle}>{sideBLabel}</div>
        <div style={row}>
          <span style={num}>{goalsB}</span>
          <span style={lbl}>{labels.goals}</span>
        </div>
        <div style={row}>
          <span style={{ ...num, fontSize: 18, color: pimB > 0 ? colors.warning : colors.textTertiary }}>
            {pimB}
          </span>
          <span style={lbl}>{labels.pim}</span>
        </div>
      </div>
    </div>
  );
}
