import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Props = {
  children?: ReactNode;
  padding?: number;
  onClick?: () => void;
};

export function Card({ children, padding = spacing.lg, onClick }: Props) {
  const base: CSSProperties = {
    background: colors.secondaryBg,
    borderRadius: radius.lg,
    padding,
    color: colors.text,
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="pressable"
        style={{ ...base, display: 'block', textAlign: 'left', width: '100%' }}
      >
        {children}
      </button>
    );
  }

  return <div style={base}>{children}</div>;
}
