'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { GoalDto, ResultSide } from '@/types/api';

type Props = {
  goals: GoalDto[];
  sideAValue: ResultSide;
  title: string;
  noTimeLabel: string;
  axisMinutes?: number;
};

const TICK_MINUTES = [0, 15, 30, 45, 60] as const;

export function GoalsTimeline({
  goals,
  sideAValue,
  title,
  noTimeLabel,
  axisMinutes = 60,
}: Props) {
  const withTime = goals.filter((g) => g.time_seconds != null);
  const noTime = goals.filter((g) => g.time_seconds == null);

  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: `${spacing['12']}px ${spacing['16']}px`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
  };

  const titleStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: spacing['12'],
  };

  const track: CSSProperties = {
    position: 'relative',
    height: 12,
    borderRadius: 6,
    background: colors.bgMuted,
    marginBottom: spacing['8'],
  };

  const ticksRow: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  };

  const noTimeRow: CSSProperties = {
    marginTop: spacing['10'],
    display: 'flex',
    alignItems: 'center',
    gap: spacing['8'],
    fontSize: 12,
    color: colors.textSecondary,
  };

  if (withTime.length === 0 && noTime.length === 0) return null;

  const renderMarker = (g: GoalDto, idx: number, key: string) => {
    if (g.time_seconds == null) return null;
    const totalSeconds = axisMinutes * 60;
    const clamped = Math.min(g.time_seconds, totalSeconds - 1);
    const pct = (clamped / totalSeconds) * 100;
    const isSideA = g.team_side === sideAValue;
    const dotStyle: CSSProperties = {
      position: 'absolute',
      left: `calc(${pct}% - 6px)`,
      top: -3,
      width: 12,
      height: 18,
      borderRadius: 6,
      background: isSideA ? colors.primary : colors.textSecondary,
      boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
      zIndex: idx + 1,
    };
    return <span key={key} style={dotStyle} aria-hidden />;
  };

  return (
    <div style={card}>
      <div style={titleStyle}>{title}</div>
      <div style={track}>
        {withTime.map((g, idx) => renderMarker(g, idx, g.id))}
      </div>
      <div style={ticksRow}>
        {TICK_MINUTES.map((m) => (
          <span key={m}>{m}'</span>
        ))}
      </div>
      {noTime.length > 0 ? (
        <div style={noTimeRow}>
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: colors.textTertiary,
              display: 'inline-block',
            }}
          />
          <span>
            {noTimeLabel}: {noTime.length}
          </span>
        </div>
      ) : null}
    </div>
  );
}
