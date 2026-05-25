'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { IconBell } from './icons';

type Props = {
  ariaLabel: string;
  onClick?: () => void;
};

// Стеклянный колокольчик с индикатором — для тёмного хедера (DarkHeader).
export function BellWithDot({ ariaLabel, onClick }: Props) {
  const wrap: CSSProperties = {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.25)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onClick ? 'pointer' : 'default',
    padding: 0,
  };
  const dot: CSSProperties = {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    background: colors.success,
    border: `2px solid ${colors.headerBg}`,
  };
  return (
    <button type="button" style={wrap} aria-label={ariaLabel} onClick={onClick} className="pressable">
      <IconBell size={20} color={colors.textInverse} />
      <span style={dot} />
    </button>
  );
}
