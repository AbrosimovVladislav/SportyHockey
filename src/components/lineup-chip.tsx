'use client';

import type { CSSProperties } from 'react';
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
  variant?: 'pool' | 'zone';
  forOverlay?: boolean;
};

function GripIcon({ color = '#B6B3AC' }: { color?: string }) {
  return (
    <svg width={14} height={20} viewBox="0 0 14 20" aria-hidden focusable={false}>
      <g fill={color}>
        <circle cx={4} cy={5} r={1.4} />
        <circle cx={10} cy={5} r={1.4} />
        <circle cx={4} cy={10} r={1.4} />
        <circle cx={10} cy={10} r={1.4} />
        <circle cx={4} cy={15} r={1.4} />
        <circle cx={10} cy={15} r={1.4} />
      </g>
    </svg>
  );
}

export function LineupChip({
  id,
  name,
  photoUrl,
  subtitle,
  variant = 'zone',
  forOverlay = false,
}: Props) {
  const drag = useDraggable({ id, disabled: forOverlay });

  const wrapStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['6'],
    padding: `${spacing['6']}px ${spacing['10']}px ${spacing['6']}px ${spacing['4']}px`,
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    borderRadius: radius.pill,
    minHeight: 44,
    boxShadow: forOverlay ? '0 8px 24px rgba(0,0,0,0.18)' : '0 1px 2px rgba(0,0,0,0.04)',
    userSelect: 'none',
    opacity: drag.isDragging && !forOverlay ? 0.35 : 1,
    transform: forOverlay ? 'scale(1.03)' : undefined,
    width: variant === 'pool' ? '100%' : undefined,
    maxWidth: variant === 'pool' ? '100%' : 240,
  };

  const handleStyle: CSSProperties = {
    flexShrink: 0,
    width: 28,
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    touchAction: 'none',
    color: colors.textTertiary,
    borderRadius: radius.sm,
  };

  const nameStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const subStyle: CSSProperties = {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  };

  return (
    <div ref={forOverlay ? undefined : drag.setNodeRef} style={wrapStyle}>
      <span
        style={handleStyle}
        aria-label="Перетащить"
        {...(forOverlay ? {} : drag.listeners)}
        {...(forOverlay ? {} : drag.attributes)}
      >
        <GripIcon />
      </span>
      <Avatar src={photoUrl ?? null} name={name} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={nameStyle}>{name}</div>
        {subtitle ? <div style={subStyle}>{subtitle}</div> : null}
      </div>
    </div>
  );
}
