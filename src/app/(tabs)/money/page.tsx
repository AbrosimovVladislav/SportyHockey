'use client';

import { useRouter } from 'next/navigation';
import { useMemo, type CSSProperties } from 'react';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { ListRow } from '@/components/list-row';
import { BalanceCard, BalanceCardSkeleton } from '@/components/balance-card';
import { QuickActionTile, quickActionForeground } from '@/components/quick-action-tile';
import { FinanceRow, type FinanceRowLabels } from '@/components/finance-row';
import { Skeleton } from '@/components/skeleton';
import {
  IconPerson,
  IconWallet,
  IconChart,
  IconPeople,
  IconFileText,
  IconStats,
} from '@/components/icons';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useTeamBalance } from '@/hooks/use-team-balance';
import { useFinanceList } from '@/hooks/use-finance-list';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

// Хаб раздела «Деньги» (v0.5, итерация 48): баланс с разбивкой, три быстрых
// действия, переходы в подэкраны (срез / балансы / операции / аналитика)
// и лента последних операций. Подэкраны и боттомшиты ввода — в итерациях 49–54.
export default function MoneyPage() {
  const t = useT();
  const router = useRouter();
  const me = useMe();
  useTgHeader(colors.bg);

  const hasTeam = (me.data?.memberships.length ?? 0) > 0;
  const balanceQ = useTeamBalance(hasTeam);
  const recentQ = useFinanceList({ limit: 6 }, hasTeam);

  const rowLabels: FinanceRowLabels = useMemo(
    () => ({
      playerPayment: t('money.row.playerPayment'),
      deposit: t('money.row.deposit'),
      refund: t('money.row.refund'),
      adjustment: t('money.row.adjustment'),
      expense: {
        arena: t('money.row.category.arena'),
        inventory: t('money.row.category.inventory'),
        uniform: t('money.row.category.uniform'),
        other: t('money.row.category.other'),
      },
    }),
    [t],
  );

  const root: CSSProperties = {
    minHeight: '100dvh',
    background: colors.bgOffWhite,
  };
  const inner: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['20'],
    padding: spacing['16'],
    paddingTop: `calc(${spacing['12']}px + var(--app-safe-top))`,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };
  const title: CSSProperties = {
    ...typography.h1,
    color: colors.text,
    margin: 0,
  };

  // Если пользователь не в команде — рендерим объяснение вместо баланса.
  // Соблюдаем тот же каркас (заголовок наверху), чтобы не «прыгало».
  if (me.isSuccess && !hasTeam) {
    return (
      <div style={root}>
        <div style={inner}>
          <h1 style={title}>{t('money.title')}</h1>
          <EmptyTeam title={t('money.empty.noTeam.title')} body={t('money.empty.noTeam.body')} />
        </div>
      </div>
    );
  }

  const recentItems = recentQ.data?.items ?? [];

  return (
    <div style={root}>
      <div style={inner}>
        <h1 style={title}>{t('money.title')}</h1>

        {balanceQ.isLoading || balanceQ.isPending ? (
          <BalanceCardSkeleton />
        ) : balanceQ.isError || !balanceQ.data ? (
          <ErrorCard text={t('common.error')} />
        ) : (
          <BalanceCard
            total={balanceQ.data.total}
            breakdown={balanceQ.data.breakdown}
            title={t('money.balance.title')}
            hint={t('money.balance.hint')}
            labels={{
              on_hand: t('money.balance.onHand'),
              future_arenas: t('money.balance.futureArenas'),
              overpayments: t('money.balance.overpayments'),
              debts: t('money.balance.debts'),
            }}
          />
        )}

        <SectionBlock title={t('money.actions.title')}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: spacing['10'],
            }}
          >
            <QuickActionTile
              tone="positive"
              icon={<IconPerson size={22} color={quickActionForeground('positive')} />}
              label={t('money.actions.payment')}
              onClick={() => router.push('/money/soon?title=money.actions.payment')}
            />
            <QuickActionTile
              tone="positive"
              icon={<IconWallet size={22} color={quickActionForeground('positive')} />}
              label={t('money.actions.deposit')}
              onClick={() => router.push('/money/soon?title=money.actions.deposit')}
            />
            <QuickActionTile
              tone="negative"
              icon={<IconArrowDown size={22} color={quickActionForeground('negative')} />}
              label={t('money.actions.expense')}
              onClick={() => router.push('/money/soon?title=money.actions.expense')}
            />
          </div>
        </SectionBlock>

        <SectionBlock title={t('money.sections.title')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
            <ListRow
              icon={<IconChart size={22} color={colors.iconFg} />}
              title={t('money.sections.report.title')}
              subtitle={t('money.sections.report.subtitle')}
              onClick={() => router.push('/money/soon?title=money.sections.report.title')}
            />
            <ListRow
              icon={<IconPeople size={22} color={colors.iconFg} />}
              title={t('money.sections.players.title')}
              subtitle={t('money.sections.players.subtitle')}
              onClick={() => router.push('/money/soon?title=money.sections.players.title')}
            />
            <ListRow
              icon={<IconFileText size={22} color={colors.iconFg} />}
              title={t('money.sections.transactions.title')}
              subtitle={t('money.sections.transactions.subtitle')}
              onClick={() => router.push('/money/soon?title=money.sections.transactions.title')}
            />
            <ListRow
              icon={<IconStats size={22} color={colors.iconFg} />}
              title={t('money.sections.analytics.title')}
              subtitle={t('money.sections.analytics.subtitle')}
              onClick={() => router.push('/money/soon?title=money.sections.analytics.title')}
            />
          </div>
        </SectionBlock>

        <SectionBlock
          title={t('money.recent.title')}
          rightSlot={
            recentItems.length > 0 ? (
              <button
                type="button"
                onClick={() => router.push('/money/soon?title=money.sections.transactions.title')}
                style={linkBtn}
                className="pressable"
              >
                {t('money.recent.viewAll')}
              </button>
            ) : null
          }
        >
          <RecentBlock isLoading={recentQ.isLoading || recentQ.isPending}>
            {recentItems.length === 0 ? (
              <div style={emptyBlock}>
                <span style={{ ...typography.sm, color: colors.textSecondary }}>
                  {t('money.recent.empty')}
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                  background: colors.bg,
                  borderRadius: radius.lg,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                }}
              >
                {recentItems.map((tx, idx) => (
                  <div key={tx.id}>
                    <FinanceRow tx={tx} labels={rowLabels} />
                    {idx < recentItems.length - 1 ? (
                      <div
                        style={{
                          height: 1,
                          background: colors.line,
                          margin: `0 ${spacing['12']}px`,
                        }}
                        aria-hidden
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </RecentBlock>
        </SectionBlock>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Локальные мини-компоненты страницы.
// ───────────────────────────────────────────────────────────────────────────────

function SectionBlock({
  title,
  rightSlot,
  children,
}: {
  title: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing['10'],
  };
  return (
    <section>
      <div style={headerStyle}>
        <h2 style={{ ...typography.h3, color: colors.text, margin: 0 }}>{title}</h2>
        {rightSlot}
      </div>
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

function RecentBlock({
  isLoading,
  children,
}: {
  isLoading: boolean;
  children: React.ReactNode;
}) {
  if (isLoading) {
    const wrap: CSSProperties = {
      background: colors.bg,
      borderRadius: radius.lg,
      padding: spacing['12'],
      display: 'flex',
      flexDirection: 'column',
      gap: spacing['12'],
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)',
    };
    return (
      <div style={wrap} aria-hidden>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing['12'],
              padding: `${spacing['4']}px 0`,
            }}
          >
            <Skeleton width={40} height={40} borderRadius="50%" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing['6'] }}>
              <Skeleton width="55%" height={13} />
              <Skeleton width="35%" height={11} />
            </div>
            <Skeleton width={70} height={14} />
          </div>
        ))}
      </div>
    );
  }
  return <>{children}</>;
}

const linkBtn: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  color: colors.headerAccent,
};

const emptyBlock: CSSProperties = {
  background: colors.bgWarm,
  borderRadius: radius.lg,
  padding: `${spacing['24']}px ${spacing['16']}px`,
  textAlign: 'center',
};

// Стрелка вниз — компактный inline-SVG; в общую icons.tsx добавлять не стали,
// чтобы не плодить редко используемых иконок. Если понадобится ещё где-то —
// перенесём в icons.tsx.
function IconArrowDown({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12l7 7 7-7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
