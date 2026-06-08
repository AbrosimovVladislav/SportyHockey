'use client';

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { HomeActionTile } from '@/components/home/home-action-tile';
import { IconPlus, IconUserCheck } from '@/components/icons';
import { useHomeActions } from '@/hooks/use-home-actions';
import { useT } from '@/hooks/use-t';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

// Quick-actions для organizer на главной (v0.6, передизайн от 2026-06-08).
// Две горизонтальные плитки в одну строку («Создать событие» и «Заявки»).
// Оставшиеся два слота добавим позже, когда определимся с действиями
// (раньше были «Отметить оплаты» и «Записать результат» в виде 2×2 — снято,
// потому что в новом дизайне на главной только 2 плитки).
//
// «Заявки» показывает бейдж с pending-counter (через `useHomeActions`).
// «Создать событие» всегда активна.

export function HomeQuickActions() {
  const t = useT();
  const router = useRouter();
  const actionsQ = useHomeActions();
  const pendingRequests = actionsQ.data?.pending_requests_count ?? 0;

  const section: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };
  const title: CSSProperties = {
    ...typography.h3,
    color: colors.text,
    margin: 0,
  };
  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing['10'],
  };

  return (
    <section style={section}>
      <h2 style={title}>{t('home.actions.title')}</h2>
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
    </section>
  );
}
