'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import {
  IconPerson,
  IconLocation,
  IconHockeyStick,
  IconShirt,
  IconTag,
  IconReset,
  IconBadgeCheck,
} from '@/components/icons';
import { formatSignedMoney } from '@/lib/format-money';
import type {
  FinanceExpenseCategory,
  FinancePartyUser,
  FinanceTransaction,
  FinanceTxType,
} from '@/types/api';
import { eventLabel } from '@/lib/event-label';

function nameOf(u: FinancePartyUser): string {
  const joined = [u.first_name, u.last_name].filter((s): s is string => Boolean(s)).join(' ').trim();
  return joined;
}

// Строка одной транзакции в ленте «Последние операции» (а также в будущем
// `/money/transactions`). Иконка + двух-строчное описание + сумма со знаком.

type Props = {
  tx: FinanceTransaction;
  // Тексты — приходят сверху, чтобы компонент оставался i18n-агностичным.
  labels: FinanceRowLabels;
  onClick?: () => void;
};

export type FinanceRowLabels = {
  // Заголовки типов:
  playerPayment: string; // «Оплата игрока»
  deposit: string; // «Депозит игрока» (player_payment без event_id)
  refund: string; // «Возврат игроку»
  adjustment: string; // «Корректировка баланса»
  // Категории расходов:
  expense: {
    arena: string;
    inventory: string;
    uniform: string;
    other: string;
  };
};

export function FinanceRow({ tx, labels, onClick }: Props) {
  const interactive = !!onClick;
  const direction = txDirection(tx.type);
  const amountColor =
    direction === 'in' ? colors.successDark : direction === 'out' ? colors.errorDark : colors.text;
  const signedAmount = direction === 'in' ? tx.amount : direction === 'out' ? -tx.amount : tx.amount;

  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['12']}px ${spacing['12']}px`,
    background: colors.bg,
    borderRadius: radius.md,
    border: 'none',
    width: '100%',
    cursor: interactive ? 'pointer' : 'default',
    textAlign: 'left',
    color: colors.text,
  };

  const iconBox: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: iconBackground(tx),
    color: iconForeground(tx),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const titleStyle: CSSProperties = {
    ...typography.bodyBold,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const subtitleStyle: CSSProperties = {
    ...typography.sm,
    color: colors.textSecondary,
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const amountStyle: CSSProperties = {
    ...typography.bodyBold,
    color: amountColor,
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
    marginLeft: spacing['8'],
  };

  const dateStyle: CSSProperties = {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  };

  const content = (
    <>
      <span style={iconBox} aria-hidden>
        {iconFor(tx)}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={titleStyle}>{titleFor(tx, labels)}</div>
        <div style={subtitleStyle}>{subtitleFor(tx)}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={amountStyle}>{formatSignedMoney(signedAmount)}</span>
        <span style={dateStyle}>{formatShortDate(tx.occurred_on)}</span>
      </div>
    </>
  );

  if (interactive) {
    return (
      <button type="button" onClick={onClick} className="pressable" style={wrap}>
        {content}
      </button>
    );
  }
  return <div style={wrap}>{content}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

function txDirection(type: FinanceTxType): 'in' | 'out' | 'neutral' {
  if (type === 'player_payment') return 'in';
  if (type === 'expense' || type === 'refund') return 'out';
  // adjustment — нейтрально по знаку (на PoC всегда положительная сумма списания долга,
  // но визуально не «доход» команды, а лишь корректировка).
  return 'neutral';
}

function iconFor(tx: FinanceTransaction): ReactNode {
  if (tx.type === 'player_payment') return <IconPerson size={20} />;
  if (tx.type === 'refund') return <IconReset size={20} />;
  if (tx.type === 'adjustment') return <IconBadgeCheck size={20} />;
  // expense — по категории
  switch (tx.category) {
    case 'arena':
      return <IconLocation size={20} />;
    case 'inventory':
      return <IconHockeyStick size={20} />;
    case 'uniform':
      return <IconShirt size={20} />;
    default:
      return <IconTag size={20} />;
  }
}

function iconBackground(tx: FinanceTransaction): string {
  const d = txDirection(tx.type);
  if (d === 'in') return colors.successBg;
  if (d === 'out') return colors.errorBg;
  return colors.bgMuted;
}

function iconForeground(tx: FinanceTransaction): string {
  const d = txDirection(tx.type);
  if (d === 'in') return colors.successDark;
  if (d === 'out') return colors.errorDark;
  return colors.text;
}

function titleFor(tx: FinanceTransaction, labels: FinanceRowLabels): string {
  if (tx.type === 'player_payment') {
    if (!tx.event && !tx.user) return labels.deposit;
    if (tx.user) {
      const name = nameOf(tx.user) || labels.playerPayment;
      // Депозит игрока — оплата без события.
      return tx.event ? name : `${name} · ${labels.deposit}`;
    }
    return labels.playerPayment;
  }
  if (tx.type === 'refund') {
    const name = tx.user ? nameOf(tx.user) : '';
    return name ? `${labels.refund} · ${name}` : labels.refund;
  }
  if (tx.type === 'adjustment') {
    const name = tx.user ? nameOf(tx.user) : '';
    return name ? `${labels.adjustment} · ${name}` : labels.adjustment;
  }
  // expense — по категории
  return labels.expense[tx.category ?? 'other'] ?? labels.expense.other;
}

function subtitleFor(tx: FinanceTransaction): string {
  // У оплаты с событием — название события; у депозита/расхода — description.
  if (tx.event) return eventLabel(tx.event);
  return tx.description ?? '';
}

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

function formatShortDate(iso: string): string {
  // iso ожидаем формата YYYY-MM-DD (occurred_on хранится как date).
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, , monthStr, dayStr] = m;
  const month = MONTHS_SHORT[Number.parseInt(monthStr, 10) - 1] ?? '';
  return `${Number.parseInt(dayStr, 10)} ${month}`;
}

// Категории расходов в человеческой форме — экспорт под общий ru-словарь.
// Объявляем здесь же, чтобы не плодить ещё одну точку правды на компонент;
// страница хаба собирает FinanceRowLabels из этого и i18n-ключей.
export type FinanceCategoryEnum = FinanceExpenseCategory;
