'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { useT } from '@/hooks/use-t';
import { formatMoney } from '@/lib/format-money';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { FinanceExpenseCategory } from '@/types/api';

// Bottomsheet «Покупка инвентаря» — расход команды наружу (клюшки, шайбы,
// прочее). `finance_transaction` типа `expense`. Категория DB-схемы выбирается
// по типу покупки: «Клюшки» и «Шайбы» → `inventory`, «Прочее» → `other`.
// В `description` пишется человеко-читаемое имя типа («Клюшки» / «Шайбы» /
// «Прочее»), чтобы в ленте операций оно отображалось как title карточки.
// Это временный набор вариантов — расширим, когда понадобится.

type ItemKey = 'sticks' | 'pucks' | 'other';

type Item = {
  key: ItemKey;
  category: FinanceExpenseCategory;
  // i18n-ключ для отображаемого названия (он же пишется в description).
  labelKey: 'money.sheet.inventory.item.sticks' | 'money.sheet.inventory.item.pucks' | 'money.sheet.inventory.item.other';
};

const ITEMS: Item[] = [
  { key: 'sticks', category: 'inventory', labelKey: 'money.sheet.inventory.item.sticks' },
  { key: 'pucks', category: 'inventory', labelKey: 'money.sheet.inventory.item.pucks' },
  { key: 'other', category: 'other', labelKey: 'money.sheet.inventory.item.other' },
];

export type InventoryInitial = {
  id: string;
  category: FinanceExpenseCategory | null;
  amount: number;
  occurred_on: string;
  description: string | null;
};

export type InventoryFormValue = {
  category: FinanceExpenseCategory;
  amount: number;
  occurred_on: string;
  description: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial: InventoryInitial | null;
  availableOnHand?: number | null;
  onSubmit: (value: InventoryFormValue) => void;
  onDelete?: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  error?: string | null;
};

export function InventorySheet({
  open,
  onClose,
  mode,
  initial,
  availableOnHand,
  onSubmit,
  onDelete,
  isSaving,
  isDeleting,
  error,
}: Props) {
  const t = useT();
  const isEdit = mode === 'edit';

  // useT() возвращает новую функцию на каждом рендере, поэтому держим
  // её в ref — иначе useEffect ниже срабатывал бы на каждом клике и
  // сбрасывал выбранный itemKey обратно в 'sticks'.
  const tRef = useRef(t);
  tRef.current = t;

  const [itemKey, setItemKey] = useState<ItemKey>('sticks');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(todayIso());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      // Восстанавливаем тип из (category, description): сначала пробуем точный
      // матч по локализованному названию, затем fallback по категории.
      const desc = initial.description?.trim().toLowerCase() ?? '';
      const matched = desc
        ? ITEMS.find((item) => tRef.current(item.labelKey).toLowerCase() === desc)
        : null;
      setItemKey(matched?.key ?? (initial.category === 'other' ? 'other' : 'sticks'));
      setAmount(String(initial.amount));
      setDate(initial.occurred_on);
    } else {
      setItemKey('sticks');
      setAmount('');
      setDate(todayIso());
    }
    setConfirmOpen(false);
    setLocalError(null);
  }, [open, initial]);

  // Лимит кассы такой же, как у аренды: расход уменьшает on_hand, если дата
  // ≤ сегодня. При правке существующего расхода — добавляем oldAmount в лимит.
  const today = todayIso();
  const oldImpact =
    isEdit && initial?.id && initial.occurred_on <= today ? Number(initial.amount) : 0;
  const counts = date <= today;
  const maxAmount =
    availableOnHand != null && counts ? availableOnHand + oldImpact : null;

  const parsedAmount = Number(amount);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const overLimit = maxAmount != null && validAmount && parsedAmount > maxAmount;
  const shortfall = overLimit && maxAmount != null ? parsedAmount - maxAmount : 0;

  const submit = () => {
    setLocalError(null);
    if (!validAmount) {
      setLocalError(t('money.sheet.inventory.errorEmptyAmount'));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setLocalError(t('money.sheet.inventory.errorBadDate'));
      return;
    }
    if (overLimit && maxAmount != null) {
      setLocalError(
        t('money.sheet.inventory.errorInsufficient').replace(
          '{available}',
          formatMoney(Math.max(0, maxAmount)),
        ),
      );
      return;
    }
    const item = ITEMS.find((i) => i.key === itemKey) ?? ITEMS[0];
    onSubmit({
      category: item.category,
      amount: parsedAmount,
      occurred_on: date,
      description: t(item.labelKey),
    });
  };

  const handleDelete = () => {
    if (onDelete) onDelete();
    setConfirmOpen(false);
  };

  const label: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: spacing['6'],
  };

  const fieldBlock: CSSProperties = { marginBottom: spacing['12'] };

  const errorBox: CSSProperties = {
    fontSize: 13,
    color: colors.error,
    background: colors.errorBg,
    padding: `${spacing['8']}px ${spacing['12']}px`,
    borderRadius: radius.md,
    marginBottom: spacing['12'],
  };

  const finalError = error ?? localError;

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        title={isEdit ? t('money.sheet.inventory.editTitle') : t('money.sheet.inventory.createTitle')}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Тип покупки — segmented из трёх кнопок */}
        <div style={fieldBlock}>
          <div style={label}>{t('money.sheet.inventory.itemLabel')}</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${ITEMS.length}, 1fr)`,
              gap: spacing['8'],
            }}
          >
            {ITEMS.map((item) => {
              const active = item.key === itemKey;
              const css: CSSProperties = {
                padding: `${spacing['10']}px ${spacing['8']}px`,
                background: active ? colors.primary : colors.bgMuted,
                color: active ? colors.textInverse : colors.text,
                border: 'none',
                borderRadius: radius.md,
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                minHeight: 44,
              };
              return (
                <button
                  key={item.key}
                  type="button"
                  className="pressable"
                  style={css}
                  onClick={() => setItemKey(item.key)}
                >
                  {t(item.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Сумма */}
        <div style={fieldBlock}>
          <div style={label}>{t('money.sheet.inventory.amountLabel')}</div>
          <div style={{ position: 'relative' }}>
            <Input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.currentTarget.value.replace(/[^\d]/g, ''))}
              placeholder="0"
              style={{
                background: colors.bg,
                border: `1.5px solid ${colors.error}`,
                paddingRight: 36,
                fontSize: 22,
                fontWeight: 700,
                color: colors.error,
              }}
            />
            <span
              aria-hidden
              style={{
                position: 'absolute',
                right: spacing['16'],
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.error,
                fontSize: 18,
                fontWeight: 600,
                pointerEvents: 'none',
              }}
            >
              ₽
            </span>
          </div>
          {maxAmount != null ? (
            <div
              style={{
                marginTop: spacing['6'],
                fontSize: 12,
                fontWeight: 500,
                color: overLimit ? colors.error : colors.textSecondary,
              }}
            >
              {overLimit
                ? t('money.sheet.inventory.shortfall').replace(
                    '{amount}',
                    formatMoney(shortfall),
                  )
                : t('money.sheet.inventory.availableOnHand').replace(
                    '{amount}',
                    formatMoney(Math.max(0, maxAmount)),
                  )}
            </div>
          ) : null}
        </div>

        {/* Дата */}
        <div style={fieldBlock}>
          <div style={label}>{t('money.sheet.inventory.dateLabel')}</div>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.currentTarget.value)}
            max={todayIso()}
          />
        </div>

        {finalError ? <div style={errorBox}>{finalError}</div> : null}

        <div style={{ display: 'flex', gap: spacing['8'], marginTop: spacing['8'] }}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onClose}
            disabled={isSaving || isDeleting}
          >
            {t('money.sheet.inventory.cancel')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={submit}
            disabled={isSaving || isDeleting}
          >
            {isSaving ? t('money.sheet.inventory.saving') : t('money.sheet.inventory.save')}
          </Button>
        </div>

        {isEdit && onDelete ? (
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => setConfirmOpen(true)}
            disabled={isSaving || isDeleting}
            style={{ color: colors.error, marginTop: spacing['8'] }}
          >
            {isDeleting ? t('money.sheet.inventory.deleting') : t('money.sheet.inventory.delete')}
          </Button>
        ) : null}
        </div>
      </BottomSheet>

      <BottomSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('money.sheet.inventory.deleteConfirmTitle')}
      >
        <div style={{ fontSize: 14, color: colors.textSecondary, marginBottom: spacing['16'] }}>
          {t('money.sheet.inventory.deleteConfirmBody')}
        </div>
        <div style={{ display: 'flex', gap: spacing['8'] }}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => setConfirmOpen(false)}
            disabled={isDeleting}
          >
            {t('money.sheet.inventory.cancel')}
          </Button>
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting
              ? t('money.sheet.inventory.deleting')
              : t('money.sheet.inventory.deleteConfirmCta')}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
