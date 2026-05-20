'use client';

import type { CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Avatar } from './avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Props = {
  dragId: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl?: string | null;
  jersey?: number | null;
  positionLabel?: string | null;
  layout?: 'horizontal' | 'vertical';
  forOverlay?: boolean;
};

function GripDots({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const big = size === 'lg';
  const width = big ? 18 : 12;
  const height = big ? 28 : 18;
  const r = big ? 1.7 : 1.2;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden focusable={false}>
      <g fill="#9C9994">
        <circle cx={width * 0.3} cy={height * 0.2} r={r} />
        <circle cx={width * 0.7} cy={height * 0.2} r={r} />
        <circle cx={width * 0.3} cy={height * 0.5} r={r} />
        <circle cx={width * 0.7} cy={height * 0.5} r={r} />
        <circle cx={width * 0.3} cy={height * 0.8} r={r} />
        <circle cx={width * 0.7} cy={height * 0.8} r={r} />
      </g>
    </svg>
  );
}

export function RosterCard({
  dragId,
  firstName,
  lastName,
  photoUrl,
  jersey,
  positionLabel,
  layout = 'vertical',
  forOverlay = false,
}: Props) {
  const drag = useDraggable({ id: dragId, disabled: forOverlay });

  const displayFirst = firstName ?? '';
  const displayLast = lastName ?? '';
  const verticalSeparator = ' · ';
  const horizontalSeparator = ' ';
  const sep = layout === 'horizontal' ? horizontalSeparator : verticalSeparator;
  const subtitle =
    jersey != null && positionLabel
      ? `#${jersey}${sep}${positionLabel}`
      : jersey != null
        ? `#${jersey}`
        : positionLabel ?? '';

  const baseWrap: CSSProperties = {
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    borderRadius: radius.md,
    boxShadow: forOverlay ? '0 8px 24px rgba(0,0,0,0.18)' : '0 1px 2px rgba(0,0,0,0.04)',
    userSelect: 'none',
    opacity: drag.isDragging && !forOverlay ? 0.35 : 1,
    transform: forOverlay ? 'scale(1.03)' : undefined,
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative',
  };

  if (layout === 'horizontal') {
    const wrap: CSSProperties = {
      ...baseWrap,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing['10'],
      padding: `${spacing['10']}px ${spacing['12']}px`,
      minHeight: 84,
      cursor: forOverlay ? 'grabbing' : 'grab',
      touchAction: 'manipulation',
    };
    const textCol: CSSProperties = {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    };
    const nameStyle: CSSProperties = {
      fontSize: 14,
      fontWeight: 600,
      color: colors.text,
      lineHeight: 1.2,
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
    };
    const subStyle: CSSProperties = {
      fontSize: 12,
      color: colors.textSecondary,
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1.2,
      marginTop: 4,
      overflowWrap: 'break-word',
    };
    return (
      <div
        ref={forOverlay ? undefined : drag.setNodeRef}
        style={wrap}
        {...(forOverlay ? {} : drag.listeners)}
        {...(forOverlay ? {} : drag.attributes)}
      >
        <Avatar src={photoUrl ?? null} name={`${displayFirst} ${displayLast}`} size={44} />
        <div style={textCol}>
          <div style={nameStyle}>{displayFirst || '—'}</div>
          {displayLast ? <div style={nameStyle}>{displayLast}</div> : null}
          {subtitle ? <div style={subStyle}>{subtitle}</div> : null}
        </div>
      </div>
    );
  }

  // vertical
  const wrap: CSSProperties = {
    ...baseWrap,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: `${spacing['8']}px ${spacing['6']}px ${spacing['8']}px`,
    minHeight: 102,
  };
  const handle: CSSProperties = {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 28,
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    touchAction: 'none',
    borderRadius: radius.sm,
  };
  const nameStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 1.2,
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  const subStyle: CSSProperties = {
    fontSize: 10,
    color: colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.1,
  };
  return (
    <div ref={forOverlay ? undefined : drag.setNodeRef} style={wrap}>
      <span
        style={handle}
        aria-label="Перетащить"
        {...(forOverlay ? {} : drag.listeners)}
        {...(forOverlay ? {} : drag.attributes)}
      >
        <GripDots />
      </span>
      <Avatar src={photoUrl ?? null} name={`${displayFirst} ${displayLast}`} size={36} />
      <div style={nameStyle}>{displayFirst || '—'}</div>
      {displayLast ? <div style={nameStyle}>{displayLast}</div> : null}
      {subtitle ? <div style={subStyle}>{subtitle}</div> : null}
    </div>
  );
}
