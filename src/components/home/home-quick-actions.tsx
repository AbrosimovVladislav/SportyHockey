'use client';

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { HomeActionTile } from '@/components/home/home-action-tile';
import { IconPlus, IconUserCheck } from '@/components/icons';
import { useHomeActions } from '@/hooks/use-home-actions';
import { useT } from '@/hooks/use-t';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// Quick-actions для organizer на главной (v0.6, передизайн от 2026-06-08).
// Две горизонтальные плитки в одну строку. Заголовок секции не нужен —
// плитки сами говорят за себя. Оставшиеся два слота добавим позже, когда
// определимся с действиями.

export function HomeQuickActions() {
  const t = useT();
  const router = useRouter();
  const actionsQ = useHomeActions();
  const pendingRequests = actionsQ.data?.pending_requests_count ?? 0;

  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing['10'],
  };

  return (
    <div style={grid}>
      <HomeActionTile
        icon={<IconPlus size={22} color={colors.successDark} />}
        label={t('home.actions.organizer.createEvent')}
        onClick={() => router.push('/events/new')}
      />
      <HomeActionTile
        icon={<IconUserCheck size={22} color={colors.successDark} />}
        label={t('home.actions.organizer.requests')}
        badge={pendingRequests > 0 ? pendingRequests : null}
        onClick={() => router.push('/squad/requests')}
      />
    </div>
  );
}
