'use client';

import type { CSSProperties } from 'react';
import { IconChevronDown, IconChevronLeft, IconChevronRight } from './icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onLabelClick?: () => void;
  prevAriaLabel: string;
  nextAriaLabel: string;
  labelAriaLabel?: string;
};

export function WeekPicker({
  label,
  onPrev,
  onNext,
  onLabelClick,
  prevAriaLabel,
  nextAriaLabel,
  labelAriaLabel,
}: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing['8'],
    padding: `${spacing['12']}px ${spacing['16']}px ${spacing['8']}px`,
  };

  const arrowBtn: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'transparent',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    color: colors.text,
  };

  const center: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing['6'],
    fontSize: 17,
    fontWeight: 700,
    color: colors.text,
    lineHeight: 1.2,
    background: 'transparent',
    border: 'none',
    padding: `${spacing['4']}px ${spacing['8']}px`,
    cursor: onLabelClick ? 'pointer' : 'default',
  };

  return (
    <div style={wrap}>
      <button
        type="button"
        className="pressable"
        onClick={onPrev}
        aria-label={prevAriaLabel}
        style={arrowBtn}
      >
        <IconChevronLeft size={20} color={colors.text} />
      </button>
      <button
        type="button"
        className="pressable"
        onClick={onLabelClick}
        disabled={!onLabelClick}
        aria-label={labelAriaLabel}
        style={center}
      >
        {label}
        <IconChevronDown size={14} color={colors.textSecondary} />
      </button>
      <button
        type="button"
        className="pressable"
        onClick={onNext}
        aria-label={nextAriaLabel}
        style={arrowBtn}
      >
        <IconChevronRight size={20} color={colors.text} />
      </button>
    </div>
  );
}
