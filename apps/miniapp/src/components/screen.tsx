import type { CSSProperties, ReactNode } from 'react';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';

type Props = {
  title?: string;
  children?: ReactNode;
  paddingBottom?: number;
};

export function Screen({ title, children, paddingBottom = spacing.xxl }: Props) {
  const wrapper: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom,
    minHeight: '100dvh',
  };

  const heading: CSSProperties = {
    ...typography.title,
    color: colors.text,
  };

  return (
    <div style={wrapper}>
      {title ? <h1 style={heading}>{title}</h1> : null}
      {children}
    </div>
  );
}
