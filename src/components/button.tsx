'use client';

import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const variantStyles: Record<Variant, CSSProperties> = {
  primary: { background: colors.primary, color: colors.textInverse },
  secondary: {
    background: colors.bg,
    color: colors.text,
    border: `1.5px solid ${colors.border}`,
  },
  ghost: { background: 'transparent', color: colors.primary },
  danger: { background: colors.error, color: colors.textInverse },
};

const sizeStyles: Record<Size, CSSProperties> = {
  md: {
    minHeight: 44,
    padding: `${spacing['10']}px ${spacing['16']}px`,
    borderRadius: radius.md,
    fontSize: typography.bodyBold.fontSize,
  },
  lg: {
    minHeight: 52,
    padding: `${spacing['12']}px ${spacing['20']}px`,
    borderRadius: radius.lg,
    fontSize: 16,
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  style,
  className,
  ...rest
}: Props) {
  const base: CSSProperties = {
    fontWeight: 600,
    lineHeight: 1.2,
    width: fullWidth ? '100%' : undefined,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['8'],
    transition: 'opacity 100ms ease, transform 100ms ease',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  if (rest.disabled) {
    base.opacity = 0.5;
    base.cursor = 'not-allowed';
  }

  return (
    <button
      {...rest}
      className={['pressable', className].filter(Boolean).join(' ')}
      style={base}
    />
  );
}
