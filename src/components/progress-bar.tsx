import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';

type Props = {
  value: number;
  total: number;
  height?: number;
  color?: string;
};

export function ProgressBar({ value, total, height = 5, color = colors.headerAccent }: Props) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
  const track: CSSProperties = {
    width: '100%',
    height,
    background: colors.bgMuted,
    borderRadius: height,
    overflow: 'hidden',
  };
  const fill: CSSProperties = {
    width: `${pct}%`,
    height: '100%',
    background: color,
    borderRadius: height,
    transition: 'width 200ms ease',
  };
  return (
    <div style={track} role="progressbar" aria-valuenow={value} aria-valuemax={total}>
      <div style={fill} />
    </div>
  );
}
