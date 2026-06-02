'use client';

import { type CSSProperties } from 'react';
import { IconChevronLeft, IconChevronRight } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

// Месячный период-пикер для `/money/report`. Состояние — `{ year, month }`,
// где month 1..12. Период берётся из этого как [from = YYYY-MM-01, to = последний день].
// Кнопки `<` / `>` сдвигают на месяц назад / вперёд. Будущие месяцы доступны
// — пользователь может посмотреть запланированные платежи (расходы с
// occurred_on в будущем).
export type YearMonth = { year: number; month: number };

type Props = {
  value: YearMonth;
  onChange: (next: YearMonth) => void;
};

export function PeriodPickerMonth({ value, onChange }: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['12'],
  };

  const btn: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    background: colors.bgMuted,
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: colors.text,
  };

  const label: CSSProperties = {
    minWidth: 140,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 700,
    color: colors.text,
  };

  return (
    <div style={wrap}>
      <button
        type="button"
        className="pressable"
        style={btn}
        onClick={() => onChange(shift(value, -1))}
        aria-label="Предыдущий месяц"
      >
        <IconChevronLeft size={14} color={colors.text} />
      </button>
      <div style={label}>{formatYearMonth(value)}</div>
      <button
        type="button"
        className="pressable"
        style={btn}
        onClick={() => onChange(shift(value, 1))}
        aria-label="Следующий месяц"
      >
        <IconChevronRight size={14} color={colors.text} />
      </button>
    </div>
  );
}

// Преобразования between YearMonth и ISO-датами.

export function shift(v: YearMonth, by: number): YearMonth {
  const m0 = v.month - 1 + by;
  const year = v.year + Math.floor(m0 / 12);
  const month = ((m0 % 12) + 12) % 12 + 1;
  return { year, month };
}

export function currentYearMonth(): YearMonth {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function periodFromYearMonth(v: YearMonth): { from: string; to: string } {
  const last = new Date(Date.UTC(v.year, v.month, 0)).getUTCDate();
  const mm = String(v.month).padStart(2, '0');
  return {
    from: `${v.year}-${mm}-01`,
    to: `${v.year}-${mm}-${String(last).padStart(2, '0')}`,
  };
}

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export function formatYearMonth(v: YearMonth): string {
  return `${MONTHS[v.month - 1]} ${v.year}`;
}
