'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Props = {
  value: number | null;
  onChange: (seconds: number | null) => void;
  maxMinutes?: number;
  clearLabel: string;
};

const SECONDS_PER_MINUTE = 60;

// Простой пикер MM:SS на двух native <select>.
// На iOS/Android отрисовывается как wheel-picker, на десктопе — обычный dropdown.
export function TimePicker({ value, onChange, maxMinutes = 59, clearLabel }: Props) {
  const isSet = value != null;
  const m = isSet ? Math.min(Math.floor(value / SECONDS_PER_MINUTE), maxMinutes) : 0;
  const s = isSet ? value % SECONDS_PER_MINUTE : 0;

  const setM = (nextM: number) => {
    onChange(nextM * SECONDS_PER_MINUTE + s);
  };
  const setS = (nextS: number) => {
    onChange(m * SECONDS_PER_MINUTE + nextS);
  };

  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['8'],
  };

  const selectStyle: CSSProperties = {
    flex: 1,
    background: colors.bgMuted,
    border: '1.5px solid transparent',
    borderRadius: radius.md,
    padding: `${spacing['10']}px ${spacing['12']}px`,
    minHeight: 44,
    fontSize: 16,
    fontWeight: 500,
    color: isSet ? colors.text : colors.textTertiary,
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
  };

  const colon: CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: colors.textSecondary,
  };

  const clearBtn: CSSProperties = {
    minHeight: 44,
    padding: `0 ${spacing['12']}px`,
    background: 'transparent',
    border: `1.5px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  };

  return (
    <div style={wrap}>
      <select
        value={m}
        onChange={(e) => setM(Number(e.currentTarget.value))}
        style={selectStyle}
        aria-label="minutes"
      >
        {Array.from({ length: maxMinutes + 1 }, (_, i) => (
          <option key={i} value={i}>
            {i.toString().padStart(2, '0')}
          </option>
        ))}
      </select>
      <span style={colon} aria-hidden>:</span>
      <select
        value={s}
        onChange={(e) => setS(Number(e.currentTarget.value))}
        style={selectStyle}
        aria-label="seconds"
      >
        {Array.from({ length: 60 }, (_, i) => (
          <option key={i} value={i}>
            {i.toString().padStart(2, '0')}
          </option>
        ))}
      </select>
      {isSet ? (
        <button
          type="button"
          className="pressable"
          style={clearBtn}
          onClick={() => onChange(null)}
        >
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
}
