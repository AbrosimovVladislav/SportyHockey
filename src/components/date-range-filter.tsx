'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

type Props = {
  from: string | null;
  to: string | null;
  onChange: (next: { from: string | null; to: string | null }) => void;
  fromLabel: string;
  toLabel: string;
  resetLabel?: string;
};

// Фильтр по диапазону дат: два поля «От» и «До». Пустое поле = без ограничения
// с этой стороны. Поля рендерятся в одной карточке-строке.
export function DateRangeFilter({
  from,
  to,
  onChange,
  fromLabel,
  toLabel,
  resetLabel,
}: Props) {
  const card: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['8'],
    padding: `${spacing['10']}px ${spacing['12']}px`,
    background: colors.bg,
    borderRadius: radius.lg,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
  };

  const field: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };

  const label: CSSProperties = {
    ...typography.sm,
    color: colors.textSecondary,
  };

  const input: CSSProperties = {
    width: '100%',
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    padding: 0,
    fontSize: 15,
    fontWeight: 500,
    color: colors.text,
    fontFamily: 'inherit',
  };

  const reset: CSSProperties = {
    border: 'none',
    background: 'transparent',
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: spacing['4'],
  };

  const hasValue = Boolean(from || to);

  return (
    <div style={card}>
      <div style={field}>
        <span style={label}>{fromLabel}</span>
        <input
          type="date"
          value={from ?? ''}
          onChange={(e) => onChange({ from: e.target.value || null, to })}
          style={input}
        />
      </div>
      <div style={{ width: 1, height: 32, background: colors.divider }} aria-hidden />
      <div style={field}>
        <span style={label}>{toLabel}</span>
        <input
          type="date"
          value={to ?? ''}
          onChange={(e) => onChange({ from, to: e.target.value || null })}
          style={input}
        />
      </div>
      {hasValue && resetLabel ? (
        <button
          type="button"
          className="pressable"
          onClick={() => onChange({ from: null, to: null })}
          style={reset}
        >
          {resetLabel}
        </button>
      ) : null}
    </div>
  );
}
