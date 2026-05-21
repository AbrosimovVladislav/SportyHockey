'use client';

import type { CSSProperties } from 'react';
import { Avatar } from './avatar';
import { IconSticksCrossed, IconWhistle } from './icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatMatchTime } from '@/lib/format-time';
import type { GoalDto, PenaltyDto, ResultSide } from '@/types/api';

export type TimelineEvent =
  | { kind: 'goal'; goal: GoalDto }
  | { kind: 'penalty'; penalty: PenaltyDto };

type Props = {
  events: TimelineEvent[];
  sideAValue: ResultSide;
  title: string;
  noTimeLabel: string;
  onSelectEvent?: (event: TimelineEvent) => void;
  axisMinutes?: number;
};

const TICK_MINUTES = [0, 15, 30, 45, 60] as const;
const MARKER_SIZE = 28;
const MARKER_GAP = 4;
const ROW_PITCH = MARKER_SIZE + MARKER_GAP;
const TRACK_HEIGHT = 8;

function timeOf(e: TimelineEvent): number | null {
  return e.kind === 'goal' ? e.goal.time_seconds : e.penalty.time_seconds;
}

// «10:13» → 11-я минута (счёт с 1). null если время не указано.
function minuteOf(seconds: number | null): number | null {
  if (seconds == null || seconds < 0) return null;
  return Math.floor(seconds / 60) + 1;
}
function sideOf(e: TimelineEvent): ResultSide {
  return e.kind === 'goal' ? e.goal.team_side : e.penalty.team_side;
}
function userIdOf(e: TimelineEvent): string | null {
  return e.kind === 'goal'
    ? e.goal.scorer?.user_id ?? null
    : e.penalty.player?.user_id ?? null;
}
function photoUrlOf(e: TimelineEvent): string | null {
  return e.kind === 'goal'
    ? e.goal.scorer?.photo_url ?? null
    : e.penalty.player?.photo_url ?? null;
}
function displayNameOf(e: TimelineEvent): string {
  if (e.kind === 'goal') {
    const s = e.goal.scorer;
    return s ? `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || (s.username ?? '?') : '?';
  }
  const p = e.penalty.player;
  return p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || (p.username ?? '?') : '?';
}

type Placement = {
  event: TimelineEvent;
  leftPct: number;
  row: number;
  isOurSide: boolean;
};

export function EventsTimeline({
  events,
  sideAValue,
  title,
  noTimeLabel,
  onSelectEvent,
  axisMinutes = 60,
}: Props) {
  const totalSeconds = axisMinutes * 60;
  const withTime = events.filter((e) => timeOf(e) != null);
  const withoutTime = events.filter((e) => timeOf(e) == null);

  // collision detection: для каждой стороны (top/bottom) ведём массив занятых маркеров по рядам.
  const topRows: Placement[][] = [];
  const bottomRows: Placement[][] = [];

  const placements: Placement[] = withTime
    .slice()
    .sort((a, b) => (timeOf(a) ?? 0) - (timeOf(b) ?? 0))
    .map((e) => {
      const t = timeOf(e) ?? 0;
      const clamped = Math.min(t, totalSeconds - 1);
      const leftPct = (clamped / totalSeconds) * 100;
      const isOurSide = sideOf(e) === sideAValue;
      const rows = isOurSide ? topRows : bottomRows;
      // Минимальное горизонтальное расстояние между маркерами в одном ряду — ширина маркера в %.
      // Точно посчитать нельзя (зависит от ширины контейнера), но оценим: ширина контейнера ≈ ширина экрана minus padding.
      // Используем фиксированный минимум 8% — лучше избыток разрыва, чем наложение на узком экране.
      const minDistance = 8;
      let row = 0;
      while (true) {
        const rowArr = rows[row];
        if (!rowArr) {
          rows[row] = [];
          rows[row].push({ event: e, leftPct, row, isOurSide });
          return { event: e, leftPct, row, isOurSide } as Placement;
        }
        const conflict = rowArr.some((p) => Math.abs(p.leftPct - leftPct) < minDistance);
        if (!conflict) {
          rowArr.push({ event: e, leftPct, row, isOurSide });
          return { event: e, leftPct, row, isOurSide } as Placement;
        }
        row += 1;
      }
    });

  const topMaxRow = Math.max(0, ...placements.filter((p) => p.isOurSide).map((p) => p.row));
  const bottomMaxRow = Math.max(0, ...placements.filter((p) => !p.isOurSide).map((p) => p.row));
  const topAreaHeight = (topMaxRow + 1) * ROW_PITCH;
  const bottomAreaHeight = (bottomMaxRow + 1) * ROW_PITCH;

  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: `${spacing['12']}px ${spacing['16']}px ${spacing['12']}px`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
  };

  const titleStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: spacing['12'],
  };

  const timelineWrap: CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const topArea: CSSProperties = {
    position: 'relative',
    height: topAreaHeight,
  };
  const bottomArea: CSSProperties = {
    position: 'relative',
    height: bottomAreaHeight,
  };

  const track: CSSProperties = {
    position: 'relative',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    background: colors.bgMuted,
    margin: `${spacing['6']}px 0`,
  };

  const ticksRow: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    marginTop: spacing['4'],
  };

  const noTimeWrap: CSSProperties = {
    marginTop: spacing['12'],
    paddingTop: spacing['10'],
    borderTop: `1px solid ${colors.divider}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
  };

  const noTimeTitle: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  if (events.length === 0) return null;

  const renderMarker = (p: Placement) => {
    const e = p.event;
    const isGoal = e.kind === 'goal';
    const isOur = p.isOurSide;
    const photo = photoUrlOf(e);
    const name = displayNameOf(e);
    const userId = userIdOf(e);
    const showAvatar = isOur && userId !== null;

    // Расположение: для top — снизу = 0 (стоят на линии), row сдвигает вверх
    // для bottom — сверху = 0 (висят с линии), row сдвигает вниз
    const positionStyle: CSSProperties = p.isOurSide
      ? { bottom: p.row * ROW_PITCH }
      : { top: p.row * ROW_PITCH };

    const wrapStyle: CSSProperties = {
      position: 'absolute',
      left: `calc(${p.leftPct}% - ${MARKER_SIZE / 2}px)`,
      width: MARKER_SIZE,
      height: MARKER_SIZE,
      ...positionStyle,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: onSelectEvent ? 'pointer' : 'default',
      background: 'transparent',
      border: 'none',
      padding: 0,
    };

    const fallbackColor = isGoal
      ? isOur
        ? colors.primary
        : colors.textSecondary
      : isOur
        ? colors.warning
        : colors.textSecondary;

    const fallbackBg = isGoal
      ? isOur
        ? colors.primaryLight
        : colors.bgMuted
      : isOur
        ? colors.warningBg
        : colors.bgMuted;

    const fallbackCircle: CSSProperties = {
      width: MARKER_SIZE - 4,
      height: MARKER_SIZE - 4,
      borderRadius: '50%',
      background: fallbackBg,
      border: `1.5px solid ${fallbackColor}`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: fallbackColor,
    };

    const typeBadge: CSSProperties = {
      position: 'absolute',
      top: -3,
      right: -3,
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: isGoal ? colors.primary : colors.warning,
      border: `2px solid ${colors.bg}`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const minuteValue = minuteOf(timeOf(e));
    const minuteBadge: CSSProperties = {
      position: 'absolute',
      bottom: -5,
      right: -6,
      minWidth: 16,
      height: 14,
      padding: '0 3px',
      borderRadius: 7,
      background: colors.text,
      color: colors.textInverse,
      border: `2px solid ${colors.bg}`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 9,
      fontWeight: 800,
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1,
    };

    const content = (
      <div style={{ position: 'relative', width: MARKER_SIZE, height: MARKER_SIZE }}>
        {showAvatar ? (
          <Avatar src={photo} name={name} size={MARKER_SIZE - 2} />
        ) : (
          <span style={fallbackCircle}>
            {isGoal ? (
              <IconSticksCrossed size={12} color={fallbackColor} />
            ) : (
              <IconWhistle size={12} color={fallbackColor} />
            )}
          </span>
        )}
        {showAvatar ? (
          <span style={typeBadge} aria-hidden>
            {isGoal ? (
              <IconSticksCrossed size={8} color={colors.textInverse} />
            ) : (
              <IconWhistle size={8} color={colors.textInverse} />
            )}
          </span>
        ) : null}
        {minuteValue != null ? (
          <span style={minuteBadge} aria-hidden>
            {minuteValue}'
          </span>
        ) : null}
      </div>
    );

    const tooltip = `${isGoal ? '⚒' : '⏱'} ${name}${
      formatMatchTime(timeOf(e)) ? ' · ' + formatMatchTime(timeOf(e)) : ''
    }`;

    if (onSelectEvent) {
      return (
        <button
          key={`${e.kind}-${e.kind === 'goal' ? e.goal.id : e.penalty.id}`}
          type="button"
          className="pressable"
          aria-label={tooltip}
          title={tooltip}
          onClick={() => onSelectEvent(e)}
          style={wrapStyle}
        >
          {content}
        </button>
      );
    }
    return (
      <div
        key={`${e.kind}-${e.kind === 'goal' ? e.goal.id : e.penalty.id}`}
        style={wrapStyle}
        aria-label={tooltip}
        title={tooltip}
      >
        {content}
      </div>
    );
  };

  const topPlacements = placements.filter((p) => p.isOurSide);
  const bottomPlacements = placements.filter((p) => !p.isOurSide);

  const renderTick = (p: Placement) => {
    const isGoal = p.event.kind === 'goal';
    const color = isGoal
      ? p.isOurSide
        ? colors.primary
        : colors.textSecondary
      : p.isOurSide
        ? colors.warning
        : colors.textSecondary;
    const style: CSSProperties = {
      position: 'absolute',
      left: `calc(${p.leftPct}% - 1.5px)`,
      top: -2,
      width: 3,
      height: TRACK_HEIGHT + 4,
      borderRadius: 1.5,
      background: color,
    };
    return (
      <span
        key={`tick-${p.event.kind}-${
          p.event.kind === 'goal' ? p.event.goal.id : p.event.penalty.id
        }`}
        style={style}
        aria-hidden
      />
    );
  };

  return (
    <div style={card}>
      <div style={titleStyle}>{title}</div>
      <div style={timelineWrap}>
        <div style={topArea}>
          {topPlacements.map((p) => renderMarker(p))}
        </div>
        <div style={track}>
          {placements.map((p) => renderTick(p))}
        </div>
        <div style={bottomArea}>
          {bottomPlacements.map((p) => renderMarker(p))}
        </div>
        <div style={ticksRow}>
          {TICK_MINUTES.map((m) => (
            <span key={m}>{m}'</span>
          ))}
        </div>
      </div>

      {withoutTime.length > 0 ? (
        <div style={noTimeWrap}>
          <div style={noTimeTitle}>
            {noTimeLabel}: {withoutTime.length}
          </div>
          <div style={{ display: 'flex', gap: spacing['6'], flexWrap: 'wrap' }}>
            {withoutTime.map((e) => {
              const isGoal = e.kind === 'goal';
              const isOur = sideOf(e) === sideAValue;
              const photo = photoUrlOf(e);
              const name = displayNameOf(e);
              const userId = userIdOf(e);
              const showAvatar = isOur && userId !== null;

              const fallbackColor = isGoal
                ? isOur
                  ? colors.primary
                  : colors.textSecondary
                : isOur
                  ? colors.warning
                  : colors.textSecondary;
              const fallbackBg = isGoal
                ? isOur
                  ? colors.primaryLight
                  : colors.bgMuted
                : isOur
                  ? colors.warningBg
                  : colors.bgMuted;

              const wrapStyle: CSSProperties = {
                width: MARKER_SIZE,
                height: MARKER_SIZE,
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: onSelectEvent ? 'pointer' : 'default',
              };

              const content = showAvatar ? (
                <Avatar src={photo} name={name} size={MARKER_SIZE - 2} />
              ) : (
                <span
                  style={{
                    width: MARKER_SIZE - 4,
                    height: MARKER_SIZE - 4,
                    borderRadius: '50%',
                    background: fallbackBg,
                    border: `1.5px solid ${fallbackColor}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: fallbackColor,
                  }}
                >
                  {isGoal ? (
                    <IconSticksCrossed size={12} color={fallbackColor} />
                  ) : (
                    <IconWhistle size={12} color={fallbackColor} />
                  )}
                </span>
              );

              const key = `${e.kind}-${e.kind === 'goal' ? e.goal.id : e.penalty.id}`;
              if (onSelectEvent) {
                return (
                  <button
                    key={key}
                    type="button"
                    className="pressable"
                    aria-label={name}
                    title={name}
                    onClick={() => onSelectEvent(e)}
                    style={wrapStyle}
                  >
                    {content}
                  </button>
                );
              }
              return (
                <div key={key} style={wrapStyle} title={name}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
