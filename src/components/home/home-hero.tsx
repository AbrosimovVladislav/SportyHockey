'use client';

import { useEffect, type CSSProperties } from 'react';
import { Avatar } from '@/components/avatar';
import { IconCalendar, IconLocation } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatDayMonth, formatTime } from '@/lib/event-format';
import type { HomeNextEvent, HomeNextEventTeam } from '@/types/api';

// Шапка главной (v0.6, передизайн от 2026-06-08). Стиль и размеры —
// **идентичны** `DarkHeader` на /money / /events / /squad: 252px высоты
// + safe-top, тёмно-зелёный фон + опц. фон-картинка `/event-bg.jpg`,
// контент выровнен по нижнему краю. Снаружи белый sheet с radius 24px
// наезжает на шапку — обеспечивается стилями родителя [(tabs)/page.tsx].
//
// Внутри: логотип команды + название (для игры — пара логотипов + vs),
// бейдж типа события, крупная дата + время, иконка-локация + venue.
// Метрики и CTA «Открыть событие» — НЕ здесь; они в белом sheet
// (`NextEventInfoCard`), чтобы шапка совпадала по высоте с остальными
// разделами и не разрасталась.

const DARK_TOP_SCRIM =
  'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.88) 45%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0) 100%)';

type Props = {
  team: HomeNextEventTeam | null;
  event: HomeNextEvent | null;
  labels: {
    badgeTraining: string;
    badgeGame: string;
    badgeEmpty: string;
    versus: string;
  };
};

export function HomeHero({ team, event, labels }: Props) {
  // Top-scrim для опасной зоны — как в DarkHeader. На выходе сбрасываем,
  // чтобы светлые разделы не тащили затемнение под статус-баром.
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
    paddingBottom: spacing['32'],
    paddingLeft: spacing['20'],
    paddingRight: spacing['20'],
    minHeight: `calc(252px + var(--app-safe-top))`,
    display: 'flex',
    flexDirection: 'column',
  };

  const imageLayer: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: "url('/main.png') center/cover no-repeat",
    zIndex: 0,
  };
  // Затемнение у самого низа — под белые тексты (как в DarkHeader.bottomScrim).
  const bottomScrim: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 80%, rgba(0,0,0,0.8) 100%)',
    zIndex: 1,
  };
  const content: CSSProperties = {
    position: 'relative',
    zIndex: 2,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };
  // Спейсер между блоком команды/команд и блоком события. flex:1 «приклеивает»
  // событие к низу шапки на тренировке (там верхний блок короткий, спейсер
  // растягивается). `minHeight` гарантирует воздух даже когда контент длинный
  // (3 ряда для игры) и шапка распирается — иначе всё бы слипалось вплотную.
  const spacer: CSSProperties = { flex: 1, minHeight: spacing['24'] };
  const eventGroup: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['10'],
  };

  const isGame = event?.type === 'game';

  return (
    <div style={wrapper}>
      <div style={imageLayer} aria-hidden />
      <div style={bottomScrim} aria-hidden />
      <div style={content}>
        {isGame && event ? (
          <TeamsVersusRow
            ourName={team?.name ?? ''}
            ourLogo={team?.logo_url ?? null}
            opponentName={(event.opponent_name ?? '').trim() || labels.versus}
          />
        ) : (
          <TeamSoloRow name={team?.name ?? ''} logoUrl={team?.logo_url ?? null} />
        )}

        <div style={spacer} aria-hidden />

        <div style={eventGroup}>
          <Badge
            text={
              event
                ? isGame
                  ? labels.badgeGame
                  : labels.badgeTraining
                : labels.badgeEmpty
            }
          />

          {event ? (
            <>
              <div style={dateStyle}>
                {formatDayMonth(event.starts_at)}
                <span style={bullet}>·</span>
                {formatTime(event.starts_at)}
              </div>
              {event.venue?.name ? (
                <div style={venueStyle}>
                  <IconLocation size={14} color="rgba(255,255,255,0.85)" />
                  <span>{event.venue.name}</span>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const dateStyle: CSSProperties = {
  fontSize: 28,
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
const venueStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing['6'],
  fontSize: 14,
  color: 'rgba(255,255,255,0.85)',
};

// Размеры нашего блока (`OUR_LOGO_SIZE` + `OUR_NAME_FONT_SIZE`) одинаковы
// для тренировки и для игры — в обоих случаях наш блок выглядит идентично,
// меняется только наличие строки соперника снизу.
const OUR_LOGO_SIZE = 48;
const OUR_NAME_FONT_SIZE = 22;
const OPP_LOGO_SIZE = 36;
const OPP_NAME_FONT_SIZE = 16;

const ourNameStyle: CSSProperties = {
  fontSize: OUR_NAME_FONT_SIZE,
  fontWeight: 800,
  color: colors.textInverse,
  letterSpacing: '-0.01em',
  lineHeight: 1.1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
  margin: 0,
};

function TeamSoloRow({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['16'],
  };
  return (
    <div style={wrap}>
      <Avatar src={logoUrl} name={name} size={OUR_LOGO_SIZE} />
      <h1 style={ourNameStyle}>{name || '—'}</h1>
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
  // Для игры: три ряда — наш сверху, разделитель «— vs —», соперник снизу
  // (с уменьшенным лого и шрифтом, чтобы визуально подчеркнуть кто
  // «хозяин» главной страницы). Размеры нашего блока совпадают с тренировкой.
  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
  };
  const ourRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['16'],
  };
  const vsRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['8'],
    paddingLeft: spacing['8'],
  };
  const vsLine: CSSProperties = {
    width: 28,
    height: 1,
    background: 'rgba(255,255,255,0.5)',
    flexShrink: 0,
  };
  const vsText: CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  };
  const oppRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
    paddingLeft: spacing['4'],
    opacity: 0.9,
  };
  const oppNameStyle: CSSProperties = {
    fontSize: OPP_NAME_FONT_SIZE,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 1.15,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  };
  return (
    <div style={wrap}>
      <div style={ourRow}>
        <Avatar src={ourLogo} name={ourName} size={OUR_LOGO_SIZE} />
        <h1 style={ourNameStyle}>{ourName || '—'}</h1>
      </div>
      <div style={vsRow} aria-hidden>
        <span style={vsLine} />
        <span style={vsText}>vs</span>
        <span style={vsLine} />
      </div>
      <div style={oppRow}>
        <Avatar src={null} name={opponentName} size={OPP_LOGO_SIZE} />
        <span style={oppNameStyle}>{opponentName}</span>
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
  };
  return (
    <span style={badge}>
      <IconCalendar size={14} color={colors.textInverse} />
      {text}
    </span>
  );
}
