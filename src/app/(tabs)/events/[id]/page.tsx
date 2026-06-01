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
import { ArenaSheet, type ArenaFormValue, type ArenaInitial } from '@/components/finance-sheet/arena-sheet';
import { Button } from '@/components/button';
import { useEvent } from '@/hooks/use-event';
import { useEvents } from '@/hooks/use-events';
import { useEventResult } from '@/hooks/use-event-result';
import { useVoteEvent } from '@/hooks/use-vote-event';
import { useMe } from '@/hooks/use-me';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { useVenues } from '@/hooks/use-venues';
import { useCreateFinance } from '@/hooks/use-create-finance';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { formatEventDateRange } from '@/lib/event-format';
import { formatMoney } from '@/lib/format-money';
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
  const eventsQ = useEvents();
  const venuesQ = useVenues();
  const createFinance = useCreateFinance();
  const [menuOpen, setMenuOpen] = useState(false);
  const [arenaOpen, setArenaOpen] = useState(false);
  const [arenaError, setArenaError] = useState<string | null>(null);

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

        {/* АРЕНДА — три состояния (v0.5, итерация 51.1, organizer-only):
              • не оплачено: блок «Сумма» + кнопка «Оплатить аренду»
              • частично:   блок «Оплачено N из M» + кнопка «Доплатить аренду»
              • полностью:  компактный зелёный чип «Аренда оплачена · {amount}» */}
        {isOrganizer ? (
          <ArenaPaymentBlock
            arenaCost={data.arena_cost}
            arenaPaidAmount={data.arena_paid_amount}
            onOpenSheet={() => {
              setArenaError(null);
              setArenaOpen(true);
            }}
            labels={{
              title: t('eventDetail.arena.title'),
              amountUnset: t('eventDetail.arena.amountUnset'),
              payButton: t('eventDetail.arena.payButton'),
              partialButton: t('eventDetail.arena.partial.button'),
              partialSummary: t('eventDetail.arena.partial.summary'),
              paid: t('eventDetail.arena.paid'),
            }}
          />
        ) : null}

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

      {/* ArenaSheet с предзаполнением из текущего события (v0.5, итерация 51).
          События для picker'а тянем через useEvents — пользователь может
          переключить событие, поля автоматически перезаполнятся из нового. */}
      {isOrganizer ? (
        <ArenaSheet
          open={arenaOpen}
          onClose={() => setArenaOpen(false)}
          mode="create"
          initial={makeArenaInitialFromEvent({
            event_id: data.id,
            arena_cost: data.arena_cost,
            arena_paid_amount: data.arena_paid_amount,
            starts_at: data.starts_at,
            venue_name: data.venue?.name ?? null,
          })}
          events={eventsQ.data?.events ?? []}
          venues={venuesQ.data?.venues ?? []}
          onSubmit={(v: ArenaFormValue) => {
            setArenaError(null);
            createFinance.mutate(
              {
                type: 'expense',
                category: 'arena',
                amount: v.amount,
                event_id: v.event_id,
                occurred_on: v.occurred_on,
                description: v.description,
              },
              {
                onSuccess: () => setArenaOpen(false),
                onError: (e) => setArenaError(e.message),
              },
            );
          }}
          isSaving={createFinance.isPending}
          error={arenaError}
        />
      ) : null}
    </div>
  );
}

// Собираем ArenaInitial из полей события для предзаполнения sheet'а.
// Без id транзакции — sheet работает в create-режиме (новая запись).
// Сумма по умолчанию — оставшийся долг (arena_cost − arena_paid_amount),
// чтобы для доплаты сразу подставлялась нужная сумма.
function makeArenaInitialFromEvent(args: {
  event_id: string;
  arena_cost: number | null;
  arena_paid_amount: number;
  starts_at: string;
  venue_name: string | null;
}): ArenaInitial {
  const d = new Date(args.starts_at);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const remaining =
    args.arena_cost != null ? args.arena_cost - args.arena_paid_amount : null;
  return {
    event_id: args.event_id,
    amount: remaining != null && remaining > 0 ? remaining : args.arena_cost,
    occurred_on: `${y}-${m}-${day}`,
    description: args.venue_name,
  };
}

// Блок «Аренда события» с тремя состояниями. Расположен между «Участники и
// взносы» и списком ссылок. Состояние определяется парой (arena_cost,
// arena_paid_amount):
//   • cost == null/0 → нет цены, кнопка «Оплатить аренду» с пометкой «Сумма
//     не указана» — открывает sheet, организатор вводит сумму руками;
//   • cost > 0 && paid == 0 → блок «Сумма + кнопка Оплатить аренду»;
//   • 0 < paid < cost → блок «Оплачено N из M» + кнопка «Доплатить аренду»;
//   • paid >= cost > 0 → компактный зелёный чип «Аренда оплачена · сумма».
function ArenaPaymentBlock({
  arenaCost,
  arenaPaidAmount,
  onOpenSheet,
  labels,
}: {
  arenaCost: number | null;
  arenaPaidAmount: number;
  onOpenSheet: () => void;
  labels: {
    title: string;
    amountUnset: string;
    payButton: string;
    partialButton: string;
    partialSummary: string;
    paid: string;
  };
}) {
  const cost = arenaCost ?? 0;
  const paid = arenaPaidAmount ?? 0;
  const fullyPaid = cost > 0 && paid >= cost;
  const partial = paid > 0 && paid < cost;

  // Полностью оплачено — компактный зелёный чип, кнопка пропадает.
  if (fullyPaid) {
    const wrap: CSSProperties = {
      background: colors.successBg,
      borderRadius: radius.lg,
      padding: `${spacing['12']}px ${spacing['16']}px`,
      display: 'flex',
      alignItems: 'center',
      gap: spacing['10'],
      border: `1px solid ${colors.successBg}`,
      color: colors.successDark,
    };
    return (
      <div style={wrap}>
        <IconCheck size={18} color={colors.successDark} />
        <span style={{ ...typography.bodyBold, color: colors.successDark }}>
          {interp(labels.paid, { amount: formatMoney(paid) })}
        </span>
      </div>
    );
  }

  // Не оплачено или частично — карточка с заголовком, суммой и кнопкой.
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['16'],
    border: `1px solid ${colors.line}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };
  return (
    <div style={card}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: spacing['8'],
        }}
      >
        <span style={{ ...typography.bodyBold, color: colors.text }}>{labels.title}</span>
        <span
          style={{
            ...typography.h2,
            color: cost > 0 ? colors.error : colors.textTertiary,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {cost > 0 ? formatMoney(cost) : labels.amountUnset}
        </span>
      </div>

      {partial ? (
        <div style={{ ...typography.sm, color: colors.textSecondary }}>
          {interp(labels.partialSummary, {
            paid: formatMoney(paid),
            total: formatMoney(cost),
          })}
        </div>
      ) : null}

      <Button variant="primary" size="md" fullWidth onClick={onOpenSheet}>
        {partial ? labels.partialButton : labels.payButton}
      </Button>
    </div>
  );
}
