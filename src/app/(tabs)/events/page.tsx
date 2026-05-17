'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { DarkHeader } from '@/components/dark-header';
import { BackButton } from '@/components/back-button';
import { ContentTabs } from '@/components/content-tabs';
import { FilterChips } from '@/components/filter-chips';
import { SectionHeader } from '@/components/section-header';
import { EventCard, type EventCardKind } from '@/components/event-card';
import { EmptyState } from '@/components/empty-state';
import { FAB } from '@/components/fab';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { IconBell } from '@/components/icons';
import { useEvents } from '@/hooks/use-events';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import {
  formatTime,
  formatTodaySubtitle,
  formatWeekDate,
  groupEvents,
} from '@/lib/event-format';
import type { EventDto } from '@/types/api';

type FilterId = 'all' | 'training' | 'game';
type TabId = 'list' | 'calendar';

function BellWithDot() {
  const wrap: CSSProperties = {
    position: 'relative',
    width: 48,
    height: 48,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const dot: CSSProperties = {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 11,
    height: 11,
    borderRadius: 6,
    background: colors.success,
    border: `2.5px solid ${colors.headerBg}`,
  };
  return (
    <span style={wrap} aria-hidden>
      <IconBell size={23} color={colors.textInverse} />
      <span style={dot} />
    </span>
  );
}

function kindOf(ev: EventDto): EventCardKind {
  return ev.type === 'game' ? 'game' : 'training';
}

export default function EventsPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader('#233F30');

  const me = useMe();
  const events = useEvents();
  const [tab, setTab] = useState<TabId>('list');
  const [filter, setFilter] = useState<FilterId>('all');

  const isOrganizer = useMemo(
    () => me.data?.memberships.some((m) => m.role === 'organizer') ?? false,
    [me.data],
  );
  const role = isOrganizer ? t('schedule.role.organizer') : t('schedule.role.player');

  const filtered = useMemo<EventDto[]>(() => {
    const list = events.data?.events ?? [];
    if (filter === 'all') return list;
    return list.filter((e) => e.type === filter);
  }, [events.data, filter]);

  const teamSize = events.data?.team_size ?? 0;
  const groups = useMemo(() => groupEvents(filtered), [filtered]);
  const isEmpty =
    groups.today.length === 0 && groups.week.length === 0 && groups.later.length === 0;

  const filterOptions = [
    { id: 'all' as const, label: t('schedule.filters.all') },
    { id: 'training' as const, label: t('schedule.filters.training') },
    { id: 'game' as const, label: t('schedule.filters.game') },
  ];

  const tabsOptions = [
    { id: 'list', label: t('schedule.tabs.list') },
    { id: 'calendar', label: t('schedule.tabs.calendar') },
  ];

  const titleFor = (ev: EventDto): string => {
    if (ev.title && ev.title.trim()) return ev.title;
    return ev.type === 'game' ? t('schedule.titles.game') : t('schedule.titles.training');
  };

  const renderCardToday = (ev: EventDto) => (
    <EventCard
      key={ev.id}
      kind={kindOf(ev)}
      title={titleFor(ev)}
      venue={ev.venue_text ?? undefined}
      timePrimary={formatTime(ev.starts_at)}
      timeSecondary={ev.ends_at ? `– ${formatTime(ev.ends_at)}` : undefined}
      count={ev.attendance.going}
      total={teamSize}
      onClick={() => router.push(`/events/${ev.id}`)}
    />
  );

  const renderCardWeek = (ev: EventDto) => {
    const wd = formatWeekDate(ev.starts_at);
    return (
      <EventCard
        key={ev.id}
        kind={kindOf(ev)}
        title={titleFor(ev)}
        venue={ev.venue_text ?? undefined}
        timePrimary={formatTime(ev.starts_at)}
        weekDate={wd.date}
        weekDay={wd.day}
        count={ev.attendance.going}
        total={teamSize}
        onClick={() => router.push(`/events/${ev.id}`)}
      />
    );
  };

  const sheet: CSSProperties = {
    background: colors.bg,
    borderRadius: '24px 24px 0 0',
    marginTop: -12,
    position: 'relative',
    zIndex: 2,
    minHeight: `calc(100dvh - ${BOTTOM_NAV_HEIGHT}px - 140px)`,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const list: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
    padding: `0 ${spacing['16']}px`,
  };

  const handleFabClick = () => {
    // /events/new появится в итерации 10
    if (typeof window !== 'undefined') window.alert('Скоро');
  };

  return (
    <div style={{ background: colors.headerBg, minHeight: '100dvh' }}>
      <DarkHeader
        role={role}
        title={t('schedule.title')}
        left={<BackButton ariaLabel={t('schedule.backLabel')} />}
        right={<BellWithDot />}
      />

      <div style={sheet}>
        <ContentTabs tabs={tabsOptions} activeId={tab} onChange={(id) => setTab(id as TabId)} />

        {tab === 'calendar' ? (
          <div style={{ padding: `${spacing['32']}px ${spacing['20']}px` }}>
            <EmptyState title={t('schedule.calendarSoon')} />
          </div>
        ) : (
          <>
            <FilterChips
              options={filterOptions}
              activeId={filter}
              onChange={(id) => setFilter(id as FilterId)}
            />

            {events.isLoading ? (
              <div style={{ padding: `${spacing['24']}px ${spacing['20']}px` }}>
                <span style={{ ...typography.body, color: colors.textSecondary }}>
                  {t('common.loading')}
                </span>
              </div>
            ) : events.isError ? (
              <div style={{ padding: `${spacing['24']}px ${spacing['20']}px` }}>
                <span style={{ ...typography.body, color: colors.error }}>
                  {t('common.error')}
                </span>
              </div>
            ) : isEmpty ? (
              <div style={{ padding: `${spacing['32']}px ${spacing['20']}px` }}>
                <EmptyState title={t('schedule.empty')} />
              </div>
            ) : (
              <>
                {groups.today.length > 0 && (
                  <>
                    <SectionHeader
                      title={t('schedule.sections.today')}
                      subtitle={formatTodaySubtitle(new Date())}
                    />
                    <div style={list}>{groups.today.map(renderCardToday)}</div>
                  </>
                )}
                {groups.week.length > 0 && (
                  <>
                    <SectionHeader title={t('schedule.sections.week')} />
                    <div style={list}>{groups.week.map(renderCardWeek)}</div>
                  </>
                )}
                {groups.later.length > 0 && (
                  <>
                    <SectionHeader title={t('schedule.sections.later')} />
                    <div style={list}>{groups.later.map(renderCardWeek)}</div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {isOrganizer ? (
        <FAB
          variant="dark"
          ariaLabel={t('schedule.fabLabel')}
          onClick={handleFabClick}
          bottom={BOTTOM_NAV_HEIGHT + 14}
        />
      ) : null}
    </div>
  );
}
