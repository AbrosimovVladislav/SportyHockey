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
  forOverlay?: boolean;
};

function GripDots() {
  return (
    <svg width={10} height={14} viewBox="0 0 10 14" aria-hidden focusable={false}>
      <g fill="#B6B3AC">
        <circle cx={3} cy={3} r={1.1} />
        <circle cx={7} cy={3} r={1.1} />
        <circle cx={3} cy={7} r={1.1} />
        <circle cx={7} cy={7} r={1.1} />
        <circle cx={3} cy={11} r={1.1} />
        <circle cx={7} cy={11} r={1.1} />
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
  forOverlay = false,
}: Props) {
  const drag = useDraggable({ id: dragId, disabled: forOverlay });

  const displayFirst = firstName ?? '';
  const displayLast = lastName ?? '';
  const subtitle =
    jersey != null && positionLabel
      ? `#${jersey} · ${positionLabel}`
      : jersey != null
        ? `#${jersey}`
        : positionLabel ?? '';

  const wrap: CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: `${spacing['8']}px ${spacing['6']}px ${spacing['8']}px`,
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    borderRadius: radius.md,
    minHeight: 102,
    boxShadow: forOverlay ? '0 8px 24px rgba(0,0,0,0.18)' : '0 1px 2px rgba(0,0,0,0.04)',
    userSelect: 'none',
    opacity: drag.isDragging && !forOverlay ? 0.35 : 1,
    transform: forOverlay ? 'scale(1.03)' : undefined,
    width: '100%',
    boxSizing: 'border-box',
  };

  const handle: CSSProperties = {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 20,
    height: 20,
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
      <div style={{ ...nameStyle }}>{displayFirst || '—'}</div>
      {displayLast ? <div style={nameStyle}>{displayLast}</div> : null}
      {subtitle ? <div style={subStyle}>{subtitle}</div> : null}
    </div>
  );
}
