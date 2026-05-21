'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';

type Props = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  activeColor?: string;
  onClick?: () => void;
  ariaPressed?: boolean;
};

export function ActionTile({
  icon,
  label,
  active = false,
  activeColor = colors.primary,
  onClick,
  ariaPressed,
}: Props) {
  const bg = active ? activeColor : colors.bg;
  const fg = active ? colors.textInverse : colors.navInactive;
  const border = active ? activeColor : colors.border;

  const tile: CSSProperties = {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    background: bg,
    border: `1.5px solid ${border}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    cursor: onClick ? 'pointer' : 'default',
    flexShrink: 0,
    color: fg,
    transition: 'all .15s',
  };

  const labelStyle: CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed ?? active}
      className="pressable"
      style={tile}
    >
      {icon}
      <div style={labelStyle}>{label}</div>
    </button>
  );
}
