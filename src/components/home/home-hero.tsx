'use client';

import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { Avatar } from '@/components/avatar';
import {
  IconCalendar,
  IconChevronRight,
  IconLocation,
  IconPeople,
  IconRuble,
} from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatDayMonth, formatTime } from '@/lib/event-format';
import type { HomeNextEvent, HomeNextEventTeam } from '@/types/api';

// Главный hero-блок главной страницы (v0.6, итерация 62, передизайн от 2026-06-08).
// Это **шапка раздела + карточка ближайшего события одновременно**: тёмно-зелёный
// full-width блок в стиле DarkHeader из /money, но со сложным внутренним
// layout-ом, поэтому свой компонент, а не DarkHeader (тот завязан на один title).
//
// Структура сверху вниз:
//   1) Верхний row: логотип команды (или пара логотипов для игры) + название;
//   2) Бейдж типа («Ближайшая тренировка» / «Ближайшая игра»);
//   3) Body — слева крупная дата + время + строка с локацией, справа белая
//      карточка с тремя метриками (явка / взнос / места);
//   4) CTA «Открыть событие» (full-width primary с chevron).
//
// Если события нет (`event === null`) — те же шапка + бейдж «Нет событий» +
// CTA по роли, без метрик и даты. Шапка-блок остаётся всегда, чтобы при
// смене состояния layout не прыгал.

const DARK_TOP_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.88) 45%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0) 100%)';

type Props = {
  team: HomeNextEventTeam | null;
  event: HomeNextEvent | null;
  onOpenEvent: (eventId: string) => void;
  onEmptyCta: () => void;
  labels: {
    badgeTraining: string;
    badgeGame: string;
    badgeEmpty: string;
    cta: string;
    ctaEmpty: string;
    versus: string;
    attendanceCaption: string;
    feeCaption: string;
    seatsCaption: string;
  };
};

export function HomeHero({ team, event, onOpenEvent, onEmptyCta, labels }: Props) {
  // Пока открыта главная — глобальный top-scrim тёмный (как и на /money),
  // чтобы статус-бар Telegram не «вырезался» из тёмно-зелёного фона.
  useEffect(() => {
    const el = document.documentElement;
    el.style.setProperty('--app-top-scrim', DARK_TOP_SCRIM);
    return () => {
      el.style.removeProperty('--app-top-scrim');
    };
  }, []);

  const wrapper: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    background: colors.headerBg,
    color: colors.textInverse,
    paddingTop: `calc(${spacing['16']}px + var(--app-safe-top))`,
    paddingBottom: spacing['20'],
    paddingLeft: spacing['16'],
    paddingRight: spacing['16'],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };

  // Фон-картинка (если приложат public/event-bg.jpg) — заполняет блок целиком,
  // сверху лёгкий градиент для читабельности. Без файла увидим чистый headerBg.
  const imageLayer: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(20,30,25,0.3) 0%, rgba(20,30,25,0.65) 80%, rgba(20,30,25,0.85) 100%), url('/event-bg.jpg') center/cover no-repeat",
    zIndex: 0,
  };
  const content: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };

  const isGame = event?.type === 'game';

  return (
    <header style={wrapper}>
      <div style={imageLayer} aria-hidden />
      <div style={content}>
        {/* 1) Верхний row: логотип(ы) + название(я) команды/команд */}
        {isGame && event ? (
          <TeamsVersusRow
            ourName={team?.name ?? ''}
            ourLogo={team?.logo_url ?? null}
            opponentName={(event.opponent_name ?? '').trim() || labels.versus}
          />
        ) : (
          <TeamSoloRow name={team?.name ?? ''} logoUrl={team?.logo_url ?? null} />
        )}

        {/* 2 + 3 + 4) Содержимое события или empty state */}
        {event ? (
          <EventBody
            event={event}
            badgeText={isGame ? labels.badgeGame : labels.badgeTraining}
            attendanceCaption={labels.attendanceCaption}
            feeCaption={labels.feeCaption}
            seatsCaption={labels.seatsCaption}
          />
        ) : (
          <EmptyBody badgeText={labels.badgeEmpty} />
        )}

        <CtaButton
          label={event ? labels.cta : labels.ctaEmpty}
          onClick={event ? () => onOpenEvent(event.id) : onEmptyCta}
        />
      </div>
    </header>
  );
}

function TeamSoloRow({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['16'],
    minHeight: 80,
  };
  const title: CSSProperties = {
    fontSize: 26,
    fontWeight: 800,
    color: colors.textInverse,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0,
  };
  return (
    <div style={wrap}>
      <Avatar src={logoUrl} name={name} size={72} />
      <h1 style={title}>{name || '—'}</h1>
    </div>
  );
}

function TeamsVersusRow({
  ourName,
  ourLogo,
  opponentName,
}: {
  ourName: string;
  ourLogo: string | null;
  opponentName: string;
}) {
  const wrap: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: spacing['10'],
    minHeight: 80,
  };
  const side: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
    minWidth: 0,
  };
  const sideRight: CSSProperties = {
    ...side,
    flexDirection: 'row-reverse',
  };
  const name: CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: colors.textInverse,
    letterSpacing: '-0.01em',
    lineHeight: 1.15,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    flex: 1,
  };
  const vs: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  };
  return (
    <div style={wrap}>
      <div style={side}>
        <Avatar src={ourLogo} name={ourName} size={56} />
        <span style={name}>{ourName || '—'}</span>
      </div>
      <span style={vs}>vs</span>
      <div style={sideRight}>
        <Avatar src={null} name={opponentName} size={56} />
        <span style={{ ...name, textAlign: 'right' }}>{opponentName}</span>
      </div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
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
  return (
    <span style={badge}>
      <IconCalendar size={14} color={colors.textInverse} />
      {text}
    </span>
  );
}

function EventBody({
  event,
  badgeText,
  attendanceCaption,
  feeCaption,
  seatsCaption,
}: {
  event: HomeNextEvent;
  badgeText: string;
  attendanceCaption: string;
  feeCaption: string;
  seatsCaption: string;
}) {
  const body: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: spacing['12'],
    alignItems: 'stretch',
  };
  const left: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['10'],
    justifyContent: 'center',
  };
  const dateStyle: CSSProperties = {
    fontSize: 26,
    fontWeight: 800,
    color: colors.textInverse,
    letterSpacing: '-0.5px',
    lineHeight: 1.05,
    fontVariantNumeric: 'tabular-nums',
  };
  const bullet: CSSProperties = {
    color: colors.primary,
    margin: `0 ${spacing['6']}px`,
  };
  const venue: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['6'],
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
      <Badge text={badgeText} />
      <div style={body}>
        <div style={left}>
          <div style={dateStyle}>
            {formatDayMonth(event.starts_at)}
            <span style={bullet}>·</span>
            {formatTime(event.starts_at)}
          </div>
          {event.venue?.name ? (
            <div style={venue}>
              <IconLocation size={14} color="rgba(255,255,255,0.85)" />
              <span>{event.venue.name}</span>
            </div>
          ) : null}
        </div>
        <MetricsCard
          going={event.going_count}
          total={event.team_size}
          cost={event.cost_per_player}
          seats={event.seats_left}
          attendanceCaption={attendanceCaption}
          feeCaption={feeCaption}
          seatsCaption={seatsCaption}
        />
      </div>
    </div>
  );
}

function EmptyBody({ badgeText }: { badgeText: string }) {
  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['10'],
    paddingBottom: spacing['4'],
  };
  const text: CSSProperties = {
    fontSize: 22,
    fontWeight: 800,
    color: colors.textInverse,
    letterSpacing: '-0.4px',
    lineHeight: 1.1,
  };
  return (
    <div style={wrap}>
      <Badge text={badgeText} />
      <div style={text}>{badgeText}</div>
    </div>
  );
}

function MetricsCard({
  going,
  total,
  cost,
  seats,
  attendanceCaption,
  feeCaption,
  seatsCaption,
}: {
  going: number;
  total: number;
  cost: number | null;
  seats: number;
  attendanceCaption: string;
  feeCaption: string;
  seatsCaption: string;
}) {
  const card: CSSProperties = {
    flexShrink: 0,
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: radius.md,
    padding: `${spacing['10']}px ${spacing['12']}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
    minWidth: 130,
  };
  return (
    <div style={card}>
      <MetricRow
        icon={<IconPeople size={16} color="rgba(255,255,255,0.9)" />}
        value={`${going} из ${total}`}
        caption={attendanceCaption}
      />
      <Divider />
      <MetricRow
        icon={<IconRuble size={16} color="rgba(255,255,255,0.9)" />}
        value={cost != null ? formatFee(cost) : '—'}
        caption={feeCaption}
      />
      <Divider />
      <MetricRow
        icon={<IconSeat size={16} color="rgba(255,255,255,0.9)" />}
        value={String(seats)}
        caption={seatsCaption}
      />
    </div>
  );
}

function MetricRow({
  icon,
  value,
  caption,
}: {
  icon: ReactNode;
  value: string;
  caption: string;
}) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['8'],
  };
  const text: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    lineHeight: 1.15,
  };
  const valStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: colors.textInverse,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  };
  const capStyle: CSSProperties = {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
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

function Divider() {
  return (
    <span
      aria-hidden
      style={{ height: 1, background: 'rgba(255,255,255,0.12)', width: '100%' }}
    />
  );
}

function CtaButton({ label, onClick }: { label: string; onClick: () => void }) {
  const btn: CSSProperties = {
    width: '100%',
    background: colors.primary,
    color: colors.textInverse,
    border: 'none',
    borderRadius: radius.md,
    padding: `${spacing['12']}px ${spacing['20']}px`,
    minHeight: 52,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  };
  const chevron: CSSProperties = {
    position: 'absolute',
    right: spacing['20'],
    display: 'inline-flex',
    alignItems: 'center',
  };
  return (
    <button type="button" className="pressable" onClick={onClick} style={btn}>
      <span>{label}</span>
      <span style={chevron}>
        <IconChevronRight size={18} color={colors.textInverse} />
      </span>
    </button>
  );
}

function formatFee(value: number): string {
  const rounded = Number.isInteger(value) ? value : Math.round(value);
  return `${rounded.toLocaleString('ru-RU').replace(/,/g, ' ')} ₽`;
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
