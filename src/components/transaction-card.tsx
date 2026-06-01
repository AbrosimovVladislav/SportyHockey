'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { formatSignedMoney } from '@/lib/format-money';
import { formatTime } from '@/lib/event-format';
import { eventLabel } from '@/lib/event-label';
import type { FinancePartyUser, FinanceTransaction, FinanceTxType } from '@/types/api';

// Карточка одной операции на экране `/money/transactions`. Без иконок —
// layout по референсу: слева крупно сумма с цветом по направлению,
// в центре заголовок (имя игрока или название расхода) + подзаголовок
// (тип/событие), справа — относительная дата и время.

export type TransactionCardLabels = {
  // Заголовки для операций без явного имени игрока / описания (fallback):
  playerPayment: string; // «Оплата игрока»
  deposit: string; // «Депозит игрока» — title для player_payment без event и без user
  refund: string; // «Возврат игроку»
  adjustment: string; // «Корректировка»
  // Подзаголовки операций (то, что под крупным title):
  sub: {
    paymentForEvent: string; // «{event} · Сборы»  ({event} подставляется)
    deposit: string; // «Депозит»
    refund: string; // «Возврат»
    adjustment: string; // «Корректировка»
    arena: string; // «Аренда»
    inventory: string; // «Инвентарь»
    uniform: string; // «Форма»
    otherExpense: string; // «Расход»
  };
  // Относительная дата на правой стороне:
  today: string; // «Сегодня»
  yesterday: string; // «Вчера»
};

type Props = {
  tx: FinanceTransaction;
  labels: TransactionCardLabels;
  onClick?: () => void;
};

export function TransactionCard({ tx, labels, onClick }: Props) {
  const direction = directionOf(tx.type);
  const amountColor = direction === 'income' ? colors.successDark : colors.errorDark;
  const signed = direction === 'income' ? tx.amount : -tx.amount;

  const { title, subtitle } = headForTx(tx, labels);
  const dateText = formatRelativeDate(tx.occurred_on, labels);
  const timeText = tx.created_at ? formatTime(tx.created_at) : '';

  const wrap: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: `${spacing['16']}px ${spacing['16']}px`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: onClick ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
  };

  const amountStyle: CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: amountColor,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.01em',
    flexShrink: 0,
    minWidth: 96,
  };

  const middle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const dateColumn: CSSProperties = {
    ...typography.sm,
    color: colors.textSecondary,
    flexShrink: 0,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  };

  const content = (
    <>
      <span style={amountStyle}>{formatSignedMoney(signed)}</span>
      <div style={middle}>
        <div style={titleStyle}>{title}</div>
        {subtitle ? <div style={subtitleStyle}>{subtitle}</div> : null}
      </div>
      <span style={dateColumn}>{timeText ? `${dateText}, ${timeText}` : dateText}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="pressable" onClick={onClick} style={wrap}>
        {content}
      </button>
    );
  }
  return <div style={wrap}>{content}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export type Direction = 'income' | 'expense';

export function directionOf(type: FinanceTxType): Direction {
  // adjustment относим к доходам — на PoC сумма всегда положительная
  // (организатор списывает долг игрока). Когда появятся отрицательные
  // корректировки — перейдём на знак amount.
  return type === 'player_payment' || type === 'adjustment' ? 'income' : 'expense';
}

function headForTx(
  tx: FinanceTransaction,
  labels: TransactionCardLabels,
): { title: string; subtitle: string } {
  if (tx.type === 'player_payment') {
    const name = tx.user ? nameOf(tx.user) : '';
    if (tx.event) {
      // «Иван Иванов» / «Тренировка · Сборы»
      const ev = eventLabel(tx.event);
      const sub = labels.sub.paymentForEvent.replace('{event}', ev);
      return { title: name || labels.playerPayment, subtitle: sub };
    }
    // Депозит — имя игрока сверху, "Депозит" снизу
    return { title: name || labels.deposit, subtitle: labels.sub.deposit };
  }
  if (tx.type === 'refund') {
    const name = tx.user ? nameOf(tx.user) : '';
    return { title: name || labels.refund, subtitle: labels.sub.refund };
  }
  if (tx.type === 'adjustment') {
    const name = tx.user ? nameOf(tx.user) : '';
    return { title: name || labels.adjustment, subtitle: labels.sub.adjustment };
  }
  // expense — title = description (например, «Большая арена»), subtitle = категория
  const catSub =
    tx.category === 'arena'
      ? labels.sub.arena
      : tx.category === 'inventory'
        ? labels.sub.inventory
        : tx.category === 'uniform'
          ? labels.sub.uniform
          : labels.sub.otherExpense;
  return { title: tx.description ?? catSub, subtitle: catSub };
}

function nameOf(u: FinancePartyUser): string {
  return [u.first_name, u.last_name].filter((s): s is string => Boolean(s)).join(' ').trim();
}

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

// «Сегодня» / «Вчера» / «12 мая» / «12 мая 2026» — последний вариант, если
// год отличается от текущего.
function formatRelativeDate(occurredOn: string, labels: TransactionCardLabels): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(occurredOn);
  if (!m) return occurredOn;
  const [, yearStr, monthStr, dayStr] = m;
  const y = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const txDay = new Date(y, month - 1, day);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  if (sameYMD(txDay, today)) return labels.today;
  if (sameYMD(txDay, yesterday)) return labels.yesterday;

  const monthLabel = MONTHS_SHORT[month - 1] ?? '';
  if (y === today.getFullYear()) return `${day} ${monthLabel}`;
  return `${day} ${monthLabel} ${y}`;
}

function sameYMD(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
