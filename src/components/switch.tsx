'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
};

const TRACK_W = 51;
const TRACK_H = 31;
const KNOB = 27;

// iOS-стиль переключатель. Тач-таргет 44px по высоте за счёт паддинга обёртки.
export function Switch({ checked, onChange, ariaLabel, disabled }: Props) {
  const wrap: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    background: 'none',
    border: 'none',
    padding: `${(44 - TRACK_H) / 2}px 0`,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0,
  };

  const track: CSSProperties = {
    position: 'relative',
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    background: checked ? colors.primary : colors.switchOff,
    transition: 'background 0.18s ease',
  };

  const knob: CSSProperties = {
    position: 'absolute',
    top: (TRACK_H - KNOB) / 2,
    left: checked ? TRACK_W - KNOB - 2 : 2,
    width: KNOB,
    height: KNOB,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
    transition: 'left 0.18s ease',
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={wrap}
    >
      <span style={track}>
        <span style={knob} />
      </span>
    </button>
  );
}
