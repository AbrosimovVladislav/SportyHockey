'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';

type Props = {
  size?: number;
  stroke?: number;
  value: number;
  total: number;
  label?: string;
};

export function RingProgress({ size = 110, stroke = 9, value, total, label }: Props) {
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  const offset = c * (1 - ratio);
  const percent = label ?? `${Math.round(ratio * 100)}%`;

  const wrap: CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    flexShrink: 0,
  };
  const text: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: Math.round(size * 0.2),
    fontWeight: 800,
    color: colors.headerAccent,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.3px',
  };

  return (
    <div style={wrap} aria-label={`${percent} собрано`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#EFEDE7"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.headerAccent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={text}>{percent}</div>
    </div>
  );
}
