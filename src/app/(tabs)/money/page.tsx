'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import { DarkHeader } from '@/components/dark-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { ListRow } from '@/components/list-row';
import { BalanceCard, BalanceCardSkeleton } from '@/components/balance-card';
import { QuickActionTile, quickActionForeground } from '@/components/quick-action-tile';
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
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

// Хаб раздела «Деньги» (v0.5, итерация 48): DarkHeader с фото арены,
// карточка-баланс с разбивкой, три быстрых действия (placeholder на soon
// до итераций 49–50), переходы в четыре подэкрана. Список «Последние
// операции» убран — вся лента живёт на `/money/transactions`.
export default function MoneyPage() {
  const t = useT();
  const router = useRouter();
  const me = useMe();
  useTgHeader('#233F30');

  const hasTeam = (me.data?.memberships.length ?? 0) > 0;
  const balanceQ = useTeamBalance(hasTeam);

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
      <DarkHeader title={t('money.title')} imageSrc="/arena.png" />
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

// Inline-стрелка вниз для quick-action «Расход». В общую icons.tsx не выносим
// до повторного использования (см. iteration 50 — там тоже понадобится).
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
