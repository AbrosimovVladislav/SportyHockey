'use client';

import type { CSSProperties } from 'react';
import { Avatar } from './avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatName } from '@/lib/format-name';
import type { PlayerResultStats } from '@/types/api';

type Props = {
  stat: PlayerResultStats;
  labels: { goals: string; assists: string; points: string };
};

export function PlayerStatsRow({ stat, labels }: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['10']}px ${spacing['12']}px`,
  };

  const body: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };

  const name: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const jerseyLine: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
  };

  const statsGrid: CSSProperties = {
    display: 'flex',
    gap: spacing['16'],
    alignItems: 'center',
  };

  const col: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 32,
  };

  const num: CSSProperties = {
    fontSize: 17,
    fontWeight: 800,
    color: colors.text,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.2,
  };

  const lbl: CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const playerName = formatName(stat.user);
  const jerseySub =
    stat.user.jersey_number != null ? `#${stat.user.jersey_number}` : stat.user.username ? `@${stat.user.username}` : '';

  return (
    <div style={wrap}>
      <Avatar src={stat.user.photo_url} name={playerName} size={36} />
      <div style={body}>
        <span style={name}>{playerName}</span>
        {jerseySub ? <span style={jerseyLine}>{jerseySub}</span> : null}
      </div>
      <div style={statsGrid}>
        <div style={col}>
          <span style={num}>{stat.goals}</span>
          <span style={lbl}>{labels.goals}</span>
        </div>
        <div style={col}>
          <span style={num}>{stat.assists}</span>
          <span style={lbl}>{labels.assists}</span>
        </div>
        <div style={col}>
          <span style={{ ...num, color: colors.primary }}>{stat.points}</span>
          <span style={lbl}>{labels.points}</span>
        </div>
      </div>
    </div>
  );
}
