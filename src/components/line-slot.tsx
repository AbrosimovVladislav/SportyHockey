'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Props = {
  id: string;
  roleLabel: string;
  filled: boolean;
  children?: ReactNode;
};

export function LineSlot({ id, roleLabel, filled, children }: Props) {
  const drop = useDroppable({ id });

  const baseBorder = filled ? colors.line : colors.borderSoft;
  const wrap: CSSProperties = {
    flex: 1,
    minWidth: 0,
    minHeight: 102,
    borderRadius: radius.md,
    border: drop.isOver
      ? `2px dashed ${colors.headerAccent}`
      : filled
        ? 'none'
        : `1px dashed ${baseBorder}`,
    background: drop.isOver
      ? colors.primaryDrop
      : filled
        ? 'transparent'
        : colors.bgOffWhite,
    padding: filled ? 0 : spacing['6'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 120ms ease, border-color 120ms ease',
  };

  const empty: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  };

  return (
    <div ref={drop.setNodeRef} style={wrap}>
      {filled ? children : <span style={empty}>{roleLabel}</span>}
    </div>
  );
}
