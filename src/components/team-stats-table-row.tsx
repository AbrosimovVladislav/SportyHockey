'use client';

import type { CSSProperties } from 'react';
import { Avatar } from './avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { TeamStatsPlayerRow, TeamStatsType } from '@/types/api';

// Сетка ячеек таблицы /squad/stats: ровно 50% слева на игрока (аватар + имя
// в две строки + номер) и 50% справа на числа — равными по ширине колонками.
//  • Игры       → И, Г, П, О, Ш (5 чисел, по 10% ширины каждое).
//  • Тренировки → И, Г, П, О    (4 числа, по 12.5%).
// Заголовок таблицы (TeamStatsTableHeader) использует эту же сетку, чтобы числа
// стояли строго под однобуквенными подписями.
const GRID_COLUMNS_GAME = '50% repeat(5, 10%)';
const GRID_COLUMNS_TRAINING = '50% repeat(4, 12.5%)';

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
    gap: 0,
  };
  // Имя и фамилия — на отдельных строках. На узких экранах фамилии целиком
  // не влезают в одну строку, поэтому ellipsis оставляем как страховку,
  // но за счёт переноса видно гораздо больше реального содержимого.
  const lineStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: colors.text,
    lineHeight: '17px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  const jersey: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    lineHeight: '14px',
    marginTop: 2,
  };
  const numCell = (color: string): CSSProperties => ({
    fontSize: 17,
    fontWeight: 800,
    color,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'center',
  });

  const firstName = player.first_name?.trim() ?? '';
  const lastName = player.last_name?.trim() ?? '';
  // Аватар: avatar_url (своя загрузка) приоритетнее photo_url (телеграмная).
  const avatarSrc = player.avatar_url ?? player.photo_url ?? null;
  const fallbackName = [firstName, lastName].filter(Boolean).join(' ');

  const content = (
    <>
      <div style={playerCell}>
        <Avatar src={avatarSrc} name={fallbackName} size={36} />
        <div style={nameWrap}>
          {firstName ? <span style={lineStyle}>{firstName}</span> : null}
          {lastName ? <span style={lineStyle}>{lastName}</span> : null}
          {!firstName && !lastName ? <span style={lineStyle}>—</span> : null}
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
// Ш (штраф). Колонка штрафов рендерится только на вкладке «Игры».
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
