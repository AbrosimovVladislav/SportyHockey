'use client';

import type { CSSProperties, InputHTMLAttributes } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  fullWidth?: boolean;
};

export function Input({ fullWidth = true, style, ...rest }: Props) {
  const base: CSSProperties = {
    ...typography.body,
    background: colors.secondaryBg,
    color: colors.text,
    border: 'none',
    outline: 'none',
    minHeight: 44,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radius.md,
    width: fullWidth ? '100%' : undefined,
    ...style,
  };

  return <input {...rest} style={base} />;
}
