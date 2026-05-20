'use client';

import type { CSSProperties } from 'react';
import { IconChevronDown, IconChevronLeft, IconChevronRight } from './icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  prevAriaLabel: string;
  nextAriaLabel: string;
};

export function WeekPicker({ label, onPrev, onNext, prevAriaLabel, nextAriaLabel }: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing['8'],
    padding: `${spacing['12']}px ${spacing['16']}px ${spacing['8']}px`,
  };

  const arrowBtn: CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 16,
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
      <span style={center}>
        {label}
        <IconChevronDown size={14} color={colors.textSecondary} />
      </span>
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
