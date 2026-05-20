'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { BottomSheet } from './bottom-sheet';
import { IconChevronLeft, IconChevronRight } from './icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { isSameDay } from '@/lib/event-format';

type Props = {
  open: boolean;
  onClose: () => void;
  selected: Date;
  onSelect: (date: Date) => void;
  eventDayKeys: Set<string>;
  dayShortLabels: string[]; // 7 шт., с ПН
  prevMonthAriaLabel: string;
  nextMonthAriaLabel: string;
};

const monthLongFmt = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
});

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(monthAnchor: Date): Date[] {
  const first = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const firstDay = first.getDay(); // 0=вс…6=сб
  const lead = firstDay === 0 ? 6 : firstDay - 1; // дней до понедельника
  const start = new Date(first);
  start.setDate(start.getDate() - lead);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

export function MonthSheet({
  open,
  onClose,
  selected,
  onSelect,
  eventDayKeys,
  dayShortLabels,
  prevMonthAriaLabel,
  nextMonthAriaLabel,
}: Props) {
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => {
    const d = new Date(selected);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const grid = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const monthLabel = useMemo(() => {
    const raw = monthLongFmt.format(monthAnchor);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [monthAnchor]);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const headerWrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing['4']}px 0 ${spacing['12']}px`,
  };
  const arrowBtn: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 18,
    background: 'transparent',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    color: colors.text,
  };
  const monthTitle: CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: colors.text,
    lineHeight: 1.2,
  };

  const weekdaysRow: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: spacing['4'],
    marginBottom: spacing['6'],
  };
  const weekdayLabel: CSSProperties = {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: colors.textSecondary,
    letterSpacing: '0.04em',
  };

  const grid7: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: spacing['4'],
  };

  const cellBase: CSSProperties = {
    position: 'relative',
    height: 44,
    borderRadius: radius.md,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={monthLabel}>
      <div style={headerWrap}>
        <button
          type="button"
          className="pressable"
          aria-label={prevMonthAriaLabel}
          onClick={() => {
            const d = new Date(monthAnchor);
            d.setMonth(d.getMonth() - 1);
            setMonthAnchor(d);
          }}
          style={arrowBtn}
        >
          <IconChevronLeft size={20} color={colors.text} />
        </button>
        <span style={monthTitle}>{monthLabel}</span>
        <button
          type="button"
          className="pressable"
          aria-label={nextMonthAriaLabel}
          onClick={() => {
            const d = new Date(monthAnchor);
            d.setMonth(d.getMonth() + 1);
            setMonthAnchor(d);
          }}
          style={arrowBtn}
        >
          <IconChevronRight size={20} color={colors.text} />
        </button>
      </div>

      <div style={weekdaysRow}>
        {dayShortLabels.map((l) => (
          <span key={l} style={weekdayLabel}>
            {l}
          </span>
        ))}
      </div>

      <div style={grid7}>
        {grid.map((d) => {
          const inMonth = d.getMonth() === monthAnchor.getMonth();
          const isSel = isSameDay(d, selected);
          const isToday = isSameDay(d, today);
          const hasEvents = eventDayKeys.has(dayKey(d));
          const cell: CSSProperties = {
            ...cellBase,
            color: isSel
              ? colors.textInverse
              : !inMonth
                ? colors.textTertiary
                : colors.text,
            background: isSel ? colors.headerBg : 'transparent',
            fontWeight: isSel || isToday ? 700 : 500,
            fontSize: 14,
            opacity: inMonth ? 1 : 0.55,
          };
          const dot: CSSProperties = {
            position: 'absolute',
            bottom: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: isSel ? colors.textInverse : colors.headerAccent,
          };
          const todayUnderline: CSSProperties = {
            position: 'absolute',
            inset: 0,
            border: `1px solid ${colors.headerAccent}`,
            borderRadius: radius.md,
            pointerEvents: 'none',
          };
          return (
            <button
              key={d.toISOString()}
              type="button"
              className="pressable"
              onClick={() => {
                onSelect(d);
                onClose();
              }}
              style={cell}
              aria-pressed={isSel}
            >
              {isToday && !isSel ? <span style={todayUnderline} /> : null}
              <span>{d.getDate()}</span>
              {hasEvents ? <span style={dot} /> : null}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

export { dayKey };
