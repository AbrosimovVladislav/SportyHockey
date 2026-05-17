import type { CSSProperties, ReactNode } from 'react';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { BOTTOM_NAV_HEIGHT } from './bottom-nav';

type Props = {
  title?: string;
  children?: ReactNode;
  paddingBottom?: number;
  padding?: number;
  background?: string;
  withTabBar?: boolean;
};

export function Screen({
  title,
  children,
  paddingBottom,
  padding = spacing['20'],
  background = colors.bg,
  withTabBar = true,
}: Props) {
  const resolvedBottom =
    paddingBottom ?? spacing['32'] + (withTabBar ? BOTTOM_NAV_HEIGHT : 0);
  const wrapper: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
    padding,
    paddingBottom: resolvedBottom,
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
