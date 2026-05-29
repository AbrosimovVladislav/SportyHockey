'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// Заголовок секции на вкладках настроек («Команда», «Игроки» и т.п.).
// Жирный, чуть крупнее обычного текста; отступ снизу совпадает с gap
// между секциями в макете.
export function SectionHeader({ children }: { children: string }) {
  const style: CSSProperties = {
    fontSize: 17,
    fontWeight: 800,
    color: colors.text,
    margin: 0,
    marginBottom: spacing['12'],
    letterSpacing: '-0.2px',
  };
  return <h2 style={style}>{children}</h2>;
}
