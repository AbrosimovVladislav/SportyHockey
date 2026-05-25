'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

// Общие стили и шапка карточек профиля (Обзор / Финансы / Статистика).
export const cardTitle: CSSProperties = {
  ...typography.smBold,
  color: colors.textSecondary,
};

export const bigValue: CSSProperties = {
  ...typography.statLg,
  color: colors.text,
};

export const caption: CSSProperties = {
  ...typography.sm,
  color: colors.textSecondary,
};

export function RoundIcon({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: colors.iconBg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

export function CardHead({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <span style={cardTitle}>{title}</span>
      <RoundIcon>{icon}</RoundIcon>
    </div>
  );
}

// Ряд показателей с крупным числом и подписью, разделённый вертикальными линиями.
export function StatCells({ cells }: { cells: { label: string; value: number }[] }) {
  return (
    <div style={{ display: 'flex' }}>
      {cells.map((c, i) => (
        <div
          key={c.label}
          style={{
            flex: 1,
            minWidth: 0,
            paddingLeft: i > 0 ? spacing['12'] : 0,
            borderLeft: i > 0 ? `1px solid ${colors.divider}` : 'none',
          }}
        >
          <div style={{ ...typography.stat, color: colors.text }}>{c.value}</div>
          <div style={{ ...caption, marginTop: spacing['2'] }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}
