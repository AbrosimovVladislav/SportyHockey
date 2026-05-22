import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Tone = 'success' | 'muted' | 'danger';

type Props = {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
};

const toneBg: Record<Tone, string> = {
  success: colors.headerAccent,
  muted: 'rgba(0,0,0,0.45)',
  danger: colors.error,
};

export function EventHeaderBadge({ tone = 'success', icon, children }: Props) {
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing['6'],
    background: toneBg[tone],
    color: colors.textInverse,
    padding: `${spacing['4']}px ${spacing['10']}px ${spacing['4']}px ${spacing['8']}px`,
    borderRadius: radius.pill,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: '18px',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  };
  return (
    <span style={style}>
      {icon ? <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span> : null}
      {children}
    </span>
  );
}
