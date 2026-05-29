'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

type Props = {
  icon: ReactNode;
  title: string;
  value: number | string;
  caption: string;
};

// Карточка-метрика команды в верхней сетке экрана /squad/stats:
// иконка слева сверху, заголовок справа от неё, ниже крупное значение
// и подпись-капшен. Используется в режимах «Игры» (4 карточки 2×2)
// и «Тренировки» (3 карточки в один ряд).
export function StatSummaryCard({ icon, title, value, caption }: Props) {
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: `${spacing['16']}px ${spacing['16']}px`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
    minHeight: 116,
  };

  const head: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
  };

  const iconBox: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    background: colors.primaryLight,
    color: colors.primary,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const titleStyle: CSSProperties = {
    ...typography.smBold,
    color: colors.textSecondary,
  };

  const valueStyle: CSSProperties = {
    ...typography.statLg,
    color: colors.text,
  };

  const captionStyle: CSSProperties = {
    ...typography.sm,
    color: colors.textSecondary,
  };

  return (
    <div style={card}>
      <div style={head}>
        <span style={iconBox}>{icon}</span>
        <span style={titleStyle}>{title}</span>
      </div>
      <span style={valueStyle}>{value}</span>
      <span style={captionStyle}>{caption}</span>
    </div>
  );
}
