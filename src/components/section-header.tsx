import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  title: string;
  subtitle?: string;
};

export function SectionHeader({ title, subtitle }: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: `${spacing['20']}px ${spacing['20']}px ${spacing['12']}px`,
  };

  const titleStyle: CSSProperties = {
    fontSize: 20,
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
