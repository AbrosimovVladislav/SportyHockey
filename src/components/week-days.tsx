'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { isSameDay } from '@/lib/event-format';

type DayItem = {
  date: Date;
  shortLabel: string;
};

type Props = {
  days: DayItem[];
  selected: Date;
  onSelect: (date: Date) => void;
};

export function WeekDays({ days, selected, onSelect }: Props) {
  const wrap: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: spacing['4'],
    padding: `0 ${spacing['16']}px ${spacing['16']}px`,
  };

  return (
    <div style={wrap}>
      {days.map((d) => {
        const active = isSameDay(d.date, selected);
        const cell: CSSProperties = {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          padding: `${spacing['6']}px 0`,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
        };
        const label: CSSProperties = {
          fontSize: 11,
          fontWeight: 600,
          color: colors.textSecondary,
          letterSpacing: '0.04em',
        };
        const numberPill: CSSProperties = {
          width: 36,
          height: 36,
          borderRadius: radius.md,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 700,
          color: active ? colors.textInverse : colors.text,
          background: active ? colors.headerBg : 'transparent',
          fontVariantNumeric: 'tabular-nums',
        };
        return (
          <button
            key={d.date.toISOString()}
            type="button"
            className="pressable"
            onClick={() => onSelect(d.date)}
            style={cell}
            aria-pressed={active}
          >
            <span style={label}>{d.shortLabel}</span>
            <span style={numberPill}>{d.date.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}
