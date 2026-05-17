import type { CSSProperties, ReactNode } from 'react';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';

type Props = {
  title?: string;
  children?: ReactNode;
  paddingBottom?: number;
  padding?: number;
  background?: string;
};

export function Screen({
  title,
  children,
  paddingBottom = spacing['32'],
  padding = spacing['20'],
  background = colors.bg,
}: Props) {
  const wrapper: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
    padding,
    paddingBottom,
    minHeight: '100dvh',
    background,
    color: colors.text,
  };

  const heading: CSSProperties = {
    ...typography.h1,
    color: colors.text,
  };

  return (
    <div style={wrapper}>
      {title ? <h1 style={heading}>{title}</h1> : null}
      {children}
    </div>
  );
}
