'use client';

import type { CSSProperties, ReactNode } from 'react';
import { IconChevronRight, IconStick, IconWhistle } from './icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Props = {
  kind: 'training' | 'game';
  startLabel: string;
  endLabel?: string;
  title: string;
  subtitle?: string;
  count: number;
  total: number;
  completed?: boolean;
  onClick?: () => void;
};

export function DayEventRow({
  kind,
  startLabel,
  endLabel,
  title,
  subtitle,
  count,
  total,
  completed = false,
  onClick,
}: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['12']}px ${spacing['12']}px`,
    background: colors.bg,
    borderRadius: radius.lg,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: onClick ? 'pointer' : 'default',
    opacity: completed ? 0.75 : 1,
  };

  const timeCol: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 56,
    alignItems: 'flex-start',
    flexShrink: 0,
    lineHeight: 1.2,
    fontVariantNumeric: 'tabular-nums',
  };

  const timeStart: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
  };
  const timeEnd: CSSProperties = {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  };

  const iconWrap: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: colors.bgMuted,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: colors.text,
  };

  const titleCol: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };
  const titleStyle: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  const subtitleStyle: CSSProperties = {
    fontSize: 12,
    color: colors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const right: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing['6'],
    flexShrink: 0,
  };
  const countStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: count > 0 ? colors.success : colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
  };

  const Icon: ReactNode =
    kind === 'game' ? <IconStick size={20} color={colors.text} /> : <IconWhistle size={20} color={colors.text} />;

  return (
    <button type="button" className="pressable" onClick={onClick} style={wrap}>
      <div style={timeCol}>
        <span style={timeStart}>{startLabel}</span>
        {endLabel ? <span style={timeEnd}>– {endLabel}</span> : null}
      </div>
      <span style={iconWrap}>{Icon}</span>
      <div style={titleCol}>
        <span style={titleStyle}>{title}</span>
        {subtitle ? <span style={subtitleStyle}>{subtitle}</span> : null}
      </div>
      <span style={right}>
        <span style={countStyle}>
          {count} / {total}
        </span>
        <IconChevronRight size={14} color={colors.textTertiary} />
      </span>
    </button>
  );
}
