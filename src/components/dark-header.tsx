import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  title: string;
  role?: string;
  left?: ReactNode;
  right?: ReactNode;
  paddingTop?: number;
};

export function DarkHeader({ title, role, left, right, paddingTop = spacing['16'] }: Props) {
  const wrapper: CSSProperties = {
    background: colors.headerBg,
    color: colors.textInverse,
    paddingTop,
    paddingBottom: spacing['24'],
    paddingLeft: spacing['20'],
    paddingRight: spacing['20'],
  };

  const topRow: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: left || right ? spacing['16'] : 0,
    minHeight: 48,
  };

  const roleStyle: CSSProperties = {
    fontSize: 14,
    color: colors.headerMuted,
    marginBottom: spacing['4'],
    letterSpacing: 0.1,
  };

  const titleStyle: CSSProperties = {
    fontSize: 32,
    fontWeight: 800,
    color: colors.textInverse,
    letterSpacing: '-0.02em',
    lineHeight: 1.15,
  };

  return (
    <div style={wrapper}>
      {(left || right) && (
        <div style={topRow}>
          <div>{left}</div>
          <div>{right}</div>
        </div>
      )}
      {role ? <div style={roleStyle}>{role}</div> : null}
      <div style={titleStyle}>{title}</div>
    </div>
  );
}
