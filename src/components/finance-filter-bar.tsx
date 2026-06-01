'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import {
  IconCalendar,
  IconChevronDown,
  IconHome,
  IconArchive,
  IconShirt,
  IconFileText,
  IconPerson,
  IconShieldCheck,
  IconSettings,
  IconBack,
  IconCheck,
  IconTag,
} from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { directionOf } from '@/components/transaction-card';
import type { FinanceTransaction } from '@/types/api';

// Панель фильтров на `/money/transactions`: три плашки-кнопки в строке.
// Это НЕ chip-фильтры — каждая плашка всегда видна, цвет нейтральный,
// активное значение пишется внутри лейбла. По тапу открывается соответствующий
// bottomsheet. Внутри sheet'ов — radio (период/направление) или мульти-чекбоксы
// (тип операции).

// ─────────────────────────────────────────────────────────────────────────────
// Типы фильтров
// ─────────────────────────────────────────────────────────────────────────────

// Период: три пресета относительно «сегодня», произвольный диапазон или «всё».
export type PeriodFilter =
  | { mode: 'all' }
  | { mode: 'last1m' }
  | { mode: 'last3m' }
  | { mode: 'last6m' }
  | { mode: 'custom'; from: string | null; to: string | null };

export type KindFilter = 'all' | 'income' | 'expense';

// `TypeSlice` — это «удобный для фильтра» тип, склеенный из (type, category).
// Не совпадает с FinanceTxType: expense дробится по category, а player_payment
// разделяется на 'payment' (есть event) и 'deposit' (нет event).
export type TypeSlice =
  | 'payment'
  | 'deposit'
  | 'adjustment'
  | 'arena'
  | 'inventory'
  | 'uniform'
  | 'refund'
  | 'other';

// type — массив выбранных slice'ов. Пустой массив = «все типы» (нет фильтра).
export type FinanceFilters = {
  period: PeriodFilter;
  kind: KindFilter;
  type: TypeSlice[];
};

export const DEFAULT_FILTERS: FinanceFilters = {
  period: { mode: 'all' },
  kind: 'all',
  type: [],
};

// Какие slice относятся к income / expense — нужно для адаптивности TypeSheet
// под выбранное направление и для очистки невалидных пар при смене kind.
const INCOME_SLICES: ReadonlySet<TypeSlice> = new Set(['payment', 'deposit', 'adjustment']);
const EXPENSE_SLICES: ReadonlySet<TypeSlice> = new Set([
  'arena',
  'inventory',
  'uniform',
  'refund',
  'other',
]);

// ─────────────────────────────────────────────────────────────────────────────
// I18n-словарь
// ─────────────────────────────────────────────────────────────────────────────

export type FinanceFilterLabels = {
  // Плашки (дефолт + краткие лейблы пресетов периода и счётчик типов):
  pillPeriod: string;
  pillPeriodLast1m: string;
  pillPeriodLast3m: string;
  pillPeriodLast6m: string;
  pillKind: string;
  pillType: string;
  pillTypeFew: string; // «{n} типа» — для 2..4
  pillTypeMany: string; // «{n} типов» — для 5..20

  // Sheet «Период»:
  periodSheetTitle: string;
  periodLast1m: string;
  periodLast3m: string;
  periodLast6m: string;
  periodRangeSection: string;
  periodFrom: string;
  periodTo: string;

  // Sheet «Направление»:
  kindSheetTitle: string;
  kindSheetHint: string;
  kindAll: string;
  kindAllHint: string;
  kindIncome: string;
  kindIncomeHint: string;
  kindExpense: string;
  kindExpenseHint: string;

  // Sheet «Тип операции»:
  typeSheetTitle: string;
  typeSheetHint: string;
  typeGroupIncome: string;
  typeGroupExpense: string;
  typePayment: string;
  typeDeposit: string;
  typeAdjustment: string;
  typeArena: string;
  typeInventory: string;
  typeUniform: string;
  typeRefund: string;
  typeOther: string;

  // Действия:
  reset: string;
  apply: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Главный компонент: три плашки + три bottomsheet'а
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  filters: FinanceFilters;
  onChange: (next: FinanceFilters) => void;
  labels: FinanceFilterLabels;
};

export function FinanceFilterBar({ filters, onChange, labels }: Props) {
  const [open, setOpen] = useState<'period' | 'kind' | 'type' | null>(null);

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
          label={formatPeriodPill(filters.period, labels)}
          onClick={() => setOpen('period')}
        />
        <FilterPill
          icon={<KindPillIcon kind={filters.kind} />}
          label={formatKindPill(filters.kind, labels)}
          onClick={() => setOpen('kind')}
        />
        <FilterPill
          icon={<IconTag size={18} color={colors.text} />}
          label={formatTypePill(filters.type, labels)}
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
          // При смене направления оставляем в массиве только slice'ы, валидные
          // для нового kind (иначе остаётся противоречивая пара kind=income +
          // type=[arena] → пустая выдача без понятной причины).
          const nextType = pruneTypesForKind(filters.type, next);
          onChange({ ...filters, kind: next, type: nextType });
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
// FilterPill — одна плашка-кнопка фильтра
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

// Кружок-иконка слева в плашке «Направление». Не показываем стрелочки в плашке
// (мало места) — оставляем только цветную точку: зелёная для доходов/all,
// красная для расходов.
function KindPillIcon({ kind }: { kind: KindFilter }) {
  const tint =
    kind === 'expense' ? colors.error : kind === 'income' ? colors.success : colors.primary;
  return (
    <span
      aria-hidden
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: tint,
        opacity: 0.18,
        boxShadow: `inset 0 0 0 4px ${tint}`,
        flexShrink: 0,
      }}
    />
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
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const presets: { id: 'last1m' | 'last3m' | 'last6m'; label: string }[] = [
    { id: 'last1m', label: labels.periodLast1m },
    { id: 'last3m', label: labels.periodLast3m },
    { id: 'last6m', label: labels.periodLast6m },
  ];

  const customFrom = draft.mode === 'custom' ? draft.from : null;
  const customTo = draft.mode === 'custom' ? draft.to : null;

  const setCustom = (next: { from: string | null; to: string | null }) => {
    setDraft({ mode: 'custom', from: next.from, to: next.to });
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={labels.periodSheetTitle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
        {presets.map((p) => (
          <RadioCard
            key={p.id}
            icon={<IconCalendar size={20} color={colors.text} />}
            label={p.label}
            active={draft.mode === p.id}
            onClick={() => setDraft({ mode: p.id })}
          />
        ))}
      </div>

      <div style={{ marginTop: spacing['20'], marginBottom: spacing['8'] }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>
          {labels.periodRangeSection}
        </span>
      </div>
      <div style={{ display: 'flex', gap: spacing['8'] }}>
        <DateInputField
          label={labels.periodFrom}
          value={customFrom}
          onChange={(v) => setCustom({ from: v, to: customTo })}
        />
        <DateInputField
          label={labels.periodTo}
          value={customTo}
          onChange={(v) => setCustom({ from: customFrom, to: v })}
        />
      </div>

      <SheetActions
        onReset={() => setDraft({ mode: 'all' })}
        onApply={() => onApply(normalizePeriod(draft))}
        resetLabel={labels.reset}
        applyLabel={labels.apply}
      />
    </BottomSheet>
  );
}

// Если в custom-диапазоне ничего не введено и mode='custom' — фактически это
// «всё». Приводим к 'all', чтобы плашка не залипала на пустом диапазоне.
function normalizePeriod(p: PeriodFilter): PeriodFilter {
  if (p.mode === 'custom' && !p.from && !p.to) return { mode: 'all' };
  return p;
}

function DateInputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const wrap: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: `${spacing['10']}px ${spacing['12']}px`,
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
  };
  const lbl: CSSProperties = { fontSize: 12, color: colors.textSecondary };
  const inputRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['8'],
  };
  const input: CSSProperties = {
    flex: 1,
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    padding: 0,
    fontSize: 15,
    fontWeight: 500,
    color: colors.text,
    fontFamily: 'inherit',
  };
  return (
    <div style={wrap}>
      <span style={lbl}>{label}</span>
      <div style={inputRow}>
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          style={input}
        />
        <IconCalendar size={16} color={colors.textSecondary} />
      </div>
    </div>
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

  return (
    <BottomSheet open={open} onClose={onClose} title={labels.kindSheetTitle}>
      <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: spacing['12'] }}>
        {labels.kindSheetHint}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
        <KindCard
          icon={<KindGlyph kind="all" />}
          label={labels.kindAll}
          hint={labels.kindAllHint}
          active={draft === 'all'}
          onClick={() => setDraft('all')}
        />
        <KindCard
          icon={<KindGlyph kind="income" />}
          label={labels.kindIncome}
          hint={labels.kindIncomeHint}
          active={draft === 'income'}
          onClick={() => setDraft('income')}
        />
        <KindCard
          icon={<KindGlyph kind="expense" />}
          label={labels.kindExpense}
          hint={labels.kindExpenseHint}
          active={draft === 'expense'}
          onClick={() => setDraft('expense')}
        />
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

// Карточка с radio для KindSheet — больше высота, иконка-кружок, подпись.
function KindCard({
  icon,
  label,
  hint,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: spacing['12'],
    width: '100%',
    border: `1.5px solid ${active ? colors.primary : colors.border}`,
    background: active ? colors.primaryLight : colors.bg,
    borderRadius: radius.lg,
    cursor: 'pointer',
    textAlign: 'left',
  };
  return (
    <button type="button" className="pressable" onClick={onClick} style={wrap}>
      {icon}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>{label}</span>
        <span style={{ fontSize: 13, color: colors.textSecondary }}>{hint}</span>
      </div>
      <RadioMark active={active} />
    </button>
  );
}

// Цветной кружок-иконка для KindSheet — пастельный фон + стилизованная стрелка.
function KindGlyph({ kind }: { kind: KindFilter }) {
  const bg =
    kind === 'expense' ? colors.errorBg : kind === 'income' ? colors.successBg : colors.primaryLight;
  const fg = kind === 'expense' ? colors.error : colors.successDark;
  const wrap: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: bg,
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: fg,
  };
  return <span style={wrap}>{kind === 'all' ? <ArrowsLR /> : <Arrow kind={kind} />}</span>;
}

function ArrowsLR() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 9h14M14 6l3 3-3 3M21 15H7m3-3l-3 3 3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Arrow({ kind }: { kind: 'income' | 'expense' }) {
  // income — стрелка вниз, expense — стрелка вверх-вправо (исходящая).
  if (kind === 'income') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 4v15m0 0l-6-6m6 6l6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 18L18 6M8 6h10v10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sheet «Тип операции» — мультиселект чекбоксами, две секции
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
  value: TypeSlice[];
  kind: KindFilter;
  onApply: (next: TypeSlice[]) => void;
  labels: FinanceFilterLabels;
}) {
  const [draft, setDraft] = useState<TypeSlice[]>(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const toggle = (id: TypeSlice) => {
    setDraft((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const incomeOptions: TypeOption[] = [
    { id: 'payment', label: labels.typePayment, icon: 'person' },
    { id: 'deposit', label: labels.typeDeposit, icon: 'shield' },
    { id: 'adjustment', label: labels.typeAdjustment, icon: 'sliders' },
  ];
  const expenseOptions: TypeOption[] = [
    { id: 'arena', label: labels.typeArena, icon: 'home' },
    { id: 'inventory', label: labels.typeInventory, icon: 'box' },
    { id: 'uniform', label: labels.typeUniform, icon: 'shirt' },
    { id: 'refund', label: labels.typeRefund, icon: 'back' },
    { id: 'other', label: labels.typeOther, icon: 'file' },
  ];

  // Адаптивность по выбранному направлению: kind=income → только Поступления,
  // kind=expense → только Списания, kind=all → обе.
  const showIncome = kind !== 'expense';
  const showExpense = kind !== 'income';

  return (
    <BottomSheet open={open} onClose={onClose} title={labels.typeSheetTitle}>
      <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: spacing['16'] }}>
        {labels.typeSheetHint}
      </div>

      {showIncome ? (
        <TypeGroup
          title={labels.typeGroupIncome}
          options={incomeOptions}
          selected={draft}
          onToggle={toggle}
        />
      ) : null}

      {showIncome && showExpense ? <div style={{ height: spacing['20'] }} /> : null}

      {showExpense ? (
        <TypeGroup
          title={labels.typeGroupExpense}
          options={expenseOptions}
          selected={draft}
          onToggle={toggle}
        />
      ) : null}

      <SheetActions
        onReset={() => setDraft([])}
        onApply={() => onApply(draft)}
        resetLabel={labels.reset}
        applyLabel={labels.apply}
      />
    </BottomSheet>
  );
}

type TypeIconKey = 'person' | 'shield' | 'sliders' | 'home' | 'box' | 'shirt' | 'back' | 'file';

type TypeOption = { id: TypeSlice; label: string; icon: TypeIconKey };

function TypeGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: TypeOption[];
  selected: TypeSlice[];
  onToggle: (id: TypeSlice) => void;
}) {
  return (
    <section>
      <h3
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: colors.text,
          margin: 0,
          marginBottom: spacing['8'],
        }}
      >
        {title}
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: spacing['8'],
        }}
      >
        {options.map((o) => (
          <TypeTile
            key={o.id}
            label={o.label}
            icon={o.icon}
            active={selected.includes(o.id)}
            onClick={() => onToggle(o.id)}
          />
        ))}
      </div>
    </section>
  );
}

function TypeTile({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: TypeIconKey;
  active: boolean;
  onClick: () => void;
}) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
    padding: `${spacing['10']}px ${spacing['12']}px`,
    border: `1.5px solid ${active ? colors.primary : colors.border}`,
    background: active ? colors.primaryLight : colors.bg,
    borderRadius: radius.lg,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    minHeight: 60,
  };
  const iconWrap: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: active ? colors.primary : colors.bgMuted,
    color: active ? colors.textInverse : colors.text,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  return (
    <button type="button" className="pressable" onClick={onClick} style={wrap}>
      <span style={iconWrap} aria-hidden>
        <TypeIcon name={icon} size={18} />
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>
        {label}
      </span>
      <CheckboxMark active={active} />
    </button>
  );
}

function TypeIcon({ name, size }: { name: TypeIconKey; size: number }) {
  switch (name) {
    case 'person':
      return <IconPerson size={size} color="currentColor" />;
    case 'shield':
      return <IconShieldCheck size={size} color="currentColor" />;
    case 'sliders':
      return <IconSettings size={size} color="currentColor" />;
    case 'home':
      return <IconHome size={size} color="currentColor" />;
    case 'box':
      return <IconArchive size={size} color="currentColor" />;
    case 'shirt':
      return <IconShirt size={size} color="currentColor" />;
    case 'back':
      return <IconBack size={size} color="currentColor" />;
    case 'file':
    default:
      return <IconFileText size={size} color="currentColor" />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Маркеры выбора (radio для single-select, checkbox для multi-select)
// ─────────────────────────────────────────────────────────────────────────────

function RadioMark({ active }: { active: boolean }) {
  const wrap: CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: active ? colors.primary : 'transparent',
    border: active ? 'none' : `1.5px solid ${colors.chipBorder}`,
    color: colors.textInverse,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  return (
    <span style={wrap} aria-hidden>
      {active ? <IconCheck size={14} color={colors.textInverse} /> : null}
    </span>
  );
}

function CheckboxMark({ active }: { active: boolean }) {
  const wrap: CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: 6,
    background: active ? colors.primary : 'transparent',
    border: active ? 'none' : `1.5px solid ${colors.chipBorder}`,
    color: colors.textInverse,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  return (
    <span style={wrap} aria-hidden>
      {active ? <IconCheck size={14} color={colors.textInverse} /> : null}
    </span>
  );
}

// Универсальная карточка-radio для PeriodSheet (тонкая обёртка над общей разметкой).
function RadioCard({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['12']}px ${spacing['12']}px`,
    border: `1.5px solid ${active ? colors.primary : colors.border}`,
    background: active ? colors.primaryLight : colors.bg,
    borderRadius: radius.lg,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  };
  const iconWrap: CSSProperties = {
    width: 32,
    height: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: colors.text,
  };
  return (
    <button type="button" className="pressable" onClick={onClick} style={wrap}>
      <span style={iconWrap} aria-hidden>
        {icon}
      </span>
      <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: colors.text }}>{label}</span>
      <RadioMark active={active} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Действия (Сбросить / Применить) внизу любого sheet'а
// ─────────────────────────────────────────────────────────────────────────────

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
  // По дизайну «Сбросить» — текстовая зелёная кнопка слева, «Применить» —
  // зелёный pill на оставшейся ширине.
  const reset: CSSProperties = {
    background: 'transparent',
    color: colors.primary,
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    padding: `${spacing['12']}px ${spacing['16']}px`,
    cursor: 'pointer',
    flexShrink: 0,
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing['8'],
        marginTop: spacing['20'],
      }}
    >
      <button type="button" className="pressable" onClick={onReset} style={reset}>
        {resetLabel}
      </button>
      <div style={{ flex: 1 }}>
        <Button variant="primary" size="md" fullWidth onClick={onApply}>
          {applyLabel}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Хелперы лейблов плашек
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

function formatPeriodPill(p: PeriodFilter, labels: FinanceFilterLabels): string {
  switch (p.mode) {
    case 'last1m':
      return labels.pillPeriodLast1m;
    case 'last3m':
      return labels.pillPeriodLast3m;
    case 'last6m':
      return labels.pillPeriodLast6m;
    case 'custom': {
      if (!p.from && !p.to) return labels.pillPeriod;
      const f = p.from ? shortDate(p.from) : '…';
      const t = p.to ? shortDate(p.to) : '…';
      return `${f} — ${t}`;
    }
    default:
      return labels.pillPeriod;
  }
}

function formatKindPill(k: KindFilter, labels: FinanceFilterLabels): string {
  if (k === 'income') return labels.kindIncome;
  if (k === 'expense') return labels.kindExpense;
  return labels.pillKind;
}

function formatTypePill(slices: TypeSlice[], labels: FinanceFilterLabels): string {
  if (slices.length === 0) return labels.pillType;
  if (slices.length === 1) return sliceLabel(slices[0]!, labels);
  // Множественное — выводим «N типа» / «N типов» по простому русскому правилу.
  const n = slices.length;
  const lastTwo = n % 100;
  const last = n % 10;
  const isFew = last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14);
  const tmpl = isFew ? labels.pillTypeFew : labels.pillTypeMany;
  return tmpl.replace('{n}', String(n));
}

function sliceLabel(s: TypeSlice, labels: FinanceFilterLabels): string {
  switch (s) {
    case 'payment': return labels.typePayment;
    case 'deposit': return labels.typeDeposit;
    case 'adjustment': return labels.typeAdjustment;
    case 'arena': return labels.typeArena;
    case 'inventory': return labels.typeInventory;
    case 'uniform': return labels.typeUniform;
    case 'refund': return labels.typeRefund;
    case 'other': return labels.typeOther;
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
// Применение фильтра к транзакции — используется на странице и в тестах
// ─────────────────────────────────────────────────────────────────────────────

export function matchesFilters(tx: FinanceTransaction, f: FinanceFilters): boolean {
  if (!matchesPeriod(tx, f.period)) return false;
  if (f.kind !== 'all' && directionOf(tx.type) !== f.kind) return false;
  if (f.type.length > 0 && !f.type.includes(sliceOf(tx))) return false;
  return true;
}

function matchesPeriod(tx: FinanceTransaction, p: PeriodFilter): boolean {
  if (p.mode === 'all') return true;
  if (p.mode === 'custom') {
    if (p.from && tx.occurred_on < p.from) return false;
    if (p.to && tx.occurred_on > p.to) return false;
    return true;
  }
  const months = p.mode === 'last1m' ? 1 : p.mode === 'last3m' ? 3 : 6;
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  const fromIso = toIsoDay(from);
  return tx.occurred_on >= fromIso;
}

function toIsoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

function pruneTypesForKind(types: TypeSlice[], kind: KindFilter): TypeSlice[] {
  if (kind === 'all') return types;
  const allowed = kind === 'income' ? INCOME_SLICES : EXPENSE_SLICES;
  return types.filter((t) => allowed.has(t));
}
