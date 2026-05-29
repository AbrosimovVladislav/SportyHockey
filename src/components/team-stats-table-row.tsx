'use client';

import type { CSSProperties } from 'react';
import { Avatar } from './avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatName } from '@/lib/format-name';
import type { TeamStatsPlayerRow, TeamStatsType } from '@/types/api';

// Сетка ячеек таблицы /squad/stats: слева — игрок (аватар + имя/номер), справа —
// числовые показатели в равных по ширине колонках. Пропорции 45% / 55% (на
// числа), чтобы имена не уезжали в эллипсис на узких экранах.
//  • Игры       → И, Г, П, О, Ш (5 чисел, по 11% ширины каждое).
//  • Тренировки → И, Г, П, О    (4 числа, по 13.75% ширины).
// Заголовок и строка используют одну и ту же сетку, поэтому числа стоят строго
// под подписями.
const GRID_COLUMNS_GAME = '45% repeat(5, 11%)';
const GRID_COLUMNS_TRAINING = '45% repeat(4, 13.75%)';

function gridFor(type: TeamStatsType): string {
  return type === 'game' ? GRID_COLUMNS_GAME : GRID_COLUMNS_TRAINING;
}

type Props = {
  player: TeamStatsPlayerRow;
  type: TeamStatsType;
  onClick?: () => void;
};

export function TeamStatsTableRow({ player, type, onClick }: Props) {
  const isGame = type === 'game';

  const wrap: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: gridFor(type),
    alignItems: 'center',
    gap: spacing['4'],
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
      <span style={numCell(colors.textSecondary)}>{player.games_played}</span>
      <span style={numCell(colors.text)}>{player.goals}</span>
      <span style={numCell(colors.text)}>{player.assists}</span>
      <span style={numCell(colors.primary)}>{player.points}</span>
      {isGame ? (
        <span
          style={numCell(
            player.penalty_minutes > 0 ? colors.warning : colors.textTertiary,
          )}
        >
          {player.penalty_minutes}
        </span>
      ) : null}
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

// Заголовок таблицы — та же сетка, что и строка, чтобы числа стояли строго под
// подписями. Подписи однобуквенные: И (игры), Г (голы), П (передачи), О (очки),
// Ш (штраф). Это позволяет ужать колонки чисел до 55% ширины — игроку остаётся
// 45% и имена больше не схлопываются в эллипсис на типичной телеграм-ширине.
export function TeamStatsTableHeader({
  type,
  labels,
}: {
  type: TeamStatsType;
  labels: {
    player: string;
    games: string;
    goals: string;
    assists: string;
    points: string;
    penalty: string;
  };
}) {
  const isGame = type === 'game';
  const wrap: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: gridFor(type),
    alignItems: 'center',
    gap: spacing['4'],
    padding: `${spacing['8']}px ${spacing['12']}px`,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 600,
  };
  const headCell: CSSProperties = { textAlign: 'center' };
  return (
    <div style={wrap}>
      <span style={{ paddingLeft: 46 }}>{labels.player}</span>
      <span style={headCell}>{labels.games}</span>
      <span style={headCell}>{labels.goals}</span>
      <span style={headCell}>{labels.assists}</span>
      <span style={headCell}>{labels.points}</span>
      {isGame ? <span style={headCell}>{labels.penalty}</span> : null}
    </div>
  );
}
