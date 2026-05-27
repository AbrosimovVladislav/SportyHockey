'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

// Пункт меню в нижнем листе (шестерёнка/«ещё»): иконка в плитке + подпись.
// tone='danger' — красный для деструктивных действий (отмена события и т.п.).
export function MenuButton({
  icon,
  label,
  onClick,
  tone = 'neutral',
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'neutral' | 'danger';
}) {
  const isDanger = tone === 'danger';
  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['12']}px ${spacing['4']}px`,
    width: '100%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    color: isDanger ? colors.error : colors.text,
    borderRadius: radius.md,
    fontSize: 16,
    fontWeight: 500,
  };
  const iconBox: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    background: isDanger ? 'rgba(211,47,47,0.10)' : colors.bgMuted,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  return (
    <button type="button" className="pressable" onClick={onClick} style={row}>
      <span style={iconBox}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
    </button>
  );
}
