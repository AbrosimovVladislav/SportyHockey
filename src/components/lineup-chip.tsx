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

export function LineupChip({
  id,
  name,
  photoUrl,
  subtitle,
  variant = 'zone',
  forOverlay = false,
}: Props) {
  const drag = useDraggable({ id, disabled: forOverlay });

  const style: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['8'],
    padding: `${spacing['6']}px ${spacing['10']}px ${spacing['6']}px ${spacing['6']}px`,
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    borderRadius: radius.pill,
    minHeight: 44,
    boxShadow: forOverlay
      ? '0 8px 24px rgba(0,0,0,0.18)'
      : '0 1px 2px rgba(0,0,0,0.04)',
    cursor: 'grab',
    touchAction: 'none',
    userSelect: 'none',
    opacity: drag.isDragging && !forOverlay ? 0.35 : 1,
    transform: forOverlay ? 'scale(1.03)' : undefined,
    width: variant === 'pool' ? '100%' : undefined,
    maxWidth: variant === 'pool' ? '100%' : 220,
  };

  const nameStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
    minWidth: 0,
  };

  const subStyle: CSSProperties = {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  };

  return (
    <div
      ref={forOverlay ? undefined : drag.setNodeRef}
      {...(forOverlay ? {} : drag.listeners)}
      {...(forOverlay ? {} : drag.attributes)}
      style={style}
    >
      <Avatar src={photoUrl ?? null} name={name} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={nameStyle}>{name}</div>
        {subtitle ? <div style={subStyle}>{subtitle}</div> : null}
      </div>
    </div>
  );
}
