'use client';

import type { CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Avatar } from './avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Props = {
  dragId: string;
  name: string;
  photoUrl?: string | null;
  jersey?: number | null;
  roleLabel?: string | null;
  forOverlay?: boolean;
};

function GripDots({ color = '#B6B3AC' }: { color?: string }) {
  return (
    <svg width={10} height={14} viewBox="0 0 10 14" aria-hidden focusable={false}>
      <g fill={color}>
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

export function LinePlayerChip({
  dragId,
  name,
  photoUrl,
  jersey,
  roleLabel,
  forOverlay = false,
}: Props) {
  const drag = useDraggable({ id: dragId, disabled: forOverlay });

  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['6'],
    padding: `${spacing['4']}px ${spacing['6']}px ${spacing['4']}px ${spacing['4']}px`,
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    borderRadius: radius.md,
    minHeight: 44,
    boxShadow: forOverlay ? '0 8px 24px rgba(0,0,0,0.18)' : '0 1px 2px rgba(0,0,0,0.04)',
    userSelect: 'none',
    opacity: drag.isDragging && !forOverlay ? 0.35 : 1,
    transform: forOverlay ? 'scale(1.03)' : undefined,
    width: '100%',
    boxSizing: 'border-box',
  };

  const handle: CSSProperties = {
    flexShrink: 0,
    width: 14,
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    touchAction: 'none',
    color: colors.textTertiary,
  };

  const textCol: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  };

  const roleStyle: CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 1,
  };

  const nameStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: colors.text,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.15,
  };

  const jerseyStyle: CSSProperties = {
    fontSize: 10,
    color: colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
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
      <Avatar src={photoUrl ?? null} name={name} size={26} />
      <div style={textCol}>
        {roleLabel ? <span style={roleStyle}>{roleLabel}</span> : null}
        {jersey != null ? <span style={jerseyStyle}>#{jersey}</span> : null}
        <span style={nameStyle}>{name}</span>
      </div>
    </div>
  );
}
