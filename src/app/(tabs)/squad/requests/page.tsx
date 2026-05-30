'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { ContentTabs } from '@/components/content-tabs';
import { IconUserCheck } from '@/components/icons';
import { useJoinRequests } from '@/hooks/use-join-requests';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { RequestCard } from './request-card';

type TabId = 'all' | 'in' | 'out';

// Экран «Заявки и приглашения» — итерация 42.
// На этой итерации показываем только входящие (kind='request') заявки;
// вкладка «Исходящие» — заглушка «Скоро в разработке». Вкладки «Все» и
// «Входящие» рендерят один и тот же список (исходящих нет — оба вида
// в этой версии совпадают).
export default function RequestsPage() {
  const t = useT();
  const router = useRouter();
  const { isOrganizer, isLoading: orgLoading } = useIsOrganizer();
  useTgHeader(colors.bg);

  const [tab, setTab] = useState<TabId>('all');
  const q = useJoinRequests(isOrganizer, 'all');

  // Не-организатор сюда попадать не должен — API всё равно вернёт 403.
  useEffect(() => {
    if (!orgLoading && !isOrganizer) router.replace('/squad');
  }, [orgLoading, isOrganizer, router]);

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };
  const content: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
    padding: spacing['16'],
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const tabs = [
    { id: 'all', label: t('requests.tabs.all') },
    { id: 'in', label: t('requests.tabs.in') },
    { id: 'out', label: t('requests.tabs.out') },
  ];

  const items = q.data?.requests ?? [];

  return (
    <div style={root}>
      <LightHeader title={t('requests.title')} onBack={() => router.push('/squad')} />

      <ContentTabs tabs={tabs} activeId={tab} onChange={(id) => setTab(id as TabId)} />

      <div style={content}>
        {tab === 'out' ? (
          <OutgoingSoon t={t} />
        ) : q.isLoading ? (
          <StatusText text={t('common.loading')} color={colors.textSecondary} />
        ) : q.error ? (
          <StatusText text={t('common.error')} color={colors.error} />
        ) : items.length === 0 ? (
          <EmptyList t={t} mode={tab} />
        ) : (
          items.map((r) => <RequestCard key={r.id} item={r} />)
        )}
      </div>
    </div>
  );
}

function StatusText({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
      <span style={{ ...typography.body, color }}>{text}</span>
    </div>
  );
}

function EmptyList({
  t,
  mode,
}: {
  t: (k: 'requests.empty.all' | 'requests.empty.in') => string;
  mode: 'all' | 'in';
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing['12'],
        padding: `${spacing['32']}px ${spacing['16']}px`,
        background: colors.bgWarm,
        borderRadius: radius.lg,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: colors.bg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconUserCheck size={24} color={colors.iconFg} />
      </div>
      <span style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
        {t(mode === 'in' ? 'requests.empty.in' : 'requests.empty.all')}
      </span>
    </div>
  );
}

function OutgoingSoon({ t }: { t: (k: 'requests.empty.out') => string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing['12'],
        padding: `${spacing['32']}px ${spacing['16']}px`,
        background: colors.bgWarm,
        borderRadius: radius.lg,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: colors.bg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconUserCheck size={24} color={colors.iconMuted} />
      </div>
      <span style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
        {t('requests.empty.out')}
      </span>
    </div>
  );
}
