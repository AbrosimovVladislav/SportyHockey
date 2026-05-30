'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import {
  IconPerson,
  IconWallet,
  IconLocation,
  IconHockeyStick,
  IconShirt,
  IconTag,
  IconReset,
  IconBadgeCheck,
} from '@/components/icons';
import { formatSignedMoney } from '@/lib/format-money';
import { eventLabel } from '@/lib/event-label';
import type {
  FinancePartyUser,
  FinanceTransaction,
  FinanceTxType,
} from '@/types/api';

// Карточка одной транзакции на экране `/money/transactions`. Стилистика —
// производная от `PlayerFinanceTab` (см. `squad/[user_id]/finance-tab.tsx`):
//  иконка в кружке с тоном по доход/расход, заголовок «что это», подзаголовок
//  «кто/где», справа — сумма со знаком и дата.

export type TransactionCardLabels = {
  // Заголовки операций — что именно происходит:
  playerPayment: string; // «Оплата игрока»
  deposit: string; // «Депозит» (player_payment без event_id)
  adjustment: string; // «Корректировка баланса»
  refund: string; // «Возврат игроку»
  arena: string; // «Аренда»
  inventory: string; // «Инвентарь»
  uniform: string; // «Форма»
  other: string; // «Прочий расход»
  // Бейджи направления (показываются под заголовком мелким):
  incomeBadge: string; // «Доход»
  expenseBadge: string; // «Расход»
};

export type Direction = 'income' | 'expense';

type Props = {
  tx: FinanceTransaction;
  labels: TransactionCardLabels;
  onClick?: () => void;
};

export function TransactionCard({ tx, labels, onClick }: Props) {
  const direction = directionOf(tx.type);
  const tone = direction === 'income' ? 'positive' : 'negative';

  const amountColor = direction === 'income' ? colors.successDark : colors.errorDark;
  const signed = direction === 'income' ? tx.amount : -tx.amount;
  const title = titleFor(tx, labels);
  const subtitle = subtitleFor(tx);
  const badge = direction === 'income' ? labels.incomeBadge : labels.expenseBadge;
  const badgeColor = direction === 'income' ? colors.successDark : colors.errorDark;
  const badgeBg = direction === 'income' ? colors.successBg : colors.errorBg;

  const wrap: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['16'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: onClick ? 'pointer' : 'default',
    display: 'flex',
    gap: spacing['12'],
    alignItems: 'flex-start',
  };

  const content = (
    <>
      <RoundIcon tone={tone}>{iconFor(tx)}</RoundIcon>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            ...typography.bodyBold,
            color: colors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['6'], marginTop: 4 }}>
          <span
            style={{
              ...typography.caption,
              color: badgeColor,
              background: badgeBg,
              padding: `2px ${spacing['8']}px`,
              borderRadius: radius.pill,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {badge}
          </span>
          {subtitle ? (
            <span
              style={{
                ...typography.sm,
                color: colors.textSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </span>
          ) : null}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          flexShrink: 0,
          marginLeft: spacing['8'],
        }}
      >
        <span
          style={{
            ...typography.bodyBold,
            color: amountColor,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
          }}
        >
          {formatSignedMoney(signed)}
        </span>
        <span
          style={{
            ...typography.caption,
            color: colors.textTertiary,
            fontVariantNumeric: 'tabular-nums',
            marginTop: 2,
          }}
        >
          {formatShortDate(tx.occurred_on)}
        </span>
      </div>
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

export function directionOf(type: FinanceTxType): Direction {
  // adjustment отнесли к доходу: на PoC положительная сумма (organizer списывает долг
  // игрока без движения денег). Когда появятся отрицательные корректировки —
  // переработаем по знаку amount.
  return type === 'player_payment' || type === 'adjustment' ? 'income' : 'expense';
}

function RoundIcon({ children, tone }: { children: ReactNode; tone: 'positive' | 'negative' }) {
  const bg = tone === 'positive' ? colors.successBg : colors.errorBg;
  return (
    <span
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

function iconFor(tx: FinanceTransaction): ReactNode {
  const tone = directionOf(tx.type);
  const color = tone === 'income' ? colors.successDark : colors.errorDark;
  if (tx.type === 'player_payment') {
    return tx.event ? <IconPerson size={22} color={color} /> : <IconWallet size={22} color={color} />;
  }
  if (tx.type === 'refund') return <IconReset size={22} color={color} />;
  if (tx.type === 'adjustment') return <IconBadgeCheck size={22} color={color} />;
  switch (tx.category) {
    case 'arena':
      return <IconLocation size={22} color={color} />;
    case 'inventory':
      return <IconHockeyStick size={22} color={color} />;
    case 'uniform':
      return <IconShirt size={22} color={color} />;
    default:
      return <IconTag size={22} color={color} />;
  }
}

function titleFor(tx: FinanceTransaction, labels: TransactionCardLabels): string {
  if (tx.type === 'player_payment') {
    return tx.event ? labels.playerPayment : labels.deposit;
  }
  if (tx.type === 'refund') return labels.refund;
  if (tx.type === 'adjustment') return labels.adjustment;
  switch (tx.category) {
    case 'arena':
      return labels.arena;
    case 'inventory':
      return labels.inventory;
    case 'uniform':
      return labels.uniform;
    default:
      return labels.other;
  }
}

function subtitleFor(tx: FinanceTransaction): string {
  // Для оплаты с привязкой к событию — имя игрока + событие; депозит — имя игрока + description;
  // расход — description (как правило, поставщик: «Ледовый дворец», «Спортмастер»).
  const nameOrEmpty = tx.user ? nameOf(tx.user) : '';
  if (tx.type === 'player_payment') {
    if (tx.event) {
      const ev = eventLabel(tx.event);
      return nameOrEmpty ? `${nameOrEmpty} · ${ev}` : ev;
    }
    return nameOrEmpty || tx.description || '';
  }
  if (tx.type === 'refund' || tx.type === 'adjustment') {
    if (nameOrEmpty && tx.description) return `${nameOrEmpty} · ${tx.description}`;
    return nameOrEmpty || tx.description || '';
  }
  return tx.description ?? '';
}

function nameOf(u: FinancePartyUser): string {
  return [u.first_name, u.last_name].filter((s): s is string => Boolean(s)).join(' ').trim();
}

const MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];
function formatShortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, , monthStr, dayStr] = m;
  const month = MONTHS_SHORT[Number.parseInt(monthStr, 10) - 1] ?? '';
  return `${Number.parseInt(dayStr, 10)} ${month}`;
}
