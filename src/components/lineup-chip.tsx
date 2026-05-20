'use client';

import { useState, type CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Avatar } from './avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Props = {
  id: string;
  name: string;
  photoUrl?: string | null;
  subtitle?: string;
  forOverlay?: boolean;
};

export function LineupChip({ id, name, photoUrl, subtitle, forOverlay = false }: Props) {
  const drag = useDraggable({ id, disabled: forOverlay });
  const [pressed, setPressed] = useState(false);

  const isPressed = pressed && !drag.isDragging && !forOverlay;

  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
    padding: `${spacing['8']}px ${spacing['12']}px`,
    background: colors.bg,
    border: `1px solid ${isPressed ? colors.headerAccent : colors.line}`,
    borderRadius: radius.md,
    minHeight: 60,
    boxShadow: forOverlay
      ? '0 8px 24px rgba(0,0,0,0.18)'
      : isPressed
        ? '0 6px 16px rgba(232, 79, 0, 0.18)'
        : '0 1px 2px rgba(0,0,0,0.04)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    WebkitTapHighlightColor: 'transparent',
    opacity: drag.isDragging && !forOverlay ? 0.35 : 1,
    transform: forOverlay ? 'scale(1.03)' : isPressed ? 'scale(0.99)' : undefined,
    transition: 'transform 100ms ease, box-shadow 120ms ease, border-color 120ms ease',
    width: '100%',
    boxSizing: 'border-box',
    cursor: forOverlay ? 'grabbing' : 'grab',
    touchAction: 'manipulation',
  };

  const nameStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.2,
  };

  const subStyle: CSSProperties = {
    fontSize: 12,
    color: colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
    marginTop: 2,
    lineHeight: 1.2,
  };

  const pressHandlers = forOverlay
    ? {}
    : {
        onPointerDown: () => setPressed(true),
        onPointerUp: () => setPressed(false),
        onPointerCancel: () => setPressed(false),
        onPointerLeave: () => setPressed(false),
      };

  return (
    <div
      ref={forOverlay ? undefined : drag.setNodeRef}
      style={wrap}
      {...(forOverlay ? {} : drag.listeners)}
      {...(forOverlay ? {} : drag.attributes)}
      {...pressHandlers}
    >
      <Avatar src={photoUrl ?? null} name={name} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={nameStyle}>{name}</div>
        {subtitle ? <div style={subStyle}>{subtitle}</div> : null}
      </div>
    </div>
  );
}
