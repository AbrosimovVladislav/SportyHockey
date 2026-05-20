'use client';

import { useState, type CSSProperties } from 'react';
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
  const [pressed, setPressed] = useState(false);

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

  const isPressed = pressed && !drag.isDragging && !forOverlay;
  const baseWrap: CSSProperties = {
    background: colors.bg,
    border: `1px solid ${isPressed ? colors.headerAccent : colors.line}`,
    borderRadius: radius.md,
    boxShadow: forOverlay
      ? '0 8px 24px rgba(0,0,0,0.18)'
      : isPressed
        ? `0 6px 16px rgba(232, 79, 0, 0.18)`
        : '0 1px 2px rgba(0,0,0,0.04)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    opacity: drag.isDragging && !forOverlay ? 0.35 : 1,
    transform: forOverlay
      ? 'scale(1.03)'
      : isPressed
        ? 'scale(0.98)'
        : undefined,
    transition: 'transform 100ms ease, box-shadow 120ms ease, border-color 120ms ease',
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative',
  };

  const pressHandlers = forOverlay
    ? {}
    : {
        onPointerDown: () => setPressed(true),
        onPointerUp: () => setPressed(false),
        onPointerCancel: () => setPressed(false),
        onPointerLeave: () => setPressed(false),
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
      WebkitTapHighlightColor: 'transparent',
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
        {...pressHandlers}
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
    cursor: forOverlay ? 'grabbing' : 'grab',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
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
    <div
      ref={forOverlay ? undefined : drag.setNodeRef}
      style={wrap}
      {...(forOverlay ? {} : drag.listeners)}
      {...(forOverlay ? {} : drag.attributes)}
      {...pressHandlers}
    >
      <Avatar src={photoUrl ?? null} name={`${displayFirst} ${displayLast}`} size={36} />
      <div style={nameStyle}>{displayFirst || '—'}</div>
      {displayLast ? <div style={nameStyle}>{displayLast}</div> : null}
      {subtitle ? <div style={subStyle}>{subtitle}</div> : null}
    </div>
  );
}
