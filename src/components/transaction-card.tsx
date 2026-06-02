'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Avatar } from '@/components/avatar';
import {
  IconHome,
  IconArchive,
  IconShirt,
  IconFileText,
  IconWallet,
  IconBack,
  IconSettings,
} from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { formatSignedMoney } from '@/lib/format-money';
import { formatTime, formatEventDateRange } from '@/lib/event-format';
import { eventLabel } from '@/lib/event-label';
import type { FinancePartyUser, FinanceTransaction, FinanceTxType } from '@/types/api';

// Карточка одной операции на экране `/money/transactions`.
// Layout по референсу: слева крупно сумма с цветом по направлению, далее
// медиа-кружок (аватар игрока или цветная иконка-плашка категории), в центре
// заголовок (имя игрока или описание расхода) + подзаголовок (тип/событие),
// справа — время.

export type TransactionCardLabels = {
  // Заголовки для операций без явного имени игрока / описания (fallback):
  playerPayment: string; // «Оплата игрока»
  deposit: string; // «Депозит от клуба» — title для player_payment без event и без user
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
  const timeText = tx.created_at ? formatTime(tx.created_at) : '';

  const wrap: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: `${spacing['12']}px ${spacing['16']}px`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: onClick ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
  };

  // Сумма прижата к аватару (`gap` маленький) — иначе между ними образуется
  // лишняя «дыра», как было замечено на ревью.
  const amountStyle: CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: amountColor,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.01em',
    flexShrink: 0,
    marginRight: -spacing['4'],
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

  const timeColumn: CSSProperties = {
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
      <TransactionMedia tx={tx} />
      <div style={middle}>
        <div style={titleStyle}>{title}</div>
        {subtitle ? <div style={subtitleStyle}>{subtitle}</div> : null}
      </div>
      <span style={timeColumn}>{timeText}</span>
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
// Медиа-слот: аватар игрока (если есть `user`) или цветная иконка-плашка
// категории. Размер 40px, всегда круглый, между суммой и заголовком.
// ─────────────────────────────────────────────────────────────────────────────

function TransactionMedia({ tx }: { tx: FinanceTransaction }) {
  if (tx.user) {
    // Порядок важен: `avatar_url` — загруженный пользователем кроп, `photo_url` —
    // устаревшее TG-фото. Всегда avatar_url первым.
    const src = tx.user.avatar_url ?? tx.user.photo_url;
    return <Avatar src={src} name={nameOf(tx.user)} size={40} />;
  }
  const { bg, fg, icon } = iconForTx(tx);
  return <IconBadge bg={bg} fg={fg} icon={icon} />;
}

function IconBadge({ bg, fg, icon }: { bg: string; fg: string; icon: ReactNode }) {
  const wrap: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: bg,
    color: fg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  return <span style={wrap} aria-hidden>{icon}</span>;
}

// Для безъюзеровых операций маппим в (фон, цвет, иконку).
function iconForTx(tx: FinanceTransaction): { bg: string; fg: string; icon: ReactNode } {
  const size = 20;
  if (tx.type === 'player_payment') {
    // Без user — это «депозит от клуба/команды» (бухгалтерская проводка).
    return {
      bg: colors.mediaDepositBg,
      fg: colors.mediaDepositFg,
      icon: <IconWallet size={size} color="currentColor" />,
    };
  }
  if (tx.type === 'refund') {
    return {
      bg: colors.mediaRefundBg,
      fg: colors.mediaRefundFg,
      icon: <IconBack size={size} color="currentColor" />,
    };
  }
  if (tx.type === 'adjustment') {
    return {
      bg: colors.mediaDepositBg,
      fg: colors.mediaDepositFg,
      icon: <IconSettings size={size} color="currentColor" />,
    };
  }
  // expense — по category.
  switch (tx.category) {
    case 'arena':
      return {
        bg: colors.mediaArenaBg,
        fg: colors.mediaArenaFg,
        icon: <IconHome size={size} color="currentColor" />,
      };
    case 'inventory':
      return {
        bg: colors.mediaInventoryBg,
        fg: colors.mediaInventoryFg,
        icon: <IconArchive size={size} color="currentColor" />,
      };
    case 'uniform':
      return {
        bg: colors.mediaUniformBg,
        fg: colors.mediaUniformFg,
        icon: <IconShirt size={size} color="currentColor" />,
      };
    default:
      return {
        bg: colors.mediaOtherBg,
        fg: colors.mediaOtherFg,
        icon: <IconFileText size={size} color="currentColor" />,
      };
  }
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
      const ev = eventLabel(tx.event);
      const sub = labels.sub.paymentForEvent.replace('{event}', ev);
      return { title: name || labels.playerPayment, subtitle: sub };
    }
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
  // Для аренды дописываем в подпись событие + дату/время, чтобы было видно,
  // за какой матч/тренировку платили. Если события нет (legacy-запись) —
  // оставляем чистую «Аренда».
  if (tx.category === 'arena' && tx.event) {
    const ev = eventLabel(tx.event);
    const when = formatEventDateRange(tx.event.starts_at, null);
    return { title: tx.description ?? catSub, subtitle: `${catSub} · ${ev} · ${when}` };
  }
  return { title: tx.description ?? catSub, subtitle: catSub };
}

function nameOf(u: FinancePartyUser): string {
  return [u.first_name, u.last_name].filter((s): s is string => Boolean(s)).join(' ').trim();
}
