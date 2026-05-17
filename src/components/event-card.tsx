'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { IconWhistle, IconSticksCrossed, IconTrophy, IconChevronRight } from './icons';

export type EventCardKind = 'training' | 'game' | 'tournament';

type Props = {
  kind?: EventCardKind;
  title: string;
  venue?: string;
  timePrimary: string;
  timeSecondary?: string;
  weekDate?: string;
  weekDay?: string;
  count?: number;
  total?: number;
  onClick?: () => void;
};

function IconForKind({ kind }: { kind: EventCardKind }) {
  if (kind === 'tournament') return <IconTrophy size={22} color={colors.gold} />;
  if (kind === 'game') return <IconSticksCrossed size={22} color={colors.iconFg} />;
  return <IconWhistle size={22} color={colors.iconFg} />;
}

export function EventCard({
  kind = 'training',
  title,
  venue,
  timePrimary,
  timeSecondary,
  weekDate,
  weekDay,
  count,
  total,
  onClick,
}: Props) {
  const isWeek = weekDate != null;
  const iconBg = kind === 'tournament' ? colors.goldBg : colors.iconBg;

  const card: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing['16']}px ${spacing['12']}px`,
    gap: spacing['10'],
    background: colors.bg,
    borderRadius: radius.lg,
    border: `1px solid ${colors.line}`,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    width: '100%',
    cursor: onClick ? 'pointer' : 'default',
    textAlign: 'left',
    color: colors.text,
  };

  const timeCol: CSSProperties = {
    flexShrink: 0,
    minWidth: isWeek ? 44 : 40,
    fontVariantNumeric: 'tabular-nums',
  };

  const iconBox: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    flexShrink: 0,
    background: iconBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const titleStyle: CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: colors.text,
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const venueStyle: CSSProperties = {
    fontSize: 13,
    color: colors.tabInactive,
    marginTop: 2,
  };

  const content = (
    <>
      <div style={timeCol}>
        {isWeek ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: colors.text, lineHeight: 1 }}>
                {weekDate}
              </span>
              {weekDay ? (
                <span style={{ fontSize: 13, color: colors.tabInactive }}>{weekDay}</span>
              ) : null}
            </div>
            <div style={{ fontSize: 14, color: colors.tabInactive, marginTop: 2 }}>{timePrimary}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 17, fontWeight: 600, color: colors.text, lineHeight: 1.2 }}>
              {timePrimary}
            </div>
            {timeSecondary ? (
              <div style={{ fontSize: 13, color: colors.tabInactive, marginTop: 2 }}>
                {timeSecondary}
              </div>
            ) : null}
          </>
        )}
      </div>
      <div style={iconBox}>
        <IconForKind kind={kind} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={titleStyle}>{title}</div>
        {venue ? <div style={venueStyle}>{venue}</div> : null}
      </div>
      {count != null && total != null ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['8'], flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: colors.headerAccent, fontWeight: 700 }}>{count}</span>
            <span style={{ color: colors.tabInactive }}> / {total}</span>
          </span>
          {onClick ? <IconChevronRight /> : null}
        </div>
      ) : onClick ? (
        <IconChevronRight />
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="pressable" style={card}>
        {content}
      </button>
    );
  }

  return <div style={card}>{content}</div>;
}
