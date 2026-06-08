'use client';

import type { CSSProperties } from 'react';
import { Skeleton } from '@/components/skeleton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

// Скелетон карточки `NextEventInfoCard` в белом sheet, чтобы layout не
// прыгал при первой загрузке. Высота близка к реальной (~150px).
export function NextEventInfoSkeleton() {
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['20'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };
  const row: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: spacing['8'],
  };
  return (
    <div style={card}>
      <div style={row}>
        <Skeleton height={64} borderRadius={8} />
        <Skeleton height={64} borderRadius={8} />
        <Skeleton height={64} borderRadius={8} />
      </div>
      <Skeleton height={52} borderRadius={12} />
    </div>
  );
}
