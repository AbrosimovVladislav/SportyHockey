import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  title: string;
  role?: string;
  subtitle?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  paddingTop?: number;
  imageSrc?: string;
};

export function DarkHeader({ title, role, subtitle, left, right, paddingTop = spacing['12'], imageSrc }: Props) {
  const wrapper: CSSProperties = {
    background: imageSrc
      ? `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.55) 100%), url(${imageSrc}) center/cover no-repeat`
      : colors.headerBg,
    color: colors.textInverse,
    paddingTop,
    paddingBottom: imageSrc ? spacing['32'] : spacing['20'],
    paddingLeft: spacing['20'],
    paddingRight: spacing['20'],
    minHeight: imageSrc ? 234 : undefined,
    display: 'flex',
    flexDirection: 'column',
  };

  const topRow: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: left || right ? spacing['12'] : 0,
    minHeight: 40,
  };

  const roleStyle: CSSProperties = {
    fontSize: 13,
    color: colors.headerMuted,
    marginBottom: spacing['4'],
    letterSpacing: 0.1,
  };

  const titleStyle: CSSProperties = {
    fontSize: 28,
    fontWeight: 800,
    color: colors.textInverse,
    letterSpacing: '-0.02em',
    lineHeight: 1.15,
  };

  const titleGroupStyle: CSSProperties = {
    marginTop: 'auto',
  };

  return (
    <div style={wrapper}>
      {(left || right) && (
        <div style={topRow}>
          <div>{left}</div>
          <div>{right}</div>
        </div>
      )}
      <div style={titleGroupStyle}>
        {role ? <div style={roleStyle}>{role}</div> : null}
        <div style={titleStyle}>{title}</div>
        {subtitle ? <div style={{ marginTop: spacing['4'] }}>{subtitle}</div> : null}
      </div>
    </div>
  );
}
