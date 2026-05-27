'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

export type TeamStatCell = { icon: ReactNode; value: number; label: string };

// Карточка-сводка по команде: ряд ячеек «иконка + число + подпись»,
// разделённых вертикальными линиями. Презентационный компонент —
// иконки и значения передаёт вызывающий экран.
export function TeamStatCells({ cells }: { cells: TeamStatCell[] }) {
  const card: CSSProperties = {
    display: 'flex',
    background: colors.bg,
    borderRadius: radius.lg,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    padding: `${spacing['16']}px ${spacing['8']}px`,
  };

  return (
    <div style={card}>
      {cells.map((c, i) => (
        <div
          key={c.label}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: spacing['4'],
            borderLeft: i > 0 ? `1px solid ${colors.divider}` : 'none',
          }}
        >
          <span style={{ color: colors.iconFg, display: 'inline-flex' }}>{c.icon}</span>
          <span style={{ ...typography.stat, color: colors.text }}>{c.value}</span>
          <span style={{ ...typography.sm, color: colors.textSecondary }}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}
