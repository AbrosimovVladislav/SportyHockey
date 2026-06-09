'use client';

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { HomeHero } from '@/components/home/home-hero';
import { HomeQuickActions } from '@/components/home/home-quick-actions';
import { KeyStatsCard } from '@/components/home/key-stats-card';
import { NextEventEmptyCard } from '@/components/home/next-event-empty-card';
import { NextEventInfoCard } from '@/components/home/next-event-info-card';
import { NextEventInfoSkeleton } from '@/components/home/next-event-skeleton';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { useNextEvent } from '@/hooks/use-next-event';
import { useT } from '@/hooks/use-t';
import { useTeamSectionImages } from '@/hooks/use-team-section-images';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// Главная страница (v0.6, передизайн от 2026-06-08). Структура повторяет
// шаблон других разделов (/money, /squad, /events):
//   • тёмная шапка `HomeHero` (252px + safe-top) с логотипом, названием
//     команды и краткой инфо о ближайшем событии;
//   • белый sheet с `borderRadius: 24px 24px 0 0`, `marginTop: -12`,
//     `z-index: 2` — наезжает на шапку, как везде;
//   • внутри sheet — `NextEventInfoCard` (метрики + CTA), `HomeQuickActions`
//     (2 плитки без заголовка), `KeyStatsCard` (карточка статистики с
//     общими табами приложения).
export default function HomePage() {
  const t = useT();
  const router = useRouter();
  useTgHeader(colors.headerBg);

  const { isOrganizer } = useIsOrganizer();
  const nextQ = useNextEvent();
  const sectionImages = useTeamSectionImages();

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
    gap: spacing['16'],
  };

  const event = nextQ.data?.event ?? null;
  const team = nextQ.data?.team ?? null;
  const isLoading = nextQ.isLoading || nextQ.isPending;

  return (
    <div style={root}>
      <HomeHero
        team={team}
        event={event}
        labels={{
          badgeTraining: t('home.nextEvent.badge.training'),
          badgeGame: t('home.nextEvent.badge.game'),
          badgeEmpty: t('home.nextEvent.empty.title'),
          versus: t('home.nextEvent.versus.opponent'),
        }}
        customImage={sectionImages.data?.home ?? null}
      />

      <div style={sheet}>
        {isLoading ? (
          <NextEventInfoSkeleton />
        ) : event ? (
          <NextEventInfoCard
            event={event}
            onOpen={() => router.push(`/events/${event.id}`)}
            labels={{
              cta: t('home.nextEvent.cta'),
              attendanceCaption: t('home.nextEvent.metric.attendance'),
              feeCaption: t('home.nextEvent.metric.fee'),
              seatsCaption: t('home.nextEvent.metric.seats'),
            }}
          />
        ) : (
          <NextEventEmptyCard
            title={t('home.nextEvent.empty.title')}
            body={t('home.nextEvent.empty.body')}
            ctaLabel={
              isOrganizer
                ? t('home.nextEvent.empty.ctaOrganizer')
                : t('home.nextEvent.empty.ctaPlayer')
            }
            onCta={() => router.push(isOrganizer ? '/events/new' : '/events')}
          />
        )}

        {isOrganizer ? <HomeQuickActions /> : null}

        <KeyStatsCard />
      </div>
    </div>
  );
}
