'use client';

import type { CSSProperties } from 'react';
import { Avatar } from './avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Props = {
  sideALabel: string;
  sideBLabel: string;
  scoreA: number;
  scoreB: number;
};

export function ScoreCard({ sideALabel, sideBLabel, scoreA, scoreB }: Props) {
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: `${spacing['16']}px ${spacing['12']}px`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: spacing['8'],
  };

  const column: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing['6'],
    minWidth: 0,
  };

  const sideLabel: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 1.25,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
  };

  const scoreWrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['8'],
    padding: `0 ${spacing['8']}px`,
  };

  const scoreNum: CSSProperties = {
    fontSize: 40,
    fontWeight: 800,
    color: colors.text,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
    letterSpacing: '-1px',
  };

  const colon: CSSProperties = {
    fontSize: 32,
    fontWeight: 700,
    color: colors.textTertiary,
    lineHeight: 1,
  };

  return (
    <div style={card}>
      <div style={column}>
        <Avatar src={null} name={sideALabel} size={44} />
        <span style={sideLabel}>{sideALabel}</span>
      </div>
      <div style={scoreWrap}>
        <span style={scoreNum}>{scoreA}</span>
        <span style={colon}>:</span>
        <span style={scoreNum}>{scoreB}</span>
      </div>
      <div style={column}>
        <Avatar src={null} name={sideBLabel} size={44} />
        <span style={sideLabel}>{sideBLabel}</span>
      </div>
    </div>
  );
}
