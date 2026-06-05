'use client';

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { HomeHeader } from '@/components/home/home-header';
import { HomeQuickActions } from '@/components/home/home-quick-actions';
import { NextEventCard } from '@/components/home/next-event-card';
import { NextEventEmpty } from '@/components/home/next-event-empty';
import { NextEventSkeleton } from '@/components/home/next-event-skeleton';
import { useMe } from '@/hooks/use-me';
import { useNextEvent } from '@/hooks/use-next-event';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useActiveTeamStore } from '@/store/active-team';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// Главная страница (v0.6, итерация 62) — первый таб «Команда». Дайджест:
// шапка с логотипом/названием команды, карточка ближайшего события (либо
// empty-state), под ними в следующих итерациях появятся quick-actions и
// блок «Ключевая статистика».
//
// К моменту монтирования layout (tabs) уже гарантирует, что пользователь
// прошёл онбординг и состоит хотя бы в одной команде — иначе нас не пустят.
export default function HomePage() {
  const t = useT();
  const router = useRouter();
  useTgHeader(colors.bg);

  const me = useMe();
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  const { isOrganizer } = useIsOrganizer();
  const nextQ = useNextEvent();

  // Активная команда — для шапки. Берём из memberships по activeTeamId
  // (или первая, если store ещё не успел) — данные есть с самого начала
  // благодаря layout, нет лоадера-плейсхолдера.
  const memberships = me.data?.memberships ?? [];
  const activeMembership =
    memberships.find((m) => m.team_id === activeTeamId) ?? memberships[0] ?? null;

  const root: CSSProperties = {
    minHeight: '100dvh',
    background: colors.bg,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const content: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
    padding: `0 ${spacing['16']}px`,
  };

  const handleOpenEvent = (eventId: string) => router.push(`/events/${eventId}`);
  const handleCreateEvent = () => router.push('/events/new');
  const handleOpenCalendar = () => router.push('/events');

  const team = nextQ.data?.team ?? null;
  const event = nextQ.data?.event ?? null;

  return (
    <div style={root}>
      <HomeHeader
        teamName={activeMembership?.team_name ?? ''}
        teamLogoUrl={activeMembership?.team_logo_url ?? null}
      />
      <div style={content}>
        {nextQ.isLoading || nextQ.isPending ? (
          <NextEventSkeleton />
        ) : event ? (
          <NextEventCard
            event={event}
            team={team}
            onOpen={() => handleOpenEvent(event.id)}
            labels={{
              badgeTraining: t('home.nextEvent.badge.training'),
              badgeGame: t('home.nextEvent.badge.game'),
              cta: t('home.nextEvent.cta'),
              versusOpponent: t('home.nextEvent.versus.opponent'),
              attendanceCaption: t('home.nextEvent.metric.attendance'),
              feeCaption: t('home.nextEvent.metric.fee'),
              seatsCaption: t('home.nextEvent.metric.seats'),
            }}
          />
        ) : (
          <NextEventEmpty
            title={t('home.nextEvent.empty.title')}
            ctaLabel={
              isOrganizer
                ? t('home.nextEvent.empty.ctaOrganizer')
                : t('home.nextEvent.empty.ctaPlayer')
            }
            onCta={isOrganizer ? handleCreateEvent : handleOpenCalendar}
          />
        )}

        {isOrganizer ? <HomeQuickActions /> : null}
      </div>
    </div>
  );
}
