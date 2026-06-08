'use client';

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { HomeHero } from '@/components/home/home-hero';
import { HomeQuickActions } from '@/components/home/home-quick-actions';
import { KeyStatsCard } from '@/components/home/key-stats-card';
import { useNextEvent } from '@/hooks/use-next-event';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// Главная страница (v0.6, передизайн от 2026-06-08). Структура:
//   1) HomeHero    — тёмный full-width блок: команда + ближайшее событие + CTA.
//   2) Быстрые действия (organizer) — две плитки в строке.
//   3) Ключевая статистика — карточка с тремя табами фиксированной высоты.
//
// Tg-header окрашен в тёмно-зелёный, чтобы сшивался с HomeHero без видимой
// границы (раньше шапка была белой, hero сидел поверх и это норм; сейчас
// hero сам = шапка раздела, как на /money).
export default function HomePage() {
  const t = useT();
  const router = useRouter();
  useTgHeader(colors.headerBg);

  const { isOrganizer } = useIsOrganizer();
  const nextQ = useNextEvent();

  const root: CSSProperties = {
    minHeight: '100dvh',
    background: colors.bg,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const content: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['20'],
    padding: `${spacing['20']}px ${spacing['16']}px 0`,
  };

  const handleOpenEvent = (eventId: string) => router.push(`/events/${eventId}`);
  const handleEmptyCta = () =>
    router.push(isOrganizer ? '/events/new' : '/events');

  const team = nextQ.data?.team ?? null;
  const event = nextQ.data?.event ?? null;
  const isLoading = nextQ.isLoading || nextQ.isPending;

  return (
    <div style={root}>
      {isLoading ? (
        <HeroSkeleton />
      ) : (
        <HomeHero
          team={team}
          event={event}
          onOpenEvent={handleOpenEvent}
          onEmptyCta={handleEmptyCta}
          labels={{
            badgeTraining: t('home.nextEvent.badge.training'),
            badgeGame: t('home.nextEvent.badge.game'),
            badgeEmpty: t('home.nextEvent.empty.title'),
            cta: t('home.nextEvent.cta'),
            ctaEmpty: isOrganizer
              ? t('home.nextEvent.empty.ctaOrganizer')
              : t('home.nextEvent.empty.ctaPlayer'),
            versus: t('home.nextEvent.versus.opponent'),
            attendanceCaption: t('home.nextEvent.metric.attendance'),
            feeCaption: t('home.nextEvent.metric.fee'),
            seatsCaption: t('home.nextEvent.metric.seats'),
          }}
        />
      )}
      <div style={content}>
        {isOrganizer ? <HomeQuickActions /> : null}
        <KeyStatsCard />
      </div>
    </div>
  );
}

// Скелетон для HomeHero — тёмная подложка той же примерной высоты,
// чтобы при загрузке tg-header не светил белым в верхней части.
function HeroSkeleton() {
  const sk: CSSProperties = {
    background: colors.headerBg,
    minHeight: `calc(320px + var(--app-safe-top))`,
    opacity: 0.95,
  };
  return <div aria-hidden style={sk} />;
}
