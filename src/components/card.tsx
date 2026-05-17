import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Variant = 'surface' | 'warm' | 'schedule';

type Props = {
  children?: ReactNode;
  padding?: number;
  variant?: Variant;
  onClick?: () => void;
};

const variantBg: Record<Variant, string> = {
  surface: colors.bg,
  warm: colors.bgWarm,
  schedule: colors.cardSchedule,
};

const SHADOW_CARD = '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)';

export function Card({ children, padding = spacing['16'], variant = 'surface', onClick }: Props) {
  const base: CSSProperties = {
    background: variantBg[variant],
    borderRadius: radius.lg,
    padding,
    color: colors.text,
    boxShadow: variant === 'surface' ? SHADOW_CARD : undefined,
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="pressable"
        style={{ ...base, display: 'block', textAlign: 'left', width: '100%', border: 'none' }}
      >
        {children}
      </button>
    );
  }

  return <div style={base}>{children}</div>;
}
