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
  completedLabel?: string;
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
  completedLabel,
  onClick,
}: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['12']}px ${spacing['12']}px`,
    background: completed ? colors.bgMuted : colors.bg,
    borderRadius: radius.lg,
    boxShadow: completed
      ? 'none'
      : '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: onClick ? 'pointer' : 'default',
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
    color: completed ? colors.textSecondary : colors.text,
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
    background: completed ? colors.bg : colors.bgMuted,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: completed ? colors.textSecondary : colors.text,
  };

  const titleCol: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  };
  const titleRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['6'],
    minWidth: 0,
  };
  const titleStyle: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: completed ? colors.textSecondary : colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  };
  const subtitleStyle: CSSProperties = {
    fontSize: 12,
    color: colors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  const completedPill: CSSProperties = {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    borderRadius: 4,
    background: colors.text,
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    lineHeight: 1.2,
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
    color: completed
      ? colors.textTertiary
      : count > 0
        ? colors.success
        : colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
  };

  const Icon: ReactNode =
    kind === 'game' ? (
      <IconStick size={20} color={completed ? colors.textSecondary : colors.text} />
    ) : (
      <IconWhistle size={20} color={completed ? colors.textSecondary : colors.text} />
    );

  return (
    <button type="button" className="pressable" onClick={onClick} style={wrap}>
      <div style={timeCol}>
        <span style={timeStart}>{startLabel}</span>
        {endLabel ? <span style={timeEnd}>– {endLabel}</span> : null}
      </div>
      <span style={iconWrap}>{Icon}</span>
      <div style={titleCol}>
        <div style={titleRow}>
          <span style={titleStyle}>{title}</span>
          {completed && completedLabel ? (
            <span style={completedPill}>{completedLabel}</span>
          ) : null}
        </div>
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
