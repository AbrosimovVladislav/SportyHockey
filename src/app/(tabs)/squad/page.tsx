'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { DarkHeader } from '@/components/dark-header';
import { ListRow } from '@/components/list-row';
import { EventCard } from '@/components/event-card';
import { TeamStatCells } from '@/components/team-stat-cells';
import { SoonSheet } from '@/components/soon-sheet';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import {
  IconPlayers,
  IconHockeyStick,
  IconShield,
  IconGoalie,
  IconShirt,
  IconStats,
  IconSticksCrossed,
  IconImage,
  IconSettings,
} from '@/components/icons';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useEvents } from '@/hooks/use-events';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { formatTime, formatWeekDate } from '@/lib/event-format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { TKey } from '@/i18n/ru';
import type { EventDto } from '@/types/api';

export default function TeamHubPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader('#233F30');

  const membersQ = useTeamMembers();
  const eventsQ = useEvents();
  const [soon, setSoon] = useState<string | null>(null);

  const members = membersQ.data?.members ?? [];
  const counts = useMemo(
    () => ({
      total: members.length,
      forward: members.filter((m) => m.position === 'forward').length,
      defender: members.filter((m) => m.position === 'defender').length,
      goalie: members.filter((m) => m.position === 'goalie').length,
    }),
    [members],
  );

  const teamSize = eventsQ.data?.team_size ?? 0;

  // Ближайшее предстоящее событие: запланированное, начиная с сегодняшнего дня.
  const nextEvent = useMemo<EventDto | null>(() => {
    const list = eventsQ.data?.events ?? [];
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const ms = startOfToday.getTime();
    return (
      list
        .filter((e) => e.status === 'scheduled' && new Date(e.starts_at).getTime() >= ms)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0] ?? null
    );
  }, [eventsQ.data]);

  const sections = [
    {
      key: 'roster',
      icon: <IconShirt size={20} color={colors.iconFg} />,
      title: t('team.section.roster.title'),
      subtitle: t('team.section.roster.subtitle'),
      onClick: () => router.push('/squad/roster'),
    },
    {
      key: 'stats',
      icon: <IconStats size={20} color={colors.iconFg} />,
      title: t('team.section.stats.title'),
      subtitle: t('team.section.stats.subtitle'),
      onClick: () => setSoon(t('team.section.stats.title')),
    },
    {
      key: 'tactics',
      icon: <IconSticksCrossed size={20} color={colors.iconFg} />,
      title: t('team.section.tactics.title'),
      subtitle: t('team.section.tactics.subtitle'),
      onClick: () => setSoon(t('team.section.tactics.title')),
    },
    {
      key: 'media',
      icon: <IconImage size={20} color={colors.iconFg} />,
      title: t('team.section.media.title'),
      subtitle: t('team.section.media.subtitle'),
      onClick: () => setSoon(t('team.section.media.title')),
    },
    {
      key: 'settings',
      icon: <IconSettings size={20} color={colors.iconFg} />,
      title: t('team.section.settings.title'),
      subtitle: t('team.section.settings.subtitle'),
      onClick: () => setSoon(t('team.section.settings.title')),
    },
  ];

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };

  const sheet: CSSProperties = {
    background: colors.bg,
    borderRadius: '24px 24px 0 0',
    marginTop: -12,
    position: 'relative',
    zIndex: 2,
    minHeight: `calc(100dvh - ${BOTTOM_NAV_HEIGHT}px - 140px)`,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
    padding: `${spacing['16']}px ${spacing['16']}px ${BOTTOM_NAV_HEIGHT + spacing['24']}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };

  return (
    <div style={root}>
      <DarkHeader title={t('team.title')} imageSrc="/team.png" />

      <div style={sheet}>
        <TeamStatCells
          cells={[
            { icon: <IconPlayers size={24} />, value: counts.total, label: t('team.stat.players') },
            { icon: <IconHockeyStick size={24} />, value: counts.forward, label: t('team.stat.forwards') },
            { icon: <IconShield size={24} />, value: counts.defender, label: t('team.stat.defenders') },
            { icon: <IconGoalie size={24} />, value: counts.goalie, label: t('team.stat.goalies') },
          ]}
        />

        {nextEvent ? (
          <EventCard
            kind={nextEvent.type === 'game' ? 'game' : 'training'}
            title={titleFor(nextEvent, t)}
            venue={nextEvent.venue?.name ?? undefined}
            venuePhotoUrl={nextEvent.venue?.photo_url ?? undefined}
            timePrimary={formatTime(nextEvent.starts_at)}
            weekDate={formatWeekDate(nextEvent.starts_at).date}
            weekDay={formatWeekDate(nextEvent.starts_at).day}
            count={nextEvent.attendance.going}
            total={teamSize}
            onClick={() => router.push(`/events/${nextEvent.id}`)}
          />
        ) : null}

        {sections.map((s) => (
          <ListRow
            key={s.key}
            icon={s.icon}
            title={s.title}
            subtitle={s.subtitle}
            onClick={s.onClick}
          />
        ))}
      </div>

      <SoonSheet
        open={soon !== null}
        onClose={() => setSoon(null)}
        title={soon ?? ''}
        description={t('team.soon')}
      />
    </div>
  );
}

function titleFor(ev: EventDto, t: (k: TKey) => string): string {
  if (ev.title && ev.title.trim()) return ev.title;
  return ev.type === 'game' ? t('schedule.titles.game') : t('schedule.titles.training');
}
