'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { DarkHeader } from '@/components/dark-header';
import { ContentTabs } from '@/components/content-tabs';
import { FilterChips } from '@/components/filter-chips';
import { SectionHeader } from '@/components/section-header';
import { EventCard, type EventCardKind } from '@/components/event-card';
import { EmptyState } from '@/components/empty-state';
import { FAB } from '@/components/fab';
import { WeekPicker } from '@/components/week-picker';
import { WeekDays } from '@/components/week-days';
import { DayEventRow } from '@/components/day-event-row';
import { MonthSheet, dayKey } from '@/components/month-sheet';
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
  addDays,
  dayHeaderLabel,
  formatTime,
  formatTodaySubtitle,
  formatWeekDate,
  groupEvents,
  isSameDay,
  startOfWeek,
  weekRangeLabel,
} from '@/lib/event-format';
import type { EventDto } from '@/types/api';

type FilterId = 'all' | 'training' | 'game';
type TabId = 'list' | 'calendar';

function BellWithDot() {
  const wrap: CSSProperties = {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.25)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const dot: CSSProperties = {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    background: colors.success,
    border: `2px solid ${colors.headerBg}`,
  };
  return (
    <span style={wrap} aria-label="Уведомления" role="button">
      <IconBell size={20} color={colors.textInverse} />
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
  const [calendarSelected, setCalendarSelected] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const calendarWeekStart = useMemo(
    () => startOfWeek(calendarSelected),
    [calendarSelected],
  );
  const [monthSheetOpen, setMonthSheetOpen] = useState(false);

  const isOrganizer = useMemo(
    () => me.data?.memberships.some((m) => m.role === 'organizer') ?? false,
    [me.data],
  );

  const filtered = useMemo<EventDto[]>(() => {
    const list = events.data?.events ?? [];
    if (filter === 'all') return list;
    return list.filter((e) => e.type === filter);
  }, [events.data, filter]);

  const teamSize = events.data?.team_size ?? 0;
  const groups = useMemo(() => groupEvents(filtered), [filtered]);
  const isEmpty =
    groups.today.length === 0 &&
    groups.week.length === 0 &&
    groups.later.length === 0 &&
    groups.completed.length === 0;

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

  const venueFor = (ev: EventDto): string | undefined =>
    ev.venue?.name ?? ev.venue_text ?? undefined;

  const renderCardToday = (ev: EventDto) => (
    <EventCard
      key={ev.id}
      kind={kindOf(ev)}
      title={titleFor(ev)}
      venue={venueFor(ev)}
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
        venue={venueFor(ev)}
        timePrimary={formatTime(ev.starts_at)}
        weekDate={wd.date}
        weekDay={wd.day}
        count={ev.attendance.going}
        total={teamSize}
        onClick={() => router.push(`/events/${ev.id}`)}
      />
    );
  };

  const renderCardCompleted = (ev: EventDto) => {
    const wd = formatWeekDate(ev.starts_at);
    return (
      <EventCard
        key={ev.id}
        kind={kindOf(ev)}
        title={titleFor(ev)}
        venue={venueFor(ev)}
        timePrimary={formatTime(ev.starts_at)}
        weekDate={wd.date}
        weekDay={wd.day}
        count={ev.attendance.going}
        total={teamSize}
        completed
        completedLabel={t('schedule.completed')}
        onClick={() => router.push(`/events/${ev.id}`)}
      />
    );
  };

  const dayShortKey = (
    [
      'schedule.calendar.daysShort.mon',
      'schedule.calendar.daysShort.tue',
      'schedule.calendar.daysShort.wed',
      'schedule.calendar.daysShort.thu',
      'schedule.calendar.daysShort.fri',
      'schedule.calendar.daysShort.sat',
      'schedule.calendar.daysShort.sun',
    ] as const
  );

  const eventDayKeys = useMemo(() => {
    const set = new Set<string>();
    const list = events.data?.events ?? [];
    const filtered =
      filter === 'all' ? list : list.filter((e) => e.type === filter);
    for (const e of filtered) set.add(dayKey(new Date(e.starts_at)));
    return set;
  }, [events.data, filter]);

  const calendarWeekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(calendarWeekStart, i);
        return {
          date,
          shortLabel: t(dayShortKey[i]),
          hasEvents: eventDayKeys.has(dayKey(date)),
        };
      }),
    [calendarWeekStart, t, eventDayKeys],
  );

  const calendarEvents = useMemo(() => {
    const list = events.data?.events ?? [];
    const filteredByDay = list.filter((e) =>
      isSameDay(new Date(e.starts_at), calendarSelected),
    );
    if (filter !== 'all') return filteredByDay.filter((e) => e.type === filter);
    return filteredByDay.sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  }, [events.data, calendarSelected, filter]);

  const monthSheetDayShort = useMemo(
    () => dayShortKey.map((k) => t(k)),
    [t],
  );

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

  const handleFabClick = () => router.push('/events/new');

  return (
    <div style={{ background: colors.bg, minHeight: '100dvh' }}>
      <DarkHeader
        title={t('schedule.title')}
        right={<BellWithDot />}
        imageSrc="/arena.png"
      />

      <div style={sheet}>
        <ContentTabs tabs={tabsOptions} activeId={tab} onChange={(id) => setTab(id as TabId)} />

        {tab === 'calendar' ? (
          <>
            <WeekPicker
              label={weekRangeLabel(calendarWeekStart)}
              prevAriaLabel={t('schedule.calendar.prevWeek')}
              nextAriaLabel={t('schedule.calendar.nextWeek')}
              labelAriaLabel={t('schedule.calendar.openPicker')}
              onPrev={() => setCalendarSelected((d) => addDays(d, -7))}
              onNext={() => setCalendarSelected((d) => addDays(d, 7))}
              onLabelClick={() => setMonthSheetOpen(true)}
            />
            <WeekDays
              days={calendarWeekDays}
              selected={calendarSelected}
              onSelect={setCalendarSelected}
            />
            <SectionHeader title={dayHeaderLabel(calendarSelected)} />
            <div style={list}>
              {events.isLoading ? (
                <span style={{ ...typography.body, color: colors.textSecondary }}>
                  {t('common.loading')}
                </span>
              ) : events.isError ? (
                <span style={{ ...typography.body, color: colors.error }}>
                  {t('common.error')}
                </span>
              ) : calendarEvents.length === 0 ? (
                <div style={{ padding: `${spacing['24']}px 0` }}>
                  <EmptyState title={t('schedule.calendar.empty')} />
                </div>
              ) : (
                calendarEvents.map((ev) => (
                  <DayEventRow
                    key={ev.id}
                    kind={ev.type === 'game' ? 'game' : 'training'}
                    startLabel={formatTime(ev.starts_at)}
                    endLabel={ev.ends_at ? formatTime(ev.ends_at) : undefined}
                    title={titleFor(ev)}
                    subtitle={venueFor(ev)}
                    count={ev.attendance.going}
                    total={teamSize}
                    completed={ev.status === 'completed'}
                    completedLabel={t('schedule.completed')}
                    onClick={() => router.push(`/events/${ev.id}`)}
                  />
                ))
              )}
            </div>
            <MonthSheet
              open={monthSheetOpen}
              onClose={() => setMonthSheetOpen(false)}
              selected={calendarSelected}
              onSelect={setCalendarSelected}
              eventDayKeys={eventDayKeys}
              dayShortLabels={monthSheetDayShort}
              prevMonthAriaLabel={t('schedule.calendar.prevMonth')}
              nextMonthAriaLabel={t('schedule.calendar.nextMonth')}
            />
          </>
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
                {groups.completed.length > 0 && (
                  <>
                    <SectionHeader title={t('schedule.sections.completed')} />
                    <div style={list}>{groups.completed.map(renderCardCompleted)}</div>
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
          bottom={BOTTOM_NAV_HEIGHT + 24}
        />
      ) : null}
    </div>
  );
}
