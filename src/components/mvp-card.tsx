'use client';

import type { CSSProperties } from 'react';
import { Avatar } from './avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatName } from '@/lib/format-name';
import type { PlayerPosition, PlayerResultStats } from '@/types/api';

type Props = {
  stat: PlayerResultStats;
  title: string;
  labels: {
    goals: string;
    assists: string;
    points: string;
    position: Record<PlayerPosition, string>;
  };
};

export function MvpCard({ stat, title, labels }: Props) {
  const wrap: CSSProperties = {
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
    color: colors.textInverse,
    borderRadius: radius.lg,
    padding: spacing['16'],
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    boxShadow: '0 4px 14px rgba(26,92,53,0.25)',
  };

  const titleStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    opacity: 0.85,
    marginBottom: 4,
  };

  const name: CSSProperties = {
    fontSize: 18,
    fontWeight: 800,
    color: colors.textInverse,
    lineHeight: 1.15,
  };

  const sub: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    opacity: 0.85,
    marginTop: 2,
  };

  const statsGrid: CSSProperties = {
    display: 'flex',
    gap: spacing['12'],
    flexShrink: 0,
    alignItems: 'center',
  };

  const col: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 28,
  };

  const num: CSSProperties = {
    fontSize: 20,
    fontWeight: 800,
    color: colors.textInverse,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.1,
  };

  const lbl: CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    opacity: 0.85,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const subParts: string[] = [];
  if (stat.user.jersey_number != null) subParts.push(`#${stat.user.jersey_number}`);
  else if (stat.user.username) subParts.push(`@${stat.user.username}`);
  if (stat.user.position) subParts.push(labels.position[stat.user.position]);
  const subtitle = subParts.join(' · ');

  return (
    <div style={wrap}>
      <Avatar src={stat.user.photo_url} name={formatName(stat.user)} size={52} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={titleStyle}>{title}</div>
        <div style={name}>{formatName(stat.user)}</div>
        {subtitle ? <div style={sub}>{subtitle}</div> : null}
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
          <span style={num}>{stat.points}</span>
          <span style={lbl}>{labels.points}</span>
        </div>
      </div>
    </div>
  );
}
