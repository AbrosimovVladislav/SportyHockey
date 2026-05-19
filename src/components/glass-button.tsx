'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';

type Props = {
  children: ReactNode;
  onClick?: () => void;
  size?: number;
  ariaLabel?: string;
};

export function GlassButton({ children, onClick, size = 48, ariaLabel }: Props) {
  const base: CSSProperties = {
    width: size,
    height: size,
    borderRadius: size / 2,
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: colors.textInverse,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.25)',
    cursor: onClick ? 'pointer' : 'default',
    flexShrink: 0,
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="pressable"
        style={base}
      >
        {children}
      </button>
    );
  }

  return (
    <span aria-label={ariaLabel} style={base}>
      {children}
    </span>
  );
}
