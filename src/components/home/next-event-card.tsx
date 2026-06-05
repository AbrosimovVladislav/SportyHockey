'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import {
  IconCalendar,
  IconLocation,
  IconPeople,
  IconRuble,
} from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatDayMonth, formatTime } from '@/lib/event-format';
import type { HomeNextEvent, HomeNextEventTeam } from '@/types/api';

// Карточка ближайшего события для главной (v0.6, итерация 62).
// Адаптивная: для тренировки — фон + бейдж + дата + локация + метрики;
// для игры — добавляется блок «наша команда vs соперник» (логотипы + имена).
//
// Фон-картинка лежит в `/public/event-bg.jpg` (или будет добавлена позже).
// Пока файла нет — увидим тёмно-зелёную подложку (`colors.headerBg`).
//
// Метрики: «N из M идут», «X ₽ с игрока», «K мест». «Места» = сколько
// членов команды ещё могут сказать «иду» (team_size − going_count).

type Props = {
  event: HomeNextEvent;
  team: HomeNextEventTeam | null;
  onOpen: () => void;
  labels: {
    badgeTraining: string;
    badgeGame: string;
    cta: string;
    versusOpponent: string;
    attendanceCaption: string;
    feeCaption: string;
    seatsCaption: string;
  };
};

export function NextEventCard({ event, team, onOpen, labels }: Props) {
  const isGame = event.type === 'game';
  const card: CSSProperties = {
    position: 'relative',
    borderRadius: radius.lg,
    overflow: 'hidden',
    color: colors.textInverse,
    minHeight: 220,
    background: colors.headerBg,
    backgroundImage:
      "linear-gradient(180deg, rgba(20,30,25,0.45) 0%, rgba(20,30,25,0.75) 100%), url('/event-bg.jpg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: spacing['16'],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };

  const badge: CSSProperties = {
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing['6'],
    background: colors.primary,
    color: colors.textInverse,
    padding: `${spacing['6']}px ${spacing['10']}px`,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '-0.005em',
  };

  const dateBlock: CSSProperties = {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: '-0.5px',
    fontVariantNumeric: 'tabular-nums',
  };

  const venueLine: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['6'],
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 2,
  };

  const metricsRow: CSSProperties = {
    display: 'flex',
    background: 'rgba(255,255,255,0.10)',
    borderRadius: radius.md,
    padding: spacing['10'],
    gap: spacing['8'],
    alignItems: 'stretch',
  };

  return (
    <div style={card}>
      <span style={badge}>
        <IconCalendar size={14} color={colors.textInverse} />
        {isGame ? labels.badgeGame : labels.badgeTraining}
      </span>

      {isGame ? (
        <VersusBlock
          ourName={team?.name ?? null}
          ourLogo={team?.logo_url ?? null}
          opponentName={event.opponent_name ?? labels.versusOpponent}
        />
      ) : null}

      <div>
        <div style={dateBlock}>
          {formatDayMonth(event.starts_at)} · {formatTime(event.starts_at)}
        </div>
        {event.venue?.name ? (
          <div style={venueLine}>
            <IconLocation size={14} color="rgba(255,255,255,0.92)" />
            <span>{event.venue.name}</span>
          </div>
        ) : null}
      </div>

      <div style={metricsRow}>
        <Metric
          icon={<IconPeople size={18} color={colors.textInverse} />}
          value={`${event.going_count} из ${event.team_size}`}
          caption={labels.attendanceCaption}
        />
        <MetricDivider />
        <Metric
          icon={<IconRuble size={18} color={colors.textInverse} />}
          value={event.cost_per_player != null ? formatFee(event.cost_per_player) : '—'}
          caption={labels.feeCaption}
        />
        <MetricDivider />
        <Metric
          icon={<IconSeat size={18} color={colors.textInverse} />}
          value={String(event.seats_left)}
          caption={labels.seatsCaption}
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={onOpen}
        style={{ marginTop: 'auto' }}
      >
        {labels.cta}
      </Button>
    </div>
  );
}

function formatFee(value: number): string {
  // Целые суммы — без копеек; «1 500 ₽».
  const rounded = Number.isInteger(value) ? value : Math.round(value);
  return `${rounded.toLocaleString('ru-RU').replace(/,/g, ' ')} ₽`;
}

function Metric({
  icon,
  value,
  caption,
}: {
  icon: ReactNode;
  value: string;
  caption: string;
}) {
  const wrap: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: spacing['8'],
  };
  const text: CSSProperties = { display: 'flex', flexDirection: 'column', minWidth: 0 };
  const valStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: colors.textInverse,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  };
  const capStyle: CSSProperties = {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.2,
  };
  return (
    <div style={wrap}>
      {icon}
      <div style={text}>
        <span style={valStyle}>{value}</span>
        <span style={capStyle}>{caption}</span>
      </div>
    </div>
  );
}

function MetricDivider() {
  return (
    <div
      aria-hidden
      style={{ width: 1, background: 'rgba(255,255,255,0.18)', flexShrink: 0 }}
    />
  );
}

function VersusBlock({
  ourName,
  ourLogo,
  opponentName,
}: {
  ourName: string | null;
  ourLogo: string | null;
  opponentName: string;
}) {
  const wrap: CSSProperties = {
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
  const name: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textInverse,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  };
  const dash: CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.7)',
  };
  return (
    <div style={wrap}>
      <div style={side}>
        <Avatar src={ourLogo} name={ourName ?? ''} size={56} />
        <span style={name}>{ourName ?? '—'}</span>
      </div>
      <span style={dash}>—</span>
      <div style={side}>
        <Avatar src={null} name={opponentName} size={56} />
        <span style={name}>{opponentName}</span>
      </div>
    </div>
  );
}

function IconSeat({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 4v10h12V4" />
      <path d="M4 14h16v3H4z" />
      <path d="M6 17v3M18 17v3" />
    </svg>
  );
}
