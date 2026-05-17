'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Option = { id: string; label: string };

type Props = {
  options: Option[];
  activeId: string;
  onChange?: (id: string) => void;
};

export function FilterChips({ options, activeId, onChange }: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    gap: spacing['8'],
    padding: `${spacing['16']}px ${spacing['16']}px ${spacing['4']}px`,
    justifyContent: 'center',
    flexWrap: 'wrap',
  };

  return (
    <div style={wrap}>
      {options.map((o) => {
        const active = o.id === activeId;
        const chipStyle: CSSProperties = {
          padding: `${spacing['8']}px ${spacing['16']}px`,
          borderRadius: radius.xl,
          fontSize: 15,
          fontWeight: 500,
          lineHeight: '20px',
          whiteSpace: 'nowrap',
          background: active ? colors.headerBg : colors.bg,
          color: active ? colors.textInverse : colors.text,
          border: active ? 'none' : `1.5px solid ${colors.chipBorder}`,
          cursor: 'pointer',
        };
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange?.(o.id)}
            className="pressable"
            style={chipStyle}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
