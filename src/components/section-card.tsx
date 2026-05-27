import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export function SectionCard({ children, padding }: { children: ReactNode; padding?: number }) {
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: padding ?? spacing['16'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
  };
  return <div style={card}>{children}</div>;
}
