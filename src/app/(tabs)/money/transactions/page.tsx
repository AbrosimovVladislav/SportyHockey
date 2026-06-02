'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { Skeleton } from '@/components/skeleton';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { TransactionCard, type TransactionCardLabels } from '@/components/transaction-card';
import {
  FinanceFilterBar,
  DEFAULT_FILTERS,
  matchesFilters,
  type FinanceFilters,
  type FinanceFilterLabels,
} from '@/components/finance-filter-bar';
import { DepositSheet, type DepositFormValue, type DepositInitial } from '@/components/finance-sheet/deposit-sheet';
import { ArenaSheet, type ArenaFormValue, type ArenaInitial } from '@/components/finance-sheet/arena-sheet';
import { RefundSheet, type RefundFormValue, type RefundInitial } from '@/components/finance-sheet/refund-sheet';
import { InventorySheet, type InventoryFormValue, type InventoryInitial } from '@/components/finance-sheet/inventory-sheet';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useMe } from '@/hooks/use-me';
import { useFinanceList } from '@/hooks/use-finance-list';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useEvents } from '@/hooks/use-events';
import { useVenues } from '@/hooks/use-venues';
import { useTeamBalance } from '@/hooks/use-team-balance';
import { useUpdateFinance } from '@/hooks/use-update-finance';
import { useDeleteFinance } from '@/hooks/use-delete-finance';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { FinanceTransaction } from '@/types/api';

// Депозит — это `player_payment` без привязки к событию (event === null).
function isDeposit(tx: FinanceTransaction): boolean {
  return tx.type === 'player_payment' && tx.event === null;
}

// Арена — расход с category='arena'. Привязка к событию обязательна, но
// для устаревших записей (созданных до итерации 51) event может быть null —
// фронт всё равно открывает sheet, чтобы можно было либо привязать событие,
// либо удалить такую запись.
function isArenaExpense(tx: FinanceTransaction): boolean {
  return tx.type === 'expense' && tx.category === 'arena';
}

// Возврат — финансовая операция type='refund'. Открывает RefundSheet.
function isRefund(tx: FinanceTransaction): boolean {
  return tx.type === 'refund';
}

// Покупка инвентаря и прочие расходы без события: всё, что осталось от
// expense'ов после исключения аренды.
function isInventoryExpense(tx: FinanceTransaction): boolean {
  return tx.type === 'expense' && tx.category !== 'arena';
}

// Все транзакции активной команды. Сортировка по `occurred_on desc, created_at desc`
// идёт с сервера. Фильтры — три плашки сверху, открывают bottomsheets:
// период (месяц или произвольный диапазон), направление (доход/расход), тип
// операции. Список группируется по дате (Сегодня / Вчера / 12 мая 2026).
export default function MoneyTransactionsPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader(colors.bg);
  const me = useMe();
  const hasTeam = (me.data?.memberships.length ?? 0) > 0;

  const [filters, setFilters] = useState<FinanceFilters>(DEFAULT_FILTERS);

  // Тап по карточке-депозиту/аренде/возврату/инвентарю открывает соответствующий
  // sheet в edit. Храним всю транзакцию целиком — из неё собирается initial при
  // mount'е sheet'а.
  const [editingDeposit, setEditingDeposit] = useState<FinanceTransaction | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [editingArena, setEditingArena] = useState<FinanceTransaction | null>(null);
  const [arenaError, setArenaError] = useState<string | null>(null);
  const [editingRefund, setEditingRefund] = useState<FinanceTransaction | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [editingInventory, setEditingInventory] = useState<FinanceTransaction | null>(null);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // На клиенте фильтруем — на PoC ленты сотни операций. Серверные фильтры в
  // /api/finance уже есть, переключим когда понадобится.
  const list = useFinanceList({ limit: 200 }, hasTeam);
  const membersQ = useTeamMembers();
  const eventsQ = useEvents();
  const venuesQ = useVenues();
  const balanceQ = useTeamBalance(hasTeam);
  const updateFinance = useUpdateFinance();
  const deleteFinance = useDeleteFinance();

  const cardLabels: TransactionCardLabels = useMemo(
    () => ({
      playerPayment: t('money.transactions.fallback.playerPayment'),
      deposit: t('money.transactions.fallback.deposit'),
      refund: t('money.transactions.fallback.refund'),
      adjustment: t('money.transactions.fallback.adjustment'),
      sub: {
        paymentForEvent: t('money.transactions.sub.paymentForEvent'),
        deposit: t('money.transactions.sub.deposit'),
        refund: t('money.transactions.sub.refund'),
        adjustment: t('money.transactions.sub.adjustment'),
        arena: t('money.transactions.sub.arena'),
        inventory: t('money.transactions.sub.inventory'),
        uniform: t('money.transactions.sub.uniform'),
        otherExpense: t('money.transactions.sub.otherExpense'),
      },
    }),
    [t],
  );

  const filterLabels: FinanceFilterLabels = useMemo(
    () => ({
      pillPeriod: t('money.filter.pill.period'),
      pillPeriodLast1m: t('money.filter.pill.period.last1m'),
      pillPeriodLast3m: t('money.filter.pill.period.last3m'),
      pillPeriodLast6m: t('money.filter.pill.period.last6m'),
      pillKind: t('money.filter.pill.kind'),
      pillType: t('money.filter.pill.type'),
      pillTypeFew: t('money.filter.pill.type.few'),
      pillTypeMany: t('money.filter.pill.type.many'),

      periodSheetTitle: t('money.filter.period.sheetTitle'),
      periodLast1m: t('money.filter.period.last1m'),
      periodLast3m: t('money.filter.period.last3m'),
      periodLast6m: t('money.filter.period.last6m'),
      periodRangeSection: t('money.filter.period.rangeSection'),
      periodFrom: t('money.filter.period.from'),
      periodTo: t('money.filter.period.to'),

      kindSheetTitle: t('money.filter.kind.sheetTitle'),
      kindSheetHint: t('money.filter.kind.sheetHint'),
      kindAll: t('money.filter.kind.all'),
      kindAllHint: t('money.filter.kind.allHint'),
      kindIncome: t('money.filter.kind.income'),
      kindIncomeHint: t('money.filter.kind.incomeHint'),
      kindExpense: t('money.filter.kind.expense'),
      kindExpenseHint: t('money.filter.kind.expenseHint'),

      typeSheetTitle: t('money.filter.type.sheetTitle'),
      typeSheetHint: t('money.filter.type.sheetHint'),
      typeGroupIncome: t('money.filter.type.groupIncome'),
      typeGroupExpense: t('money.filter.type.groupExpense'),
      typePayment: t('money.filter.type.payment'),
      typeDeposit: t('money.filter.type.deposit'),
      typeAdjustment: t('money.filter.type.adjustment'),
      typeArena: t('money.filter.type.arena'),
      typeInventory: t('money.filter.type.inventory'),
      typeUniform: t('money.filter.type.uniform'),
      typeRefund: t('money.filter.type.refund'),
      typeOther: t('money.filter.type.other'),

      reset: t('money.filter.reset'),
      apply: t('money.filter.apply'),
    }),
    [t],
  );

  const visible = useMemo(() => {
    const items = list.data?.items ?? [];
    return items.filter((tx) => matchesFilters(tx, filters));
  }, [list.data, filters]);

  // Группируем по дате (по `occurred_on`). Ключи — в порядке появления в массиве
  // (он уже отсортирован сервером по дате убывания).
  const groups = useMemo(() => groupByDay(visible), [visible]);

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };
  const sticky: CSSProperties = {
    position: 'sticky',
    top: 56,
    // НЕ задаём z-index: иначе sticky создаёт stacking-context, и position:fixed
    // bottomsheet'ов фильтра внутри уже не пробивается поверх bottom-nav. Без
    // z-index sticky не создаёт контекст; фон + border достаточно, чтобы блок
    // не сливался со скроллящимся под ним контентом.
    background: colors.bg,
    borderBottom: `1px solid ${colors.line}`,
  };
  const content: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
    padding: spacing['16'],
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/money');
  };

  // Из транзакции собираем initial для DepositSheet. Дефолт user_id —
  // пустая строка маловероятна, но fallback нужен (сервер не вернёт user==null
  // на player_payment без event, потому что у депозита user_id обязателен).
  const depositInitial: DepositInitial | null = editingDeposit
    ? {
        id: editingDeposit.id,
        user_id: editingDeposit.user?.user_id ?? '',
        amount: editingDeposit.amount,
        occurred_on: editingDeposit.occurred_on,
        description: editingDeposit.description,
      }
    : null;

  const handleDepositSubmit = (v: DepositFormValue) => {
    if (!editingDeposit) return;
    setDepositError(null);
    updateFinance.mutate(
      {
        id: editingDeposit.id,
        prev_user_id: editingDeposit.user?.user_id ?? null,
        patch: {
          amount: v.amount,
          user_id: v.user_id,
          occurred_on: v.occurred_on,
          description: v.description,
        },
      },
      {
        onSuccess: () => setEditingDeposit(null),
        onError: (e) => setDepositError(e.message),
      },
    );
  };

  const handleDepositDelete = () => {
    if (!editingDeposit) return;
    setDepositError(null);
    deleteFinance.mutate(
      {
        id: editingDeposit.id,
        user_id: editingDeposit.user?.user_id ?? null,
      },
      {
        onSuccess: () => setEditingDeposit(null),
        onError: (e) => setDepositError(e.message),
      },
    );
  };

  // Аренда: из транзакции собираем initial. event_id может быть null (для
  // старых записей до итерации 51) — sheet всё равно откроется, пользователь
  // выберет событие и пересохранит.
  const arenaInitial: ArenaInitial | null = editingArena
    ? {
        id: editingArena.id,
        event_id: editingArena.event?.id ?? null,
        amount: editingArena.amount,
        occurred_on: editingArena.occurred_on,
        description: editingArena.description,
      }
    : null;

  const handleArenaSubmit = (v: ArenaFormValue) => {
    if (!editingArena) return;
    setArenaError(null);
    updateFinance.mutate(
      {
        id: editingArena.id,
        patch: {
          amount: v.amount,
          event_id: v.event_id,
          occurred_on: v.occurred_on,
          description: v.description,
        },
      },
      {
        onSuccess: () => setEditingArena(null),
        onError: (e) => setArenaError(e.message),
      },
    );
  };

  const handleArenaDelete = () => {
    if (!editingArena) return;
    setArenaError(null);
    deleteFinance.mutate(
      { id: editingArena.id },
      {
        onSuccess: () => setEditingArena(null),
        onError: (e) => setArenaError(e.message),
      },
    );
  };

  // Возврат игроку (v0.5, итерация 52).
  const refundInitial: RefundInitial | null = editingRefund
    ? {
        id: editingRefund.id,
        user_id: editingRefund.user?.user_id ?? '',
        amount: editingRefund.amount,
        occurred_on: editingRefund.occurred_on,
        description: editingRefund.description,
      }
    : null;

  const handleRefundSubmit = (v: RefundFormValue) => {
    if (!editingRefund) return;
    setRefundError(null);
    updateFinance.mutate(
      {
        id: editingRefund.id,
        prev_user_id: editingRefund.user?.user_id ?? null,
        patch: {
          amount: v.amount,
          user_id: v.user_id,
          occurred_on: v.occurred_on,
          description: v.description,
        },
      },
      {
        onSuccess: () => setEditingRefund(null),
        onError: (e) => setRefundError(e.message),
      },
    );
  };

  const handleRefundDelete = () => {
    if (!editingRefund) return;
    setRefundError(null);
    deleteFinance.mutate(
      {
        id: editingRefund.id,
        user_id: editingRefund.user?.user_id ?? null,
      },
      {
        onSuccess: () => setEditingRefund(null),
        onError: (e) => setRefundError(e.message),
      },
    );
  };

  // Инвентарь и прочие расходы (v0.5, итерация 53). Аренда исключена — она
  // живёт в собственной шторке с picker'ом события.
  const inventoryInitial: InventoryInitial | null = editingInventory
    ? {
        id: editingInventory.id,
        category: editingInventory.category,
        amount: editingInventory.amount,
        occurred_on: editingInventory.occurred_on,
        description: editingInventory.description,
      }
    : null;

  const handleInventorySubmit = (v: InventoryFormValue) => {
    if (!editingInventory) return;
    setInventoryError(null);
    updateFinance.mutate(
      {
        id: editingInventory.id,
        patch: {
          amount: v.amount,
          category: v.category,
          occurred_on: v.occurred_on,
          description: v.description,
        },
      },
      {
        onSuccess: () => setEditingInventory(null),
        onError: (e) => setInventoryError(e.message),
      },
    );
  };

  const handleInventoryDelete = () => {
    if (!editingInventory) return;
    setInventoryError(null);
    deleteFinance.mutate(
      { id: editingInventory.id },
      {
        onSuccess: () => setEditingInventory(null),
        onError: (e) => setInventoryError(e.message),
      },
    );
  };

  return (
    <div style={root}>
      <LightHeader title={t('money.transactions.title')} onBack={onBack} />

      <div style={sticky}>
        <FinanceFilterBar filters={filters} onChange={setFilters} labels={filterLabels} />
      </div>

      <div style={content}>
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
          groups.map((g) => (
            <DateGroup key={g.day} title={dayHeading(g.day, t)}>
              {g.items.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  tx={tx}
                  labels={cardLabels}
                  onClick={
                    isDeposit(tx)
                      ? () => {
                          setDepositError(null);
                          setEditingDeposit(tx);
                        }
                      : isArenaExpense(tx)
                        ? () => {
                            setArenaError(null);
                            setEditingArena(tx);
                          }
                        : isRefund(tx)
                          ? () => {
                              setRefundError(null);
                              setEditingRefund(tx);
                            }
                          : isInventoryExpense(tx)
                            ? () => {
                                setInventoryError(null);
                                setEditingInventory(tx);
                              }
                            : undefined
                  }
                />
              ))}
            </DateGroup>
          ))
        )}
      </div>

      <DepositSheet
        open={editingDeposit !== null}
        onClose={() => setEditingDeposit(null)}
        mode="edit"
        initial={depositInitial}
        members={membersQ.data?.members ?? []}
        onSubmit={handleDepositSubmit}
        onDelete={handleDepositDelete}
        isSaving={updateFinance.isPending}
        isDeleting={deleteFinance.isPending}
        error={depositError}
      />

      <ArenaSheet
        open={editingArena !== null}
        onClose={() => setEditingArena(null)}
        mode="edit"
        initial={arenaInitial}
        events={eventsQ.data?.events ?? []}
        venues={venuesQ.data?.venues ?? []}
        availableOnHand={balanceQ.data?.breakdown.on_hand ?? null}
        onSubmit={handleArenaSubmit}
        onDelete={handleArenaDelete}
        isSaving={updateFinance.isPending}
        isDeleting={deleteFinance.isPending}
        error={arenaError}
      />

      <RefundSheet
        open={editingRefund !== null}
        onClose={() => setEditingRefund(null)}
        mode="edit"
        initial={refundInitial}
        members={membersQ.data?.members ?? []}
        availableOnHand={balanceQ.data?.breakdown.on_hand ?? null}
        onSubmit={handleRefundSubmit}
        onDelete={handleRefundDelete}
        isSaving={updateFinance.isPending}
        isDeleting={deleteFinance.isPending}
        error={refundError}
      />

      <InventorySheet
        open={editingInventory !== null}
        onClose={() => setEditingInventory(null)}
        mode="edit"
        initial={inventoryInitial}
        availableOnHand={balanceQ.data?.breakdown.on_hand ?? null}
        onSubmit={handleInventorySubmit}
        onDelete={handleInventoryDelete}
        isSaving={updateFinance.isPending}
        isDeleting={deleteFinance.isPending}
        error={inventoryError}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Локальные части страницы
// ─────────────────────────────────────────────────────────────────────────────

function DateGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        style={{
          ...typography.bodyBold,
          color: colors.text,
          margin: 0,
          marginBottom: spacing['8'],
        }}
      >
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>{children}</div>
    </section>
  );
}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={row} aria-hidden>
          <Skeleton width={80} height={14} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="35%" height={12} />
          </div>
          <Skeleton width={70} height={12} />
        </div>
      ))}
    </div>
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
// Группировка и форматирование дат
// ─────────────────────────────────────────────────────────────────────────────

type Group = { day: string; items: FinanceTransaction[] };

function groupByDay(items: FinanceTransaction[]): Group[] {
  const map = new Map<string, FinanceTransaction[]>();
  for (const it of items) {
    const key = it.occurred_on;
    const bucket = map.get(key);
    if (bucket) bucket.push(it);
    else map.set(key, [it]);
  }
  // Map сохраняет порядок вставки — сервер уже отсортировал по дате убывания.
  return Array.from(map.entries()).map(([day, list]) => ({ day, items: list }));
}

const MONTHS_LONG = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function dayHeading(occurredOn: string, t: ReturnType<typeof useT>): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(occurredOn);
  if (!m) return occurredOn;
  const y = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const txDay = new Date(y, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  if (sameYMD(txDay, today)) return t('money.transactions.group.today');
  if (sameYMD(txDay, yesterday)) return t('money.transactions.group.yesterday');

  const monthLabel = MONTHS_LONG[month - 1] ?? '';
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
