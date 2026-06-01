'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { DarkHeader } from '@/components/dark-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { ListRow } from '@/components/list-row';
import { BalanceCard, BalanceCardSkeleton } from '@/components/balance-card';
import { QuickActionTile, quickActionForeground } from '@/components/quick-action-tile';
import {
  IconWallet,
  IconLocation,
  IconChart,
  IconPeople,
  IconFileText,
  IconStats,
} from '@/components/icons';
import { DepositSheet, type DepositFormValue } from '@/components/finance-sheet/deposit-sheet';
import { ArenaSheet, type ArenaFormValue } from '@/components/finance-sheet/arena-sheet';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useTeamBalance } from '@/hooks/use-team-balance';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useEvents } from '@/hooks/use-events';
import { useCreateFinance } from '@/hooks/use-create-finance';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

// Хаб раздела «Деньги» (v0.5, итерации 48 + 50 + 51): DarkHeader с фото арены,
// карточка-баланс с разбивкой, четыре быстрых действия 2×2 (Депозит,
// Аренда, Возврат, Инвентарь), переходы в четыре подэкрана. Оплата игрока
// за событие — только из экрана события, на хабе её нет.
//
// Итерация 50: «Депозит» открывает реальный bottomsheet.
// Итерация 51: «Аренда» открывает реальный bottomsheet (привязка к событию обязательна).
// Оставшиеся две плитки (Возврат, Инвентарь) пока ведут в `/money/soon` до итераций 52–53.
export default function MoneyPage() {
  const t = useT();
  const router = useRouter();
  const me = useMe();
  useTgHeader('#233F30');

  const hasTeam = (me.data?.memberships.length ?? 0) > 0;
  const balanceQ = useTeamBalance(hasTeam);
  const membersQ = useTeamMembers();
  const eventsQ = useEvents();
  const createFinance = useCreateFinance();

  const [depositOpen, setDepositOpen] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [arenaOpen, setArenaOpen] = useState(false);
  const [arenaError, setArenaError] = useState<string | null>(null);

  const handleDepositSubmit = (v: DepositFormValue) => {
    setDepositError(null);
    createFinance.mutate(
      {
        type: 'player_payment',
        amount: v.amount,
        user_id: v.user_id,
        occurred_on: v.occurred_on,
        description: v.description,
      },
      {
        onSuccess: () => setDepositOpen(false),
        onError: (e) => setDepositError(e.message),
      },
    );
  };

  const handleArenaSubmit = (v: ArenaFormValue) => {
    setArenaError(null);
    createFinance.mutate(
      {
        type: 'expense',
        category: 'arena',
        amount: v.amount,
        event_id: v.event_id,
        occurred_on: v.occurred_on,
        description: v.description,
      },
      {
        onSuccess: () => setArenaOpen(false),
        onError: (e) => setArenaError(e.message),
      },
    );
  };

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };

  const sheet: CSSProperties = {
    background: colors.bg,
    borderRadius: '24px 24px 0 0',
    marginTop: -12,
    position: 'relative',
    zIndex: 2,
    minHeight: `calc(100dvh - ${BOTTOM_NAV_HEIGHT}px - 140px)`,
    padding: `${spacing['16']}px ${spacing['16']}px ${BOTTOM_NAV_HEIGHT + spacing['24']}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['20'],
  };

  return (
    <div style={root}>
      <DarkHeader title={t('money.title')} imageSrc="/money.png" />
      <div style={sheet}>
        {!hasTeam && me.isSuccess ? (
          <EmptyTeam title={t('money.empty.noTeam.title')} body={t('money.empty.noTeam.body')} />
        ) : (
          <>
            {balanceQ.isLoading || balanceQ.isPending ? (
              <BalanceCardSkeleton />
            ) : balanceQ.isError || !balanceQ.data ? (
              <ErrorCard text={t('common.error')} />
            ) : (
              <BalanceCard
                total={balanceQ.data.total}
                breakdown={balanceQ.data.breakdown}
                title={t('money.balance.title')}
                labels={{
                  on_hand: t('money.balance.onHand'),
                  arenas_this_month: t('money.balance.arenasThisMonth'),
                  overpayments: t('money.balance.overpayments'),
                  debts: t('money.balance.debts'),
                }}
              />
            )}

            <SectionBlock title={t('money.actions.title')}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: spacing['10'],
                }}
              >
                <QuickActionTile
                  tone="positive"
                  icon={<IconWallet size={22} color={quickActionForeground('positive')} />}
                  label={t('money.actions.deposit')}
                  onClick={() => {
                    setDepositError(null);
                    setDepositOpen(true);
                  }}
                />
                <QuickActionTile
                  tone="negative"
                  icon={<IconLocation size={22} color={quickActionForeground('negative')} />}
                  label={t('money.actions.arena')}
                  onClick={() => {
                    setArenaError(null);
                    setArenaOpen(true);
                  }}
                />
                <QuickActionTile
                  tone="negative"
                  icon={<IconReturn size={22} color={quickActionForeground('negative')} />}
                  label={t('money.actions.refund')}
                  onClick={() => router.push('/money/soon?title=money.actions.refund')}
                />
                <QuickActionTile
                  tone="negative"
                  icon={<IconBox size={22} color={quickActionForeground('negative')} />}
                  label={t('money.actions.inventory')}
                  onClick={() => router.push('/money/soon?title=money.actions.inventory')}
                />
              </div>
            </SectionBlock>

            <SectionBlock title={t('money.sections.title')}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
                <ListRow
                  icon={<IconChart size={22} color={colors.iconFg} />}
                  title={t('money.sections.report.title')}
                  subtitle={t('money.sections.report.subtitle')}
                  onClick={() =>
                    router.push('/money/soon?title=money.sections.report.title')
                  }
                />
                <ListRow
                  icon={<IconPeople size={22} color={colors.iconFg} />}
                  title={t('money.sections.players.title')}
                  subtitle={t('money.sections.players.subtitle')}
                  onClick={() => router.push('/money/players')}
                />
                <ListRow
                  icon={<IconFileText size={22} color={colors.iconFg} />}
                  title={t('money.sections.transactions.title')}
                  subtitle={t('money.sections.transactions.subtitle')}
                  onClick={() => router.push('/money/transactions')}
                />
                <ListRow
                  icon={<IconStats size={22} color={colors.iconFg} />}
                  title={t('money.sections.analytics.title')}
                  subtitle={t('money.sections.analytics.subtitle')}
                  onClick={() =>
                    router.push('/money/soon?title=money.sections.analytics.title')
                  }
                />
              </div>
            </SectionBlock>
          </>
        )}
      </div>

      <DepositSheet
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        mode="create"
        initial={null}
        members={membersQ.data?.members ?? []}
        onSubmit={handleDepositSubmit}
        isSaving={createFinance.isPending}
        error={depositError}
      />

      <ArenaSheet
        open={arenaOpen}
        onClose={() => setArenaOpen(false)}
        mode="create"
        initial={null}
        events={eventsQ.data?.events ?? []}
        onSubmit={handleArenaSubmit}
        isSaving={createFinance.isPending}
        error={arenaError}
      />
    </div>
  );
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        style={{
          ...typography.h3,
          color: colors.text,
          margin: 0,
          marginBottom: spacing['10'],
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ErrorCard({ text }: { text: string }) {
  const css: CSSProperties = {
    background: colors.errorBg,
    color: colors.errorText,
    borderRadius: radius.lg,
    padding: spacing['16'],
    textAlign: 'center',
    ...typography.sm,
  };
  return <div style={css}>{text}</div>;
}

function EmptyTeam({ title, body }: { title: string; body: string }) {
  const wrap: CSSProperties = {
    background: colors.bgWarm,
    borderRadius: radius.lg,
    padding: `${spacing['32']}px ${spacing['16']}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['8'],
    minHeight: 200,
    textAlign: 'center',
  };
  return (
    <div style={wrap}>
      <span style={{ ...typography.bodyBold, color: colors.text }}>{title}</span>
      <span style={{ ...typography.sm, color: colors.textSecondary, maxWidth: 280 }}>{body}</span>
    </div>
  );
}

// Inline-иконки для quick-action плиток «Возврат» и «Инвентарь». В общую
// icons.tsx вынесем когда понадобятся в других местах (sheet'ы из итераций
// 52–53 будут использовать те же символы).
function IconReturn({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 5 5v3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBox({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7l9-4 9 4M3 7v10l9 4 9-4V7M3 7l9 4 9-4M12 11v10"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
