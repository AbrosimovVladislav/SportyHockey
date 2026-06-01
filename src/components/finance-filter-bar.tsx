'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { BottomSheet, BottomSheetOption } from '@/components/bottom-sheet';
import { DateRangeFilter } from '@/components/date-range-filter';
import { Button } from '@/components/button';
import {
  IconCalendar,
  IconFileText,
  IconTag,
  IconChevronDown,
} from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { directionOf } from '@/components/transaction-card';
import type { FinanceTransaction } from '@/types/api';

// Панель фильтров на `/money/transactions`: три плашки-кнопки в строке.
// Это НЕ chip-фильтры — каждая плашка всегда видна, цвет нейтральный, активное
// значение пишется внутри лейбла. По тапу открывается соответствующий sheet.

// ─────────────────────────────────────────────────────────────────────────────
// Типы фильтров
// ─────────────────────────────────────────────────────────────────────────────

export type PeriodFilter =
  | { mode: 'all' }
  | { mode: 'month'; monthKey: string }
  | { mode: 'custom'; from: string | null; to: string | null };

export type KindFilter = 'all' | 'income' | 'expense';

export type TypeSlice =
  | 'all'
  | 'payment'
  | 'deposit'
  | 'adjustment'
  | 'arena'
  | 'inventory'
  | 'uniform'
  | 'refund'
  | 'other';

export type FinanceFilters = {
  period: PeriodFilter;
  kind: KindFilter;
  type: TypeSlice;
};

export const DEFAULT_FILTERS: FinanceFilters = {
  period: { mode: 'all' },
  kind: 'all',
  type: 'all',
};

// ─────────────────────────────────────────────────────────────────────────────
// I18n-словарь для подписей плашек и sheet'ов
// ─────────────────────────────────────────────────────────────────────────────

export type FinanceFilterLabels = {
  // Плашки. Если значение фильтра — дефолт, на плашке показывается базовый
  // лейбл, иначе текущее значение.
  pillPeriod: string;
  pillKind: string;
  pillType: string;
  // Sheet «Период»:
  periodSheetTitle: string;
  periodAll: string;
  periodCustomTitle: string;
  periodCustomFrom: string;
  periodCustomTo: string;
  // Sheet «Направление»:
  kindSheetTitle: string;
  kindAll: string;
  kindIncome: string;
  kindExpense: string;
  // Sheet «Тип операции»:
  typeSheetTitle: string;
  typeAll: string;
  typePayment: string;
  typeDeposit: string;
  typeAdjustment: string;
  typeArena: string;
  typeInventory: string;
  typeUniform: string;
  typeRefund: string;
  typeOther: string;
  // Кнопки внизу sheet'ов:
  reset: string;
  apply: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Главный компонент
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  filters: FinanceFilters;
  onChange: (next: FinanceFilters) => void;
  labels: FinanceFilterLabels;
};

export function FinanceFilterBar({ filters, onChange, labels }: Props) {
  const [open, setOpen] = useState<'period' | 'kind' | 'type' | null>(null);

  const periodLabel = formatPeriodLabel(filters.period, labels);
  const kindLabel = formatKindLabel(filters.kind, labels);
  const typeLabel = formatTypeLabel(filters.type, labels);

  const row: CSSProperties = {
    display: 'flex',
    gap: spacing['8'],
    overflowX: 'auto',
    scrollbarWidth: 'none',
    padding: `${spacing['8']}px ${spacing['16']}px ${spacing['12']}px`,
    background: colors.bg,
  };

  return (
    <>
      <div style={row}>
        <FilterPill
          icon={<IconCalendar size={18} color={colors.text} />}
          label={periodLabel}
          onClick={() => setOpen('period')}
        />
        <FilterPill
          icon={<IconFileText size={18} color={colors.text} />}
          label={kindLabel}
          onClick={() => setOpen('kind')}
        />
        <FilterPill
          icon={<IconTag size={18} color={colors.text} />}
          label={typeLabel}
          onClick={() => setOpen('type')}
        />
      </div>

      <PeriodSheet
        open={open === 'period'}
        onClose={() => setOpen(null)}
        value={filters.period}
        onApply={(next) => {
          onChange({ ...filters, period: next });
          setOpen(null);
        }}
        labels={labels}
      />
      <KindSheet
        open={open === 'kind'}
        onClose={() => setOpen(null)}
        value={filters.kind}
        onApply={(next) => {
          // Смена направления сбрасывает slice — иначе остаётся невалидная пара
          // (например, kind=income + type=arena).
          onChange({ ...filters, kind: next, type: 'all' });
          setOpen(null);
        }}
        labels={labels}
      />
      <TypeSheet
        open={open === 'type'}
        onClose={() => setOpen(null)}
        value={filters.type}
        kind={filters.kind}
        onApply={(next) => {
          onChange({ ...filters, type: next });
          setOpen(null);
        }}
        labels={labels}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Внутренние UI-части
// ─────────────────────────────────────────────────────────────────────────────

function FilterPill({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  const wrap: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing['8'],
    padding: `${spacing['10']}px ${spacing['12']}px`,
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.pill,
    cursor: 'pointer',
    color: colors.text,
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
  return (
    <button type="button" className="pressable" onClick={onClick} style={wrap}>
      {icon}
      <span>{label}</span>
      <IconChevronDown size={12} color={colors.textSecondary} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sheet «Период»
// ─────────────────────────────────────────────────────────────────────────────

function PeriodSheet({
  open,
  onClose,
  value,
  onApply,
  labels,
}: {
  open: boolean;
  onClose: () => void;
  value: PeriodFilter;
  onApply: (next: PeriodFilter) => void;
  labels: FinanceFilterLabels;
}) {
  const [draft, setDraft] = useState<PeriodFilter>(value);
  // При повторном открытии возвращаем draft к текущему примененному значению.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const months = useMemo(() => lastMonths(12), []);

  return (
    <BottomSheet open={open} onClose={onClose} title={labels.periodSheetTitle}>
      <div style={listScroll}>
        <BottomSheetOption
          label={labels.periodAll}
          active={draft.mode === 'all'}
          onClick={() => setDraft({ mode: 'all' })}
        />
        {months.map((mk) => (
          <BottomSheetOption
            key={mk}
            label={formatMonthLabel(mk)}
            active={draft.mode === 'month' && draft.monthKey === mk}
            onClick={() => setDraft({ mode: 'month', monthKey: mk })}
          />
        ))}
        <BottomSheetOption
          label={labels.periodCustomTitle}
          active={draft.mode === 'custom'}
          onClick={() => {
            const from = draft.mode === 'custom' ? draft.from : null;
            const to = draft.mode === 'custom' ? draft.to : null;
            setDraft({ mode: 'custom', from, to });
          }}
        />
      </div>

      {draft.mode === 'custom' ? (
        <div style={{ marginTop: spacing['12'] }}>
          <DateRangeFilter
            from={draft.from}
            to={draft.to}
            onChange={(next) => setDraft({ mode: 'custom', from: next.from, to: next.to })}
            fromLabel={labels.periodCustomFrom}
            toLabel={labels.periodCustomTo}
            resetLabel={labels.reset}
          />
        </div>
      ) : null}

      <SheetActions
        onReset={() => setDraft({ mode: 'all' })}
        onApply={() => onApply(draft)}
        resetLabel={labels.reset}
        applyLabel={labels.apply}
      />
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sheet «Направление» (kind)
// ─────────────────────────────────────────────────────────────────────────────

function KindSheet({
  open,
  onClose,
  value,
  onApply,
  labels,
}: {
  open: boolean;
  onClose: () => void;
  value: KindFilter;
  onApply: (next: KindFilter) => void;
  labels: FinanceFilterLabels;
}) {
  const [draft, setDraft] = useState<KindFilter>(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const options: { id: KindFilter; label: string }[] = [
    { id: 'all', label: labels.kindAll },
    { id: 'income', label: labels.kindIncome },
    { id: 'expense', label: labels.kindExpense },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} title={labels.kindSheetTitle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {options.map((o) => (
          <BottomSheetOption
            key={o.id}
            label={o.label}
            active={draft === o.id}
            onClick={() => setDraft(o.id)}
          />
        ))}
      </div>
      <SheetActions
        onReset={() => setDraft('all')}
        onApply={() => onApply(draft)}
        resetLabel={labels.reset}
        applyLabel={labels.apply}
      />
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sheet «Тип операции» — адаптивный под выбранное направление
// ─────────────────────────────────────────────────────────────────────────────

function TypeSheet({
  open,
  onClose,
  value,
  kind,
  onApply,
  labels,
}: {
  open: boolean;
  onClose: () => void;
  value: TypeSlice;
  kind: KindFilter;
  onApply: (next: TypeSlice) => void;
  labels: FinanceFilterLabels;
}) {
  const [draft, setDraft] = useState<TypeSlice>(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const options = useMemo<{ id: TypeSlice; label: string }[]>(() => {
    const all = { id: 'all' as TypeSlice, label: labels.typeAll };
    if (kind === 'income') {
      return [
        all,
        { id: 'payment', label: labels.typePayment },
        { id: 'deposit', label: labels.typeDeposit },
        { id: 'adjustment', label: labels.typeAdjustment },
      ];
    }
    if (kind === 'expense') {
      return [
        all,
        { id: 'arena', label: labels.typeArena },
        { id: 'inventory', label: labels.typeInventory },
        { id: 'uniform', label: labels.typeUniform },
        { id: 'refund', label: labels.typeRefund },
        { id: 'other', label: labels.typeOther },
      ];
    }
    return [
      all,
      { id: 'payment', label: labels.typePayment },
      { id: 'deposit', label: labels.typeDeposit },
      { id: 'adjustment', label: labels.typeAdjustment },
      { id: 'arena', label: labels.typeArena },
      { id: 'inventory', label: labels.typeInventory },
      { id: 'uniform', label: labels.typeUniform },
      { id: 'refund', label: labels.typeRefund },
      { id: 'other', label: labels.typeOther },
    ];
  }, [kind, labels]);

  return (
    <BottomSheet open={open} onClose={onClose} title={labels.typeSheetTitle}>
      <div style={listScroll}>
        {options.map((o) => (
          <BottomSheetOption
            key={o.id}
            label={o.label}
            active={draft === o.id}
            onClick={() => setDraft(o.id)}
          />
        ))}
      </div>
      <SheetActions
        onReset={() => setDraft('all')}
        onApply={() => onApply(draft)}
        resetLabel={labels.reset}
        applyLabel={labels.apply}
      />
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Универсальные части sheet'ов
// ─────────────────────────────────────────────────────────────────────────────

const listScroll: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  maxHeight: '50dvh',
  overflow: 'auto',
};

function SheetActions({
  onReset,
  onApply,
  resetLabel,
  applyLabel,
}: {
  onReset: () => void;
  onApply: () => void;
  resetLabel: string;
  applyLabel: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: spacing['8'],
        marginTop: spacing['16'],
      }}
    >
      <Button variant="secondary" size="md" onClick={onReset}>
        {resetLabel}
      </Button>
      <div style={{ flex: 1 }}>
        <Button variant="primary" size="md" fullWidth onClick={onApply}>
          {applyLabel}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Хелперы лейблов и месяцев
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS_LONG = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

function lastMonths(n: number): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(monthKey(d));
  }
  return out;
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return key;
  const y = Number(m[1]);
  const idx = Number(m[2]) - 1;
  const month = MONTHS_LONG[idx] ?? '';
  const now = new Date();
  return y === now.getFullYear() ? month : `${month} ${y}`;
}

function formatPeriodLabel(p: PeriodFilter, labels: FinanceFilterLabels): string {
  if (p.mode === 'all') return labels.pillPeriod;
  if (p.mode === 'month') return formatMonthLabel(p.monthKey);
  if (!p.from && !p.to) return labels.pillPeriod;
  const f = p.from ? shortDate(p.from) : '…';
  const t = p.to ? shortDate(p.to) : '…';
  return `${f} — ${t}`;
}

function formatKindLabel(k: KindFilter, labels: FinanceFilterLabels): string {
  if (k === 'income') return labels.kindIncome;
  if (k === 'expense') return labels.kindExpense;
  return labels.pillKind;
}

function formatTypeLabel(s: TypeSlice, labels: FinanceFilterLabels): string {
  switch (s) {
    case 'payment': return labels.typePayment;
    case 'deposit': return labels.typeDeposit;
    case 'adjustment': return labels.typeAdjustment;
    case 'arena': return labels.typeArena;
    case 'inventory': return labels.typeInventory;
    case 'uniform': return labels.typeUniform;
    case 'refund': return labels.typeRefund;
    case 'other': return labels.typeOther;
    default: return labels.pillType;
  }
}

function shortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const day = Number(m[3]);
  const month = MONTHS_SHORT[Number(m[2]) - 1] ?? '';
  return `${day} ${month}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Применение фильтра к транзакции — отдельная функция, чтобы страница не
// дублировала эту логику. Учитываем все три фильтра.
// ─────────────────────────────────────────────────────────────────────────────

export function matchesFilters(tx: FinanceTransaction, f: FinanceFilters): boolean {
  if (f.period.mode === 'month') {
    if (tx.occurred_on.slice(0, 7) !== f.period.monthKey) return false;
  } else if (f.period.mode === 'custom') {
    if (f.period.from && tx.occurred_on < f.period.from) return false;
    if (f.period.to && tx.occurred_on > f.period.to) return false;
  }
  if (f.kind !== 'all' && directionOf(tx.type) !== f.kind) return false;
  if (f.type !== 'all' && sliceOf(tx) !== f.type) return false;
  return true;
}

export function sliceOf(tx: FinanceTransaction): TypeSlice {
  if (tx.type === 'player_payment') return tx.event ? 'payment' : 'deposit';
  if (tx.type === 'adjustment') return 'adjustment';
  if (tx.type === 'refund') return 'refund';
  switch (tx.category) {
    case 'arena': return 'arena';
    case 'inventory': return 'inventory';
    case 'uniform': return 'uniform';
    default: return 'other';
  }
}
