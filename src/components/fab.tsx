'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { IconPlus } from './icons';

type Variant = 'dark' | 'primary';

type Props = {
  onClick?: () => void;
  variant?: Variant;
  ariaLabel: string;
  children?: ReactNode;
  bottom?: number;
  right?: number;
};

const variantBg: Record<Variant, string> = {
  dark: colors.headerBg,
  primary: colors.primary,
};

export function FAB({ onClick, variant = 'dark', ariaLabel, children, bottom = 78, right = 18 }: Props) {
  const base: CSSProperties = {
    position: 'fixed',
    bottom,
    right,
    width: 56,
    height: 56,
    borderRadius: 28,
    background: variantBg[variant],
    color: colors.textInverse,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
    cursor: 'pointer',
    zIndex: 5,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="pressable"
      style={base}
    >
      {children ?? <IconPlus size={22} color={colors.textInverse} />}
    </button>
  );
}
