'use client';

import type { CSSProperties, ReactNode } from 'react';
import { IconChevronRight } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

// Горизонтальная плитка quick-action для главной (v0.6, итерация 63, передизайн
// от 2026-06-08). Визуальный язык — как у `QuickActionTile` на /money
// (круглая зелёная иконка с подложкой `successBg`/`successDark`), но
// разложено горизонтально: круг слева, лейбл по центру, chevron справа.
//
// Если `onClick` не передан — плитка disabled (приглушена, не реагирует).
// `badge` — счётчик (например, кол-во pending-заявок) в правом верхнем углу.

type Props = {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  badge?: number | null;
};

export function HomeActionTile({ icon, label, onClick, badge }: Props) {
  const disabled = !onClick;

  const tile: CSSProperties = {
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    borderRadius: radius.lg,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02)',
    padding: `${spacing['16']}px ${spacing['12']}px ${spacing['16']}px ${spacing['16']}px`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    width: '100%',
    minHeight: 76,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    textAlign: 'left',
    color: colors.text,
    position: 'relative',
  };

  const iconCircle: CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: colors.successBg,
    color: colors.successDark,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const labelStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.25,
    color: colors.text,
    flex: 1,
    minWidth: 0,
  };

  const badgeStyle: CSSProperties = {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 20,
    height: 20,
    padding: '0 6px',
    borderRadius: 10,
    background: colors.error,
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  };

  return (
    <button
      type="button"
      className={disabled ? undefined : 'pressable'}
      onClick={onClick}
      disabled={disabled}
      style={tile}
    >
      <span style={iconCircle} aria-hidden>
        {icon}
      </span>
      <span style={labelStyle}>{label}</span>
      <span aria-hidden style={{ flexShrink: 0 }}>
        <IconChevronRight size={14} color={colors.iconMuted} />
      </span>
      {badge != null ? <span style={badgeStyle}>{badge}</span> : null}
    </button>
  );
}
