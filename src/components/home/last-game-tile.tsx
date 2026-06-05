'use client';

import type { CSSProperties } from 'react';
import { Avatar } from '@/components/avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { formatDayMonth } from '@/lib/event-format';
import type { DashboardLastGame } from '@/types/api';

// Таб «Последняя игра» (v0.6, итерация 64.5): счёт нашей команды vs соперник,
// под счётом — два ряда метрик (ассисты и минуты удалений). Метрики, которых
// у нас нет в модели (броски, вбрасывания, силовые приёмы, сэйвы), не
// рисуем — юзер явно сказал не показывать. Если игр ещё не было — empty.

type Props = {
  game: DashboardLastGame | null;
  emptyTitle: string;
  labels: { assists: string; penalties: string; opponent: string };
};

export function LastGameTile({ game, emptyTitle, labels }: Props) {
  if (!game) {
    return (
      <div
        style={{
          padding: `${spacing['24']}px ${spacing['16']}px`,
          textAlign: 'center',
        }}
      >
        <span style={{ ...typography.bodyBold, color: colors.text }}>{emptyTitle}</span>
      </div>
    );
  }

  const opponentName = game.opponent_name?.trim() || labels.opponent;

  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: `${spacing['16']}px ${spacing['8']}px ${spacing['12']}px`,
    gap: spacing['12'],
  };
  const top: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: spacing['10'],
  };
  const side: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing['6'],
    minWidth: 0,
  };
  const sideName: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  };
  const center: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  };
  const score: CSSProperties = {
    ...typography.score,
    color: colors.text,
    fontSize: 36,
    letterSpacing: '-0.5px',
  };
  const colon: CSSProperties = {
    color: colors.textTertiary,
    fontWeight: 700,
    margin: `0 ${spacing['6']}px`,
  };
  const dateStyle: CSSProperties = {
    fontSize: 11,
    color: colors.textSecondary,
  };

  return (
    <div style={wrap}>
      <div style={top}>
        <div style={side}>
          <Avatar src={game.our_logo_url} name={game.our_name} size={44} />
          <span style={sideName}>{game.our_name || '—'}</span>
        </div>
        <div style={center}>
          <div style={score}>
            <span>{game.our_score}</span>
            <span style={colon}>:</span>
            <span>{game.opp_score}</span>
          </div>
          <span style={dateStyle}>{formatDayMonth(game.played_on)}</span>
        </div>
        <div style={side}>
          <Avatar src={null} name={opponentName} size={44} />
          <span style={sideName}>{opponentName}</span>
        </div>
      </div>

      <MetricRow label={labels.assists} left={game.our_assists} right={game.opp_assists} />
      <MetricRow
        label={labels.penalties}
        left={game.our_penalty_minutes}
        right={game.opp_penalty_minutes}
      />
    </div>
  );
}

function MetricRow({ label, left, right }: { label: string; left: number; right: number }) {
  const row: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 40px',
    alignItems: 'center',
    gap: spacing['8'],
    paddingTop: spacing['8'],
    borderTop: `1px solid ${colors.line}`,
  };
  const num: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
  };
  const center: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    textAlign: 'center',
  };
  return (
    <div style={row}>
      <span style={num}>{left}</span>
      <span style={center}>{label}</span>
      <span style={num}>{right}</span>
    </div>
  );
}
