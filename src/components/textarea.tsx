'use client';

import type { CSSProperties, TextareaHTMLAttributes } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  fullWidth?: boolean;
  invalid?: boolean;
};

export function Textarea({ fullWidth = true, invalid, style, rows = 4, ...rest }: Props) {
  const base: CSSProperties = {
    ...typography.body,
    background: colors.bgMuted,
    color: colors.text,
    border: `1.5px solid ${invalid ? colors.error : 'transparent'}`,
    outline: 'none',
    padding: `${spacing['10']}px ${spacing['12']}px`,
    borderRadius: radius.md,
    width: fullWidth ? '100%' : undefined,
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 100ms ease',
    ...style,
  };

  return <textarea {...rest} rows={rows} style={base} />;
}
