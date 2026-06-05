'use client';

import type { CSSProperties } from 'react';
import { Avatar } from '@/components/avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { DashboardTopPlayer } from '@/types/api';

// Топ-5 игроков команды по очкам (Г + П) только в играх (v0.6, итерация 64.4).
// Таблица: позиция, аватар + имя + #номер, Г / П / Очки. Колонка «Очки»
// выделена зелёным — основная метрика.

type Props = {
  players: DashboardTopPlayer[];
  emptyTitle: string;
  emptySubtitle: string;
  labels: { player: string; goals: string; assists: string; points: string };
};

export function TopPlayersTable({ players, emptyTitle, emptySubtitle, labels }: Props) {
  if (players.length === 0) {
    return <Empty title={emptyTitle} subtitle={emptySubtitle} />;
  }

  const head: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '28px 1fr 36px 36px 44px',
    alignItems: 'center',
    gap: spacing['8'],
    padding: `${spacing['8']}px ${spacing['4']}px`,
    fontSize: 11,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  };

  const row: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '28px 1fr 36px 36px 44px',
    alignItems: 'center',
    gap: spacing['8'],
    padding: `${spacing['10']}px ${spacing['4']}px`,
    borderTop: `1px solid ${colors.line}`,
  };

  return (
    <div>
      <div style={head}>
        <span aria-hidden />
        <span>{labels.player}</span>
        <span style={{ textAlign: 'right' }}>{labels.goals}</span>
        <span style={{ textAlign: 'right' }}>{labels.assists}</span>
        <span style={{ textAlign: 'right' }}>{labels.points}</span>
      </div>
      {players.map((p, i) => (
        <PlayerRow key={p.user_id} player={p} rank={i + 1} rowStyle={row} />
      ))}
    </div>
  );
}

function PlayerRow({
  player,
  rank,
  rowStyle,
}: {
  player: DashboardTopPlayer;
  rank: number;
  rowStyle: CSSProperties;
}) {
  const fullName = [player.first_name, player.last_name].filter(Boolean).join(' ').trim();
  const display = fullName || '—';

  const rankStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textSecondary,
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
  };
  const numStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  };
  const pointsStyle: CSSProperties = {
    ...numStyle,
    fontWeight: 800,
    color: colors.successDark,
    fontSize: 15,
  };
  const playerCell: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['8'],
    minWidth: 0,
  };
  const nameCol: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  };
  const nameStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: 1.2,
  };
  const jerseyStyle: CSSProperties = {
    fontSize: 11,
    color: colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div style={rowStyle}>
      <span style={rankStyle}>{rank}</span>
      <div style={playerCell}>
        <Avatar src={player.avatar_url ?? player.photo_url} name={display} size={28} />
        <div style={nameCol}>
          <span style={nameStyle}>{display}</span>
          {player.jersey_number != null ? (
            <span style={jerseyStyle}>#{player.jersey_number}</span>
          ) : null}
        </div>
      </div>
      <span style={numStyle}>{player.goals}</span>
      <span style={numStyle}>{player.assists}</span>
      <span style={pointsStyle}>{player.points}</span>
    </div>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  const wrap: CSSProperties = {
    padding: `${spacing['24']}px ${spacing['16']}px`,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['4'],
  };
  return (
    <div style={wrap}>
      <span style={{ ...typography.bodyBold, color: colors.text }}>{title}</span>
      <span style={{ ...typography.sm, color: colors.textSecondary }}>{subtitle}</span>
    </div>
  );
}
