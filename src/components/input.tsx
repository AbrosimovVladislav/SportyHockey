'use client';

import type { CSSProperties, InputHTMLAttributes } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  fullWidth?: boolean;
  invalid?: boolean;
};

export function Input({ fullWidth = true, invalid, style, ...rest }: Props) {
  const base: CSSProperties = {
    ...typography.body,
    background: colors.bgMuted,
    color: colors.text,
    border: `1.5px solid ${invalid ? colors.error : 'transparent'}`,
    outline: 'none',
    minHeight: 44,
    padding: `${spacing['10']}px ${spacing['12']}px`,
    borderRadius: radius.md,
    width: fullWidth ? '100%' : undefined,
    transition: 'border-color 100ms ease',
    ...style,
  };

  return <input {...rest} style={base} />;
}
