'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Option = { id: string; label: string; count?: number };

type Props = {
  options: Option[];
  activeId: string;
  onChange?: (id: string) => void;
};

export function FilterChips({ options, activeId, onChange }: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    gap: spacing['8'],
    padding: `${spacing['20']}px ${spacing['16']}px ${spacing['2']}px`,
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
          fontSize: 14,
          fontWeight: active ? 600 : 500,
          lineHeight: '20px',
          whiteSpace: 'nowrap',
          background: active ? colors.headerBg : colors.cardSchedule,
          color: active ? colors.textInverse : colors.text,
          border: 'none',
          cursor: 'pointer',
        };
        const countStyle: CSSProperties = {
          marginLeft: spacing['6'],
          fontWeight: 700,
          color: active ? colors.textInverse : colors.textSecondary,
          opacity: active ? 0.75 : 1,
          fontVariantNumeric: 'tabular-nums',
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
            {o.count != null ? <span style={countStyle}>{o.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
