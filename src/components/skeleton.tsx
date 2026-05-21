import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  style?: CSSProperties;
};

export function Skeleton({ width, height = 14, borderRadius = 6, style }: SkeletonProps) {
  const css: CSSProperties = {
    width: width ?? '100%',
    height,
    borderRadius,
    ...style,
  };
  return <span className="skeleton" style={css} aria-hidden />;
}

export function EventCardSkeleton() {
  const wrap: CSSProperties = {
    background: colors.surface,
    borderRadius: radius.lg,
    padding: spacing['16'],
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    border: `1px solid ${colors.divider}`,
  };
  const left: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
    minWidth: 0,
  };
  return (
    <div style={wrap} aria-hidden>
      <div style={left}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
      </div>
      <Skeleton width={48} height={48} borderRadius="50%" />
    </div>
  );
}

export function RowSkeleton() {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['12']}px 0`,
  };
  return (
    <div style={wrap} aria-hidden>
      <Skeleton width={40} height={40} borderRadius="50%" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing['6'] }}>
        <Skeleton width="50%" height={14} />
        <Skeleton width="30%" height={12} />
      </div>
    </div>
  );
}

export function StatRowSkeleton() {
  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };
  return (
    <div style={wrap} aria-hidden>
      <Skeleton width="100%" height={110} borderRadius={radius.lg} />
      <Skeleton width="100%" height={60} borderRadius={radius.lg} />
      <Skeleton width="100%" height={60} borderRadius={radius.lg} />
      <Skeleton width="100%" height={60} borderRadius={radius.lg} />
    </div>
  );
}
