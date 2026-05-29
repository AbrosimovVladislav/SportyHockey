'use client';

import type { CSSProperties } from 'react';
import { Avatar } from './avatar';
import { IconChevronRight } from './icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatName } from '@/lib/format-name';
import type { PlayerPosition, PlayerResultStats } from '@/types/api';

type Props = {
  stat: PlayerResultStats;
  labels: {
    goals: string;
    assists: string;
    points: string;
    pim: string;
    position: Record<PlayerPosition, string>;
  };
  // Опциональный порядковый номер (1, 2, …). Используется в командной таблице
  // /squad/stats: «# Игрок Г П О Ш».
  rank?: number;
  // Опциональный обработчик тапа: оборачивает строку в кнопку с шевроном справа.
  onClick?: () => void;
};

export function PlayerStatsRow({ stat, labels, rank, onClick }: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['10']}px ${spacing['12']}px`,
    width: '100%',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: onClick ? 'pointer' : 'default',
    color: 'inherit',
    font: 'inherit',
  };

  const rankStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
    minWidth: 16,
    textAlign: 'left',
    flexShrink: 0,
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
    gap: spacing['12'],
    alignItems: 'center',
  };

  const col: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 28,
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
  const subParts: string[] = [];
  if (stat.user.jersey_number != null) subParts.push(`#${stat.user.jersey_number}`);
  else if (stat.user.username) subParts.push(`@${stat.user.username}`);
  if (stat.user.position) subParts.push(labels.position[stat.user.position]);
  const jerseySub = subParts.join(' · ');

  const content = (
    <>
      {rank != null ? <span style={rankStyle}>{rank}</span> : null}
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
        <div style={col}>
          <span style={{ ...num, color: stat.penalty_minutes > 0 ? colors.warning : colors.textTertiary }}>
            {stat.penalty_minutes}
          </span>
          <span style={lbl}>{labels.pim}</span>
        </div>
      </div>
      {onClick ? <IconChevronRight /> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="pressable" style={wrap} onClick={onClick}>
        {content}
      </button>
    );
  }
  return <div style={wrap}>{content}</div>;
}
