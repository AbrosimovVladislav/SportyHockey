'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';

// Скелетон карточки ближайшего события — простая тёмная подложка с тем же
// `minHeight`, что и `NextEventCard`, чтобы layout не «прыгал» при загрузке.
export function NextEventSkeleton() {
  const card: CSSProperties = {
    borderRadius: radius.lg,
    background: colors.headerBg,
    opacity: 0.7,
    minHeight: 220,
  };
  return <div aria-hidden style={card} />;
}
