'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { IconChevronRight } from './icons';

type Props = {
  icon?: ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
};

export function ListRow({
  icon,
  iconBg = colors.iconBg,
  title,
  subtitle,
  right,
  onClick,
  showChevron = true,
}: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['16']}px ${spacing['16']}px`,
    background: colors.bg,
    borderRadius: radius.lg,
    border: 'none',
    width: '100%',
    cursor: onClick ? 'pointer' : 'default',
    textAlign: 'left',
    color: colors.text,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
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

  const titleStyle: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
    lineHeight: 1.25,
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: colors.textSecondary,
    marginTop: 2,
  };

  const content = (
    <>
      {icon ? <div style={iconBox}>{icon}</div> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={titleStyle}>{title}</div>
        {subtitle ? <div style={subtitleStyle}>{subtitle}</div> : null}
      </div>
      {right ? right : showChevron && onClick ? <IconChevronRight /> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="pressable" style={wrap}>
        {content}
      </button>
    );
  }
  return <div style={wrap}>{content}</div>;
}
