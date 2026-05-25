'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { UseQueryResult } from '@tanstack/react-query';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { ContentTabs } from '@/components/content-tabs';
import { BottomSheet, BottomSheetOption } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { IconMore } from '@/components/icons';
import { HeaderCard } from './header-card';
import { PlayerOverviewTab } from './overview-tab';
import { PlayerFinanceTab } from './finance-tab';
import { PlayerStatsTab } from './stats-tab';
import {
  useTeamMember,
  usePlayerOverview,
  usePlayerFinance,
  usePlayerStats,
} from '@/hooks/use-team-member';
import { useDeleteMember } from '@/hooks/use-delete-member';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';

type TabId = 'overview' | 'finance' | 'stats';

export default function PlayerProfilePage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ user_id: string }>();
  const userId = params?.user_id ?? '';
  const { isOrganizer } = useIsOrganizer();
  const memberQ = useTeamMember(userId);
  const [tab, setTab] = useState<TabId>('overview');
  const overviewQ = usePlayerOverview(userId);
  const financeQ = usePlayerFinance(userId, tab === 'finance');
  const statsQ = usePlayerStats(userId, tab === 'stats');
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const del = useDeleteMember(userId);
  useTgHeader(colors.bg);

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/squad');
  };

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };
  const content: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
    padding: spacing['16'],
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const member = memberQ.data?.member;

  const menuButton =
    isOrganizer && member ? (
      <button
        type="button"
        className="pressable"
        aria-label={t('player.menu.title')}
        onClick={() => setMenuOpen(true)}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: colors.bgMuted,
          border: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <IconMore size={20} color={colors.text} />
      </button>
    ) : undefined;

  if (memberQ.isLoading) {
    return (
      <div style={root}>
        <LightHeader title={t('player.title')} onBack={onBack} />
        <StatusText text={t('common.loading')} color={colors.textSecondary} />
      </div>
    );
  }
  if (memberQ.error || !member) {
    return (
      <div style={root}>
        <LightHeader title={t('player.title')} onBack={onBack} />
        <StatusText text={t('common.error')} color={colors.error} />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: t('player.tabs.overview') },
    { id: 'finance', label: t('player.tabs.finance') },
    { id: 'stats', label: t('player.tabs.stats') },
  ];

  return (
    <div style={root}>
      <LightHeader title={t('player.title')} onBack={onBack} right={menuButton} />

      <div style={content}>
        <HeaderCard member={member} t={t} />

        <ContentTabs tabs={tabs} activeId={tab} onChange={(id) => setTab(id as TabId)} />

        {tab === 'overview' ? (
          <QueryGate q={overviewQ} t={t}>
            {(d) => <PlayerOverviewTab overview={d} onOpenTab={(id) => setTab(id)} t={t} />}
          </QueryGate>
        ) : tab === 'finance' ? (
          <QueryGate q={financeQ} t={t}>
            {(d) => <PlayerFinanceTab finance={d} t={t} />}
          </QueryGate>
        ) : (
          <QueryGate q={statsQ} t={t}>
            {(d) => <PlayerStatsTab stats={d} t={t} />}
          </QueryGate>
        )}
      </div>

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={t('player.menu.title')}>
        <BottomSheetOption
          label={t('player.menu.edit')}
          onClick={() => {
            setMenuOpen(false);
            router.push(`/squad/${userId}/edit`);
          }}
        />
        <BottomSheetOption
          label={t('player.menu.delete')}
          onClick={() => {
            setMenuOpen(false);
            setConfirmDelete(true);
          }}
        />
      </BottomSheet>

      <BottomSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('editMember.deleteTitle')}
      >
        <div style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing['16'] }}>
          {t('editMember.deleteText')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
          <Button
            variant="danger"
            size="lg"
            fullWidth
            disabled={del.isPending}
            onClick={() => del.mutate(undefined, { onSuccess: () => router.replace('/squad') })}
          >
            {t('editMember.deleteCta')}
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={() => setConfirmDelete(false)}>
            {t('editMember.cancel')}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

function QueryGate<TData>({
  q,
  t,
  children,
}: {
  q: UseQueryResult<TData>;
  t: (k: TKey) => string;
  children: (data: TData) => ReactNode;
}) {
  if (q.data !== undefined) return <>{children(q.data)}</>;
  if (q.isError) return <StatusText text={t('common.error')} color={colors.error} />;
  return <StatusText text={t('common.loading')} color={colors.textSecondary} />;
}

function StatusText({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
      <span style={{ ...typography.body, color }}>{text}</span>
    </div>
  );
}
