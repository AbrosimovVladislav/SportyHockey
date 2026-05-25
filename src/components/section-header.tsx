import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  title: string;
  subtitle?: string;
  variant?: 'default' | 'group';
};

export function SectionHeader({ title, subtitle, variant = 'default' }: Props) {
  const group = variant === 'group';
  const wrap: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: group
      ? `${spacing['16']}px ${spacing['20']}px ${spacing['8']}px`
      : `${spacing['20']}px ${spacing['20']}px ${spacing['12']}px`,
  };

  const titleStyle: CSSProperties = group
    ? {
        fontSize: 13,
        fontWeight: 700,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
      }
    : {
        fontSize: 14,
        fontWeight: 700,
        color: colors.text,
      };

  const subtitleStyle: CSSProperties = {
    fontSize: 14,
    color: colors.tabInactive,
  };

  return (
    <div style={wrap}>
      <span style={titleStyle}>{title}</span>
      {subtitle ? <span style={subtitleStyle}>{subtitle}</span> : null}
    </div>
  );
}
