'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Props = {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
  empty: boolean;
  emptyHint: string;
  accentColor?: string;
};

export function LineupZone({
  id,
  title,
  count,
  children,
  empty,
  emptyHint,
  accentColor,
}: Props) {
  const drop = useDroppable({ id });

  const baseBorder = accentColor ?? colors.line;
  const wrap: CSSProperties = {
    border: drop.isOver ? `2px dashed ${colors.headerAccent}` : `1px dashed ${baseBorder}`,
    background: drop.isOver ? 'rgba(232, 79, 0, 0.06)' : '#FAFAF8',
    borderRadius: radius.md,
    padding: spacing['8'],
    minHeight: 120,
    transition: 'background 120ms ease, border-color 120ms ease',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
    flex: 1,
    minWidth: 0,
  };

  const header: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  };

  const titleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: colors.text,
  };

  const countStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
  };

  const emptyStyle: CSSProperties = {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    padding: `${spacing['12']}px 0`,
  };

  const listStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['6'],
  };

  return (
    <div ref={drop.setNodeRef} style={wrap}>
      <div style={header}>
        <span style={titleStyle}>{title}</span>
        <span style={countStyle}>{count}</span>
      </div>
      {empty ? (
        <div style={emptyStyle}>{emptyHint}</div>
      ) : (
        <div style={listStyle}>{children}</div>
      )}
    </div>
  );
}
