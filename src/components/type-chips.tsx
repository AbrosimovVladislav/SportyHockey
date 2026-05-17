'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export type TypeChipOption = {
  id: string;
  label: string;
  icon: (color: string) => ReactNode;
};

type Props = {
  options: TypeChipOption[];
  activeId: string;
  onChange: (id: string) => void;
};

export function TypeChips({ options, activeId, onChange }: Props) {
  const wrap: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${options.length}, 1fr)`,
    gap: spacing['8'],
    background: colors.bgMuted,
    padding: spacing['4'],
    borderRadius: radius.lg,
  };

  return (
    <div style={wrap}>
      {options.map((o) => {
        const active = o.id === activeId;
        const chip: CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing['8'],
          padding: `${spacing['12']}px ${spacing['12']}px`,
          borderRadius: radius.md,
          border: 'none',
          fontSize: 15,
          fontWeight: 600,
          background: active ? colors.headerBg : 'transparent',
          color: active ? colors.textInverse : colors.text,
          cursor: 'pointer',
        };
        const iconColor = active ? colors.textInverse : colors.text;
        return (
          <button
            key={o.id}
            type="button"
            className="pressable"
            onClick={() => onChange(o.id)}
            style={chip}
          >
            {o.icon(iconColor)}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
