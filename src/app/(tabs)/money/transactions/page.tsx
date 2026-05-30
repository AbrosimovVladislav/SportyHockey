'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { ContentTabs } from '@/components/content-tabs';
import { FilterChips } from '@/components/filter-chips';
import { Skeleton } from '@/components/skeleton';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import {
  TransactionCard,
  directionOf,
  type TransactionCardLabels,
} from '@/components/transaction-card';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useMe } from '@/hooks/use-me';
import { useFinanceList } from '@/hooks/use-finance-list';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import type { FinanceTransaction } from '@/types/api';

// Все транзакции активной команды. Сортировка по `occurred_on` desc
// идёт с сервера. Фильтры — на клиенте: сегмент «Все/Доходы/Расходы»
// сужает направление, чипы — конкретный «слайс» (Оплата, Депозит,
// Аренда, Инвентарь, Форма, Возврат, Корректировка, Прочее).

type KindTab = 'all' | 'income' | 'expense';

// Слайс — это конкретный «вид» операции для UI-чипов. Один слайс может
// объединять условия по type+category+event_id (например, «Депозит» — это
// player_payment без event_id). Маппинг — в `sliceOf` ниже.
type Slice =
  | 'all'
  | 'payment'
  | 'deposit'
  | 'adjustment'
  | 'arena'
  | 'inventory'
  | 'uniform'
  | 'refund'
  | 'other';

const ALL_SLICES: Slice[] = ['all', 'payment', 'deposit', 'adjustment', 'arena', 'inventory', 'uniform', 'refund', 'other'];
const INCOME_SLICES: Slice[] = ['all', 'payment', 'deposit', 'adjustment'];
const EXPENSE_SLICES: Slice[] = ['all', 'arena', 'inventory', 'uniform', 'refund', 'other'];

export default function MoneyTransactionsPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader(colors.bg);
  const me = useMe();
  const hasTeam = (me.data?.memberships.length ?? 0) > 0;

  const [kind, setKind] = useState<KindTab>('all');
  const [slice, setSlice] = useState<Slice>('all');

  // На клиенте фильтруем — кол-во операций PoC-команды редко превышает сотни.
  // Когда понадобится — добавим серверные фильтры в /api/finance.
  const list = useFinanceList({ limit: 200 }, hasTeam);

  const labels: TransactionCardLabels = useMemo(
    () => ({
      playerPayment: t('money.transactions.type.player_payment'),
      deposit: t('money.transactions.type.deposit'),
      adjustment: t('money.transactions.type.adjustment'),
      refund: t('money.transactions.type.refund'),
      arena: t('money.transactions.type.arena'),
      inventory: t('money.transactions.type.inventory'),
      uniform: t('money.transactions.type.uniform'),
      other: t('money.transactions.type.other'),
      incomeBadge: t('money.transactions.kindLabel.income'),
      expenseBadge: t('money.transactions.kindLabel.expense'),
    }),
    [t],
  );

  const sliceOptions = useMemo(() => {
    const ids = kind === 'income' ? INCOME_SLICES : kind === 'expense' ? EXPENSE_SLICES : ALL_SLICES;
    return ids.map((id) => ({ id, label: sliceLabel(id, t) }));
  }, [kind, t]);

  const visible = useMemo(() => {
    const items = list.data?.items ?? [];
    return items.filter((tx) => {
      if (kind !== 'all' && directionOf(tx.type) !== kind) return false;
      if (slice !== 'all' && sliceOf(tx) !== slice) return false;
      return true;
    });
  }, [list.data, kind, slice]);

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bgOffWhite };
  const sticky: CSSProperties = {
    position: 'sticky',
    top: 56,
    zIndex: 4,
    background: colors.bg,
    borderBottom: `1px solid ${colors.line}`,
  };
  const listWrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['10'],
    padding: spacing['16'],
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  return (
    <div style={root}>
      <LightHeader title={t('money.transactions.title')} onBack={() => router.push('/money')} />

      <div style={sticky}>
        <ContentTabs
          tabs={[
            { id: 'all', label: t('money.transactions.kind.all') },
            { id: 'income', label: t('money.transactions.kind.income') },
            { id: 'expense', label: t('money.transactions.kind.expense') },
          ]}
          activeId={kind}
          onChange={(id) => {
            setKind(id as KindTab);
            setSlice('all'); // сброс гранулярного фильтра при смене сегмента
          }}
        />
        <FilterChips
          compact
          options={sliceOptions}
          activeId={slice}
          onChange={(id) => setSlice(id as Slice)}
        />
      </div>

      <div style={listWrap}>
        {!hasTeam && me.isSuccess ? (
          <EmptyBlock
            title={t('money.empty.noTeam.title')}
            body={t('money.empty.noTeam.body')}
          />
        ) : list.isLoading || list.isPending ? (
          <ListSkeleton />
        ) : list.isError || !list.data ? (
          <ErrorCard text={t('common.error')} />
        ) : visible.length === 0 ? (
          <EmptyBlock
            title={
              (list.data.items.length ?? 0) === 0
                ? t('money.transactions.empty')
                : t('money.transactions.emptyFiltered')
            }
          />
        ) : (
          visible.map((tx) => <TransactionCard key={tx.id} tx={tx} labels={labels} />)
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Локальные части страницы
// ─────────────────────────────────────────────────────────────────────────────

function ListSkeleton() {
  const row: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['16'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
  };
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={row} aria-hidden>
          <Skeleton width={44} height={44} borderRadius="50%" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="35%" height={12} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: spacing['6'] }}>
            <Skeleton width={70} height={14} />
            <Skeleton width={48} height={11} />
          </div>
        </div>
      ))}
    </>
  );
}

function ErrorCard({ text }: { text: string }) {
  return (
    <div
      style={{
        background: colors.errorBg,
        color: colors.errorText,
        borderRadius: radius.lg,
        padding: spacing['16'],
        textAlign: 'center',
        ...typography.sm,
      }}
    >
      {text}
    </div>
  );
}

function EmptyBlock({ title, body }: { title: string; body?: string }) {
  return (
    <div
      style={{
        background: colors.bgWarm,
        borderRadius: radius.lg,
        padding: `${spacing['32']}px ${spacing['16']}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing['8'],
        textAlign: 'center',
      }}
    >
      <span style={{ ...typography.bodyBold, color: colors.text }}>{title}</span>
      {body ? (
        <span style={{ ...typography.sm, color: colors.textSecondary, maxWidth: 280 }}>{body}</span>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Маппинг операции в Slice и i18n-лейбл слайса
// ─────────────────────────────────────────────────────────────────────────────

function sliceOf(tx: FinanceTransaction): Slice {
  if (tx.type === 'player_payment') return tx.event ? 'payment' : 'deposit';
  if (tx.type === 'adjustment') return 'adjustment';
  if (tx.type === 'refund') return 'refund';
  // expense
  switch (tx.category) {
    case 'arena':
      return 'arena';
    case 'inventory':
      return 'inventory';
    case 'uniform':
      return 'uniform';
    default:
      return 'other';
  }
}

function sliceLabel(s: Slice, t: ReturnType<typeof useT>): string {
  switch (s) {
    case 'all':
      return t('money.transactions.type.all');
    case 'payment':
      return t('money.transactions.type.player_payment');
    case 'deposit':
      return t('money.transactions.type.deposit');
    case 'adjustment':
      return t('money.transactions.type.adjustment');
    case 'arena':
      return t('money.transactions.type.arena');
    case 'inventory':
      return t('money.transactions.type.inventory');
    case 'uniform':
      return t('money.transactions.type.uniform');
    case 'refund':
      return t('money.transactions.type.refund');
    case 'other':
      return t('money.transactions.type.other');
  }
}
