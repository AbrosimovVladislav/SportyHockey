import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';

type Props = {
  icon: ReactNode;
  color: string;
  label: string;
  value: number | string;
};

export function StatChip({ icon, color, label, value }: Props) {
  const wrap: CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const iconCircle: CSSProperties = {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textInverse,
  };

  return (
    <div style={wrap}>
      <span style={iconCircle}>{icon}</span>
      <div>
        <div style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 500, lineHeight: 1.1 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: colors.text,
            lineHeight: 1.2,
            marginTop: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
