'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DarkHeader } from '@/components/dark-header';
import { GlassButton } from '@/components/glass-button';
import { ListRow } from '@/components/list-row';
import { Avatar } from '@/components/avatar';
import { AvatarStack } from '@/components/avatar-stack';
import { ProgressBar } from '@/components/progress-bar';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { BottomSheet } from '@/components/bottom-sheet';
import { MenuButton } from '@/components/menu-button';
import { EventHeaderBadge } from '@/components/event-header-badge';
import { PlayerVoteCompact } from '@/components/player-vote-compact';
import { PlayerLineupBlock } from '@/components/player-lineup-block';
import { PlayerCompletedBlock } from '@/components/player-completed-block';
import {
  IconBack,
  IconSettings,
  IconInfo,
  IconCheck,
  IconClose,
  IconChevronRight,
  IconShirt,
  IconStats,
  IconLocation,
  IconExternal,
  IconImage,
  IconRuble,
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
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { EventAttendee } from '@/types/api';

function interp(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

function formatRub(n: number): string {
  return n.toLocaleString('ru-RU');
}

function StatusCircle({ kind, count }: { kind: 'going' | 'notGoing' | 'noAnswer'; count: number }) {
  const meta = {
    going: { bg: colors.success, fg: colors.textInverse, Icon: IconCheck },
    notGoing: { bg: colors.error, fg: colors.textInverse, Icon: IconClose },
    noAnswer: { bg: colors.textTertiary, fg: colors.textInverse, Icon: IconClose },
  } as const;
  const { bg, fg, Icon } = meta[kind];

  const circle: CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: bg,
    color: fg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['6'] }}>
      <span style={circle}>
        {kind === 'noAnswer' ? (
          <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>−</span>
        ) : (
          <Icon size={13} color={fg} />
        )}
      </span>
      <span style={{ fontSize: 20, fontWeight: 700, color: colors.text, fontVariantNumeric: 'tabular-nums' }}>
        {count}
      </span>
    </div>
  );
}

function SectionCard({ children, padding }: { children: ReactNode; padding?: number }) {
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: padding ?? spacing['16'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
  };
  return <div style={card}>{children}</div>;
}

type VotePillProps = {
  active: boolean;
  kind: 'going' | 'notGoing';
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

function VotePill({ active, kind, label, onClick, disabled }: VotePillProps) {
  const isGoing = kind === 'going';
  const activeBg = isGoing ? colors.success : colors.error;
  const inactiveBg = colors.bg;
  const inactiveColor = colors.text;
  const Icon = isGoing ? IconCheck : IconClose;
  const iconColor = active ? colors.textInverse : inactiveColor;

  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '5px 8px',
    borderRadius: radius.md,
    background: active ? activeBg : inactiveBg,
    color: active ? colors.textInverse : inactiveColor,
    border: active ? 'none' : `1px solid ${colors.border}`,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: '16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0,
    minHeight: 28,
    whiteSpace: 'nowrap',
  };

  return (
    <button type="button" className="pressable" onClick={onClick} disabled={disabled} style={style}>
      <Icon size={12} color={iconColor} />
      {label}
    </button>
  );
}

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

  const voteQuestion = isTraining
    ? t('eventDetail.vote.question.training')
    : t('eventDetail.vote.question.game');

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
        <GlassButton ariaLabel={t('schedule.backLabel')} onClick={() => router.back()} size={40}>
          <IconBack size={20} color={colors.textInverse} />
        </GlassButton>
      }
      right={
        canEditEvent ? (
          <GlassButton
            ariaLabel={t('eventDetail.menuLabel')}
            onClick={() => setMenuOpen(true)}
            size={40}
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

  return (
    <div style={wrap}>
      {renderHeader()}

      {/* SHEET */}
      <div style={sheet}>
        {!isTraining && (ourTeamName || data.opponent_name) ? (
          <SectionCard padding={spacing['12']}>
            <button
              type="button"
              className="pressable"
              onClick={() => router.push(`/events/${id}/result`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing['8'],
                width: '100%',
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                color: colors.text,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing['6'],
                }}
              >
                <Avatar src={null} name={ourTeamName || '—'} size={44} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: colors.text,
                    textAlign: 'center',
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {ourTeamName || '—'}
                </span>
              </div>
              {eventResult.data ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing['8'],
                    flexShrink: 0,
                    padding: `0 ${spacing['8']}px`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: colors.text,
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1,
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {eventResult.data.score.score_a}
                  </span>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: colors.textTertiary,
                      lineHeight: 1,
                    }}
                  >
                    :
                  </span>
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: colors.text,
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1,
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {eventResult.data.score.score_b}
                  </span>
                </div>
              ) : (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: colors.textTertiary,
                    letterSpacing: '0.05em',
                    flexShrink: 0,
                  }}
                >
                  {t('eventDetail.vs')}
                </span>
              )}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing['6'],
                }}
              >
                <Avatar src={null} name={data.opponent_name || '—'} size={44} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: colors.text,
                    textAlign: 'center',
                    lineHeight: 1.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {data.opponent_name || '—'}
                </span>
              </div>
            </button>
          </SectionCard>
        ) : null}

        {isCompleted && !isOrganizer ? (
          /* Player — Состояние 3: Оплата + CTA */
          <PlayerCompletedBlock
            isGame={!!isGame}
            costPerPlayer={data.cost_per_player}
            paidAmount={myPaidAmount}
            labels={{
              paid: t('eventDetail.player.completed.payment.paid'),
              partial: t('eventDetail.player.completed.payment.partial'),
              due: t('eventDetail.player.completed.payment.due'),
              partialOf: t('eventDetail.player.completed.payment.partialOf'),
              statsTitle: t('eventDetail.player.completed.cta.stats.title'),
              statsSubtitle: t('eventDetail.player.completed.cta.stats.subtitle'),
              mediaTitle: t('eventDetail.player.completed.cta.media.title'),
              mediaSubtitleTraining: t('eventDetail.player.completed.cta.media.subtitleTraining'),
              mediaSubtitleGame: t('eventDetail.player.completed.cta.media.subtitleGame'),
            }}
            onOpenStats={() => router.push(`/events/${id}/result`)}
            onOpenMedia={() => router.push(`/events/${id}/media`)}
          />
        ) : isCompleted ? (
          /* Organizer — завершено: компактный статус */
          <SectionCard padding={spacing['10']}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: radius.sm,
                background: colors.bgMuted,
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {t('eventDetail.status.completed')}
            </span>
          </SectionCard>
        ) : isOrganizer ? (
          /* VOTE (organizer — компактный) */
          <SectionCard padding={spacing['10']}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing['6'],
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: colors.text,
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {voteQuestion}
              </span>
              <div style={{ display: 'flex', gap: spacing['4'], flexShrink: 0 }}>
                <VotePill
                  active={myVote === 'going'}
                  kind="going"
                  label={t('eventDetail.vote.going')}
                  onClick={() => handleVote('going')}
                  disabled={vote.isPending}
                />
                <VotePill
                  active={myVote === 'not_going'}
                  kind="notGoing"
                  label={t('eventDetail.vote.notGoing')}
                  onClick={() => handleVote('not_going')}
                  disabled={vote.isPending}
                />
              </div>
            </div>
          </SectionCard>
        ) : myVote == null ? (
          /* Player — Состояние 1: большой блок голосования */
          <PlayerVoteBlock
            question={
              isTraining
                ? t('eventDetail.vote.player.question.training')
                : t('eventDetail.vote.player.question.game')
            }
            goingLabel={t('eventDetail.vote.player.going')}
            notGoingLabel={t('eventDetail.vote.player.notGoing')}
            myVote={null}
            disabled={vote.isPending}
            onVote={handleVote}
          />
        ) : (
          /* Player — Состояние 2: компактный голос + Моё звено */
          <>
            <PlayerVoteCompact
              question={
                isTraining
                  ? t('eventDetail.vote.player.question.training')
                  : t('eventDetail.vote.player.question.game')
              }
              goingLabel={t('eventDetail.vote.player.going')}
              notGoingLabel={t('eventDetail.vote.player.notGoing')}
              myVote={myVote === 'going' || myVote === 'not_going' ? myVote : null}
              disabled={vote.isPending}
              onVote={handleVote}
            />
            <PlayerLineupBlock
              myUserId={me.data?.user.id ?? ''}
              myVote={myVote === 'going' || myVote === 'not_going' ? myVote : null}
              mySide={mySide}
              isGame={!!isGame}
              attendees={data.attendees}
              lines={data.lines}
              labels={{
                title: t('eventDetail.player.lineup.title'),
                viewAll: t('eventDetail.player.lineup.viewAll'),
                you: t('eventDetail.player.lineup.you'),
                sideOnlyTitleTemplate: t('eventDetail.player.lineup.sideOnly.title'),
                sideOnlyHint: t('eventDetail.player.lineup.sideOnly.hint'),
                notInRosterTitle: t('eventDetail.player.lineup.notInRoster'),
                notInRosterHint: t('eventDetail.player.lineup.notInRoster.hint'),
                notGoingTitle: t('eventDetail.player.lineup.notGoing'),
                notGoingHint: t('eventDetail.player.lineup.notGoing.hint'),
                linePrefix: t('eventDetail.player.lineup.linePrefix'),
                defensePrefix: t('eventDetail.player.lineup.defensePrefix'),
                goalieLabel: t('eventDetail.player.lineup.goalie'),
                sideLight: t('eventDetail.player.side.light'),
                sideDark: t('eventDetail.player.side.dark'),
                positions: {
                  lw: t('eventDetail.player.position.lw'),
                  c: t('eventDetail.player.position.c'),
                  rw: t('eventDetail.player.position.rw'),
                  ld: t('eventDetail.player.position.ld'),
                  rd: t('eventDetail.player.position.rd'),
                  g: t('eventDetail.player.position.g'),
                  g1: t('eventDetail.player.position.g'),
                  g2: t('eventDetail.player.position.g'),
                },
              }}
              onOpenLineup={() => router.push(`/events/${id}/lineup`)}
            />
          </>
        )}

        {/* СОСТАВ И ЯВКА — только organizer */}
        {isOrganizer ? (
          <SectionCard padding={spacing['12']}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing['10'],
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>
                {t('eventDetail.attendance.title')}
              </span>
              <IconInfo size={16} color={colors.textTertiary} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing['12'] }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <StatusCircle kind="going" count={data.attendance.going} />
                <span style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 28 }}>
                  {t('eventDetail.attendance.going')}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <StatusCircle kind="notGoing" count={data.attendance.not_going} />
                <span style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 28 }}>
                  {t('eventDetail.attendance.notGoing')}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <StatusCircle kind="noAnswer" count={Math.max(0, noAnswer)} />
                <span style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 28 }}>
                  {t('eventDetail.attendance.noAnswer')}
                </span>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {/* УЧАСТНИКИ И ВЗНОСЫ */}
        <button
          type="button"
          className="pressable"
          onClick={() => router.push(`/events/${id}/attendees`)}
          style={{
            background: colors.bg,
            borderRadius: radius.lg,
            padding: spacing['16'],
            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
            border: 'none',
            width: '100%',
            textAlign: 'left',
            color: colors.text,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing['8'],
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 700, color: colors.text }}>
              {isOrganizer
                ? t('eventDetail.attendees.title')
                : t('eventDetail.attendees.titlePlayer')}
            </span>
            <IconChevronRight />
          </div>
          <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: spacing['12'] }}>
            {data.status === 'completed'
              ? interp(t('eventDetail.attendees.summaryCompleted'), {
                  showed: showedAttendees.length,
                  total: data.team_size,
                })
              : interp(t('eventDetail.attendees.summary'), {
                  going: data.attendance.going,
                  total: data.team_size,
                  noAnswer: Math.max(0, noAnswer),
                })}
          </div>
          {(() => {
            const rosterForAvatars =
              data.status === 'completed' ? showedAttendees : goingAttendees;
            return rosterForAvatars.length > 0 ? (
              <div style={{ marginBottom: isOrganizer && fund ? spacing['12'] : 0 }}>
                <AvatarStack
                  items={rosterForAvatars.map((a) => ({
                    src: a.photo_url,
                    name: formatName(a),
                  }))}
                />
              </div>
            ) : null;
          })()}
          {isOrganizer && fund ? (
            <>
              <div style={{ marginBottom: spacing['10'] }}>
                <ProgressBar value={fund.got} total={fund.target} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing['8'] }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: colors.primaryLight,
                    color: colors.primary,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconRuble size={16} color={colors.primary} />
                </span>
                <span style={{ fontSize: 14, color: colors.text }}>
                  {interp(
                    t(
                      fund.mode === 'collected'
                        ? 'eventDetail.attendees.collected'
                        : 'eventDetail.attendees.target',
                    ),
                    {
                      got: formatRub(fund.got),
                      target: formatRub(fund.target),
                    },
                  )}
                </span>
              </div>
            </>
          ) : null}
        </button>

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

type PlayerVoteBlockProps = {
  question: string;
  goingLabel: string;
  notGoingLabel: string;
  myVote: 'going' | 'not_going' | null;
  disabled: boolean;
  onVote: (next: 'going' | 'not_going') => void;
};

function PlayerVoteBlock({
  question,
  goingLabel,
  notGoingLabel,
  myVote,
  disabled,
  onVote,
}: PlayerVoteBlockProps) {
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: `${spacing['20']}px ${spacing['16']}px`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
    alignItems: 'stretch',
  };
  const title: CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 1.3,
  };
  const stack: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
  };
  return (
    <div style={card}>
      <span style={title}>{question}</span>
      <div style={stack}>
        <PlayerVoteButton
          kind="going"
          active={myVote === 'going'}
          label={goingLabel}
          disabled={disabled}
          onClick={() => onVote('going')}
        />
        <PlayerVoteButton
          kind="notGoing"
          active={myVote === 'not_going'}
          label={notGoingLabel}
          disabled={disabled}
          onClick={() => onVote('not_going')}
        />
      </div>
    </div>
  );
}

type PlayerVoteButtonProps = {
  kind: 'going' | 'notGoing';
  active: boolean;
  label: string;
  disabled: boolean;
  onClick: () => void;
};

function PlayerVoteButton({ kind, active, label, disabled, onClick }: PlayerVoteButtonProps) {
  const isGoing = kind === 'going';
  const activeBg = isGoing ? colors.primary : colors.bgMuted;
  const activeColor = isGoing ? colors.textInverse : colors.text;
  const inactiveBorder = isGoing ? colors.primary : colors.border;
  const inactiveColor = isGoing ? colors.primary : colors.textSecondary;
  const Icon = isGoing ? IconCheck : IconClose;
  const iconColor = active ? activeColor : inactiveColor;

  const style: CSSProperties = {
    width: '100%',
    minHeight: 56,
    borderRadius: radius.md,
    padding: `${spacing['12']}px ${spacing['20']}px`,
    background: active ? activeBg : colors.bg,
    color: active ? activeColor : inactiveColor,
    border: active ? 'none' : `1.5px solid ${inactiveBorder}`,
    fontSize: 16,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['8'],
  };

  const iconWrap: CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: `1.5px solid ${iconColor}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  return (
    <button type="button" className="pressable" onClick={onClick} disabled={disabled} style={style}>
      <span style={iconWrap}>
        <Icon size={14} color={iconColor} />
      </span>
      {label}
    </button>
  );
}
