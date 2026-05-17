'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';

type Props = {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  size?: number;
  background?: string;
};

export function RoundIconButton({
  children,
  onClick,
  ariaLabel,
  size = 48,
  background = colors.bg,
}: Props) {
  const base: CSSProperties = {
    width: size,
    height: size,
    borderRadius: size / 2,
    background,
    color: colors.text,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: onClick ? 'pointer' : 'default',
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    flexShrink: 0,
  };

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className="pressable" style={base}>
      {children}
    </button>
  );
}
