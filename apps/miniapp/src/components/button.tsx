'use client';

import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

const variantStyles: Record<Variant, CSSProperties> = {
  primary: { background: colors.button, color: colors.buttonText },
  secondary: { background: colors.secondaryBg, color: colors.text },
  danger: { background: 'transparent', color: colors.destructive },
};

export function Button({
  variant = 'primary',
  fullWidth,
  style,
  className,
  ...rest
}: Props) {
  const base: CSSProperties = {
    ...typography.bodyBold,
    minHeight: 44,
    padding: `${spacing.sm}px ${spacing.lg}px`,
    borderRadius: radius.md,
    width: fullWidth ? '100%' : undefined,
    ...variantStyles[variant],
    ...style,
  };

  return (
    <button {...rest} className={['pressable', className].filter(Boolean).join(' ')} style={base} />
  );
}
