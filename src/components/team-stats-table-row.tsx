'use client';

import type { CSSProperties } from 'react';
import { Avatar } from './avatar';
import { IconChevronRight } from './icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatName } from '@/lib/format-name';
import type { TeamStatsPlayerRow } from '@/types/api';

// Сетка ячеек таблицы /squad/stats: первая ячейка — игрок (аватар + имя/номер),
// далее равные по ширине числа Г / П / О / Ш. Эти же значения колонок
// использует заголовок таблицы (TeamStatsTableHeader) — поэтому числа всегда
// стоят строго под своими заголовками.
const GRID_COLUMNS = '1fr 40px 64px 40px 48px';

type Props = {
  player: TeamStatsPlayerRow;
  onClick?: () => void;
};

export function TeamStatsTableRow({ player, onClick }: Props) {
  const wrap: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: GRID_COLUMNS,
    alignItems: 'center',
    gap: spacing['8'],
    width: '100%',
    padding: `${spacing['10']}px ${spacing['12']}px`,
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    color: 'inherit',
    font: 'inherit',
    cursor: onClick ? 'pointer' : 'default',
  };

  const playerCell: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
    minWidth: 0,
  };
  const nameWrap: CSSProperties = {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };
  const nameStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  const jersey: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
  };
  const numCell = (color: string): CSSProperties => ({
    fontSize: 17,
    fontWeight: 800,
    color,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'center',
  });

  const playerName = formatName({
    first_name: player.first_name,
    last_name: player.last_name,
    username: null,
  });

  const content = (
    <>
      <div style={playerCell}>
        <Avatar src={player.avatar_url ?? player.photo_url} name={playerName} size={36} />
        <div style={nameWrap}>
          <span style={nameStyle}>{playerName}</span>
          {player.jersey_number != null ? (
            <span style={jersey}>#{player.jersey_number}</span>
          ) : null}
        </div>
      </div>
      <span style={numCell(colors.text)}>{player.goals}</span>
      <span style={numCell(colors.text)}>{player.assists}</span>
      <span style={numCell(colors.primary)}>{player.points}</span>
      <span
        style={numCell(
          player.penalty_minutes > 0 ? colors.warning : colors.textTertiary,
        )}
      >
        {player.penalty_minutes}
      </span>
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

// Заголовок таблицы — те же колонки, чтобы числа стояли строго под подписями.
export function TeamStatsTableHeader({
  labels,
}: {
  labels: { player: string; goals: string; assists: string; points: string; penalty: string };
}) {
  const wrap: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: GRID_COLUMNS,
    alignItems: 'center',
    gap: spacing['8'],
    padding: `${spacing['8']}px ${spacing['12']}px`,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 600,
  };
  const headCell: CSSProperties = { textAlign: 'center' };
  return (
    <div style={wrap}>
      <span style={{ paddingLeft: 46 }}>{labels.player}</span>
      <span style={headCell}>{labels.goals}</span>
      <span style={headCell}>{labels.assists}</span>
      <span style={headCell}>{labels.points}</span>
      <span style={headCell}>{labels.penalty}</span>
    </div>
  );
}
