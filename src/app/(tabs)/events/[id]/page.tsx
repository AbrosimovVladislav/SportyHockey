'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DarkHeader } from '@/components/dark-header';
import { GlassButton } from '@/components/glass-button';
import { ListRow } from '@/components/list-row';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { BottomSheet } from '@/components/bottom-sheet';
import { MenuButton } from '@/components/menu-button';
import { EventHeaderBadge } from '@/components/event-header-badge';
import { EventVsCard } from '@/components/event-vs-card';
import { EventVoteSection } from '@/components/event-vote-section';
import { EventAttendanceStats } from '@/components/event-attendance-stats';
import { EventAttendeesCard } from '@/components/event-attendees-card';
import {
  IconBack,
  IconSettings,
  IconCheck,
  IconClose,
  IconShirt,
  IconStats,
  IconLocation,
  IconExternal,
  IconImage,
  IconClock,
} from '@/components/icons';
import { useEvent } from '@/hooks/use-event';
import { useEventResult } from '@/hooks/use-event-result';
import { useVoteEvent } from '@/hooks/use-vote-event';
import { useMe } from '@/hooks/use-me';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { formatEventDateRange } from '@/lib/event-format';
import { formatName } from '@/lib/format-name';
import { interp } from '@/lib/format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

export default function EventDetailPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? '';
  useTgHeader('#233F30');

  const me = useMe();
  const ev = useEvent(id);
  const vote = useVoteEvent(id, me.data?.user.id);
  const [menuOpen, setMenuOpen] = useState(false);

  const data = ev.data;
  const isTraining = data?.type !== 'game';
  const isGame = data?.type === 'game';
  const eventResult = useEventResult(isGame ? id : undefined);

  const { isOrganizer } = useIsOrganizer(data?.team_id);
  const canEditEvent = isOrganizer && data?.status === 'scheduled';
  const myAttendee = useMemo(() => {
    if (!data || !me.data) return null;
    return data.attendees.find((a) => a.user_id === me.data!.user.id) ?? null;
  }, [data, me.data]);
  const myVote = myAttendee?.vote ?? null;
  const mySide = myAttendee?.team_side ?? null;
  const myPaidAmount = myAttendee?.paid_amount ?? null;

  const goingAttendees = useMemo(() => (data?.attendees ?? []).filter((a) => a.vote === 'going'), [data]);
  const noAnswer = data ? data.team_size - data.attendance.going - data.attendance.not_going : 0;
  // После завершения в плашке участников показываем явку по факту (roadmap 33.6):
  // и число, и аватары — по тем, кто реально пришёл (showed_up), а не записался.
  const showedAttendees = useMemo(
    () => (data?.attendees ?? []).filter((a) => a.showed_up === true),
    [data],
  );

  const fund = useMemo(() => {
    if (!data) return null;
    const isCompletedNow = data.status === 'completed';
    if (isCompletedNow) {
      const target = data.arena_cost ?? 0;
      const got = data.payments.collected;
      if (target === 0 && got === 0) return null;
      return { target, got, mode: 'collected' as const };
    }
    if (!data.arena_cost || !data.cost_per_player) return null;
    const target = data.arena_cost;
    const got = data.attendance.going * data.cost_per_player;
    return { target, got, mode: 'target' as const };
  }, [data]);

  const ourTeamName = useMemo(() => {
    if (!data || !me.data) return '';
    const m = me.data.memberships.find((x) => x.team_id === data.team_id);
    return m?.team_name ?? '';
  }, [data, me.data]);

  const wrap: CSSProperties = {
    background: colors.bg,
    minHeight: '100dvh',
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const sheet: CSSProperties = {
    background: colors.bg,
    borderRadius: '24px 24px 0 0',
    marginTop: -12,
    position: 'relative',
    zIndex: 2,
    padding: `${spacing['16']}px ${spacing['16']}px 0`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };

  const handleVote = (next: 'going' | 'not_going') => {
    if (vote.isPending) return;
    vote.mutate(myVote === next ? null : next);
  };

  const titleText = data?.title?.trim()
    ? data.title
    : isTraining
      ? t('eventDetail.title.training')
      : t('eventDetail.title.game');

  const venueName = data?.venue?.name ?? '';
  const venueAddress = data?.venue?.address ?? null;
  const hasVenue = Boolean(venueName);

  const headerSubtitle = data ? (
    <div style={{ fontSize: 14, color: colors.textInverse, opacity: 0.92, lineHeight: 1.4 }}>
      <div>{formatEventDateRange(data.starts_at, data.ends_at)}</div>
      {hasVenue ? <div style={{ marginTop: 2 }}>{venueName}</div> : null}
    </div>
  ) : null;

  const isCompletedHeader = data?.status === 'completed';
  const headerBadge =
    !isOrganizer && isCompletedHeader ? (
      <EventHeaderBadge tone="success" icon={<IconCheck size={14} color={colors.textInverse} />}>
        {isTraining
          ? t('eventDetail.player.completed.badge.training')
          : t('eventDetail.player.completed.badge.game')}
      </EventHeaderBadge>
    ) : null;

  const renderHeader = (titleOverride?: string) => (
    <DarkHeader
      title={titleOverride ?? titleText}
      subtitle={headerSubtitle ?? undefined}
      badge={headerBadge ?? undefined}
      imageSrc="/arena.png"
      left={
        <GlassButton ariaLabel={t('schedule.backLabel')} onClick={() => router.back()} size={44}>
          <IconBack size={20} color={colors.textInverse} />
        </GlassButton>
      }
      right={
        canEditEvent ? (
          <GlassButton
            ariaLabel={t('eventDetail.menuLabel')}
            onClick={() => setMenuOpen(true)}
            size={44}
          >
            <IconSettings size={20} color={colors.textInverse} />
          </GlassButton>
        ) : undefined
      }
    />
  );

  if (ev.isLoading || !data) {
    return (
      <div style={wrap}>
        {renderHeader(t('eventDetail.title.training'))}
        <div style={sheet}>
          <span style={{ ...typography.body, color: colors.textSecondary }}>
            {t('common.loading')}
          </span>
        </div>
      </div>
    );
  }
  if (ev.isError) {
    return (
      <div style={wrap}>
        {renderHeader(t('eventDetail.title.training'))}
        <div style={sheet}>
          <span style={{ ...typography.body, color: colors.error }}>
            {t('eventDetail.errors.notFound')}
          </span>
        </div>
      </div>
    );
  }

  const isCompleted = data.status === 'completed';
  const rosterForAvatars = isCompleted ? showedAttendees : goingAttendees;
  const avatarItems = rosterForAvatars.map((a) => ({ src: a.photo_url, name: formatName(a) }));

  return (
    <div style={wrap}>
      {renderHeader()}

      {/* SHEET */}
      <div style={sheet}>
        {!isTraining && (ourTeamName || data.opponent_name) ? (
          <EventVsCard
            ourTeamName={ourTeamName}
            opponentName={data.opponent_name ?? ''}
            score={
              eventResult.data
                ? { a: eventResult.data.score.score_a, b: eventResult.data.score.score_b }
                : null
            }
            vsLabel={t('eventDetail.vs')}
            onClick={() => router.push(`/events/${id}/result`)}
          />
        ) : null}

        {/* СЛОТ ГОЛОСОВАНИЯ — зависит от роли и статуса */}
        <EventVoteSection
          id={id}
          isOrganizer={isOrganizer}
          isCompleted={isCompleted}
          isGame={isGame}
          isTraining={isTraining}
          myVote={myVote}
          mySide={mySide}
          myPaidAmount={myPaidAmount}
          costPerPlayer={data.cost_per_player}
          myUserId={me.data?.user.id ?? ''}
          attendees={data.attendees}
          lines={data.lines}
          votePending={vote.isPending}
          onVote={handleVote}
        />

        {/* СОСТАВ И ЯВКА — только organizer */}
        {isOrganizer ? (
          <EventAttendanceStats
            going={data.attendance.going}
            notGoing={data.attendance.not_going}
            noAnswer={noAnswer}
            title={t('eventDetail.attendance.title')}
            labels={{
              going: t('eventDetail.attendance.going'),
              notGoing: t('eventDetail.attendance.notGoing'),
              noAnswer: t('eventDetail.attendance.noAnswer'),
            }}
          />
        ) : null}

        {/* УЧАСТНИКИ И ВЗНОСЫ */}
        <EventAttendeesCard
          isOrganizer={isOrganizer}
          isCompleted={isCompleted}
          going={data.attendance.going}
          total={data.team_size}
          noAnswer={noAnswer}
          showedCount={showedAttendees.length}
          avatarItems={avatarItems}
          fund={fund}
          labels={{
            titleOrganizer: t('eventDetail.attendees.title'),
            titlePlayer: t('eventDetail.attendees.titlePlayer'),
            summary: t('eventDetail.attendees.summary'),
            summaryCompleted: t('eventDetail.attendees.summaryCompleted'),
            collected: t('eventDetail.attendees.collected'),
            target: t('eventDetail.attendees.target'),
          }}
          onClick={() => router.push(`/events/${id}/attendees`)}
        />

        {/* ССЫЛКИ */}
        <ListRow
          icon={<IconShirt size={20} color={colors.iconFg} />}
          title={
            isTraining
              ? t('eventDetail.links.teams.title')
              : t('eventDetail.links.teams.game.title')
          }
          subtitle={isTraining ? t('eventDetail.links.teams.subtitle') : undefined}
          onClick={() => router.push(`/events/${id}/lineup`)}
        />
        <ListRow
          icon={<IconStats size={20} color={colors.iconFg} />}
          title={t('eventDetail.links.stats.title')}
          subtitle={t('eventDetail.links.stats.subtitle')}
          onClick={() => router.push(`/events/${id}/result`)}
        />

        {/* ПЛОЩАДКА */}
        {hasVenue ? (
          <ListRow
            icon={<IconLocation size={20} color={colors.iconFg} />}
            title={t('eventDetail.links.venue')}
            subtitle={[venueName, venueAddress].filter(Boolean).join('\n')}
            showChevron={false}
            right={
              <button
                type="button"
                className="pressable"
                aria-label="external"
                onClick={(e) => {
                  e.stopPropagation();
                  alert(t('eventDetail.soon'));
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  background: colors.primaryLight,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  color: colors.primary,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <IconExternal size={20} color={colors.primary} />
              </button>
            }
          />
        ) : null}

        {/* МЕДИА */}
        <ListRow
          icon={<IconImage size={20} color={colors.iconFg} />}
          title={t('eventDetail.links.media.title')}
          subtitle={interp(t('eventDetail.links.media.subtitle'), {
            count: data.media_count,
          })}
          onClick={() => router.push(`/events/${id}/media`)}
        />
      </div>

      {canEditEvent ? (
        <BottomSheet
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          title={t('eventMenu.title')}
        >
          <MenuButton
            icon={<IconClock size={20} color={colors.iconFg} />}
            label={t('eventMenu.reschedule')}
            onClick={() => {
              setMenuOpen(false);
              router.push(`/events/${id}/reschedule`);
            }}
          />
          <MenuButton
            icon={<IconClose size={20} color={colors.error} />}
            label={t('eventMenu.cancel')}
            tone="danger"
            onClick={() => {
              setMenuOpen(false);
              router.push(`/events/${id}/cancel`);
            }}
          />
        </BottomSheet>
      ) : null}
    </div>
  );
}
