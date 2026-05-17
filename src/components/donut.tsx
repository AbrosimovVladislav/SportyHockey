import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';

type Props = {
  percent: number;
  size?: number;
  stroke?: number;
  trackColor?: string;
  fillColor?: string;
};

export function Donut({
  percent,
  size = 110,
  stroke = 9,
  trackColor = '#EFEDE7',
  fillColor = colors.primary,
}: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (clamped / 100);

  const wrapper: CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    flexShrink: 0,
  };

  const label: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: Math.round(size * 0.2),
    fontWeight: 800,
    color: fillColor,
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div style={wrapper}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={fillColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
        />
      </svg>
      <div style={label}>{clamped}%</div>
    </div>
  );
}
