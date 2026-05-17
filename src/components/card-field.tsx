'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { IconChevronRight } from './icons';

type Props = {
  icon: ReactNode;
  iconBg?: string;
  label: string;
  value?: ReactNode;
  placeholder?: string;
  right?: ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  children?: ReactNode;
};

export function CardField({
  icon,
  iconBg = colors.iconBg,
  label,
  value,
  placeholder,
  right,
  showChevron = true,
  onClick,
  children,
}: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: spacing['16'],
    background: colors.bg,
    borderRadius: radius.lg,
    border: 'none',
    width: '100%',
    cursor: onClick ? 'pointer' : 'default',
    textAlign: 'left',
    color: colors.text,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    position: 'relative',
  };

  const iconBox: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    background: iconBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const labelStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    lineHeight: 1.2,
  };

  const valueStyle: CSSProperties = {
    fontSize: 17,
    fontWeight: 700,
    color: colors.text,
    lineHeight: 1.2,
    marginTop: 2,
  };

  const placeholderStyle: CSSProperties = {
    ...valueStyle,
    color: colors.textTertiary,
    fontWeight: 500,
  };

  const inner = (
    <>
      <div style={iconBox}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={labelStyle}>{label}</div>
        {value !== undefined && value !== null && value !== '' ? (
          <div style={valueStyle}>{value}</div>
        ) : placeholder ? (
          <div style={placeholderStyle}>{placeholder}</div>
        ) : null}
        {children}
      </div>
      {right ? right : showChevron && onClick ? <IconChevronRight /> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="pressable" onClick={onClick} style={wrap}>
        {inner}
      </button>
    );
  }
  return <div style={wrap}>{inner}</div>;
}
