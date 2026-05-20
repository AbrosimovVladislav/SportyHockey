'use client';

import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DarkHeader } from '@/components/dark-header';
import { GlassButton } from '@/components/glass-button';
import { ListRow } from '@/components/list-row';
import { AvatarStack } from '@/components/avatar-stack';
import { ProgressBar } from '@/components/progress-bar';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import {
  IconBack,
  IconMore,
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
} from '@/components/icons';
import { useEvent } from '@/hooks/use-event';
import { useVoteEvent } from '@/hooks/use-vote-event';
import { useMe } from '@/hooks/use-me';
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

  const data = ev.data;
  const isTraining = data?.type !== 'game';
  const myVote = useMemo<EventAttendee['vote'] | undefined>(() => {
    if (!data || !me.data) return undefined;
    return data.attendees.find((a) => a.user_id === me.data!.user.id)?.vote ?? null;
  }, [data, me.data]);

  const goingAttendees = useMemo(() => (data?.attendees ?? []).filter((a) => a.vote === 'going'), [data]);
  const noAnswer = data ? data.team_size - data.attendance.going - data.attendance.not_going : 0;

  const fund = useMemo(() => {
    if (!data) return null;
    if (!data.arena_cost || !data.cost_per_player) return null;
    const target = data.arena_cost;
    const got = data.attendance.going * data.cost_per_player;
    return { target, got };
  }, [data]);

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

  const venueName = data?.venue?.name ?? data?.venue_text ?? '';
  const venueAddress = data?.venue?.address ?? null;
  const hasVenue = Boolean(venueName);

  const headerSubtitle = data ? (
    <div style={{ fontSize: 14, color: colors.textInverse, opacity: 0.92, lineHeight: 1.4 }}>
      <div>{formatEventDateRange(data.starts_at, data.ends_at)}</div>
      {hasVenue ? <div style={{ marginTop: 2 }}>{venueName}</div> : null}
    </div>
  ) : null;

  const renderHeader = (titleOverride?: string) => (
    <DarkHeader
      title={titleOverride ?? titleText}
      subtitle={headerSubtitle ?? undefined}
      imageSrc="/arena.png"
      left={
        <GlassButton ariaLabel={t('schedule.backLabel')} onClick={() => router.back()} size={40}>
          <IconBack size={20} color={colors.textInverse} />
        </GlassButton>
      }
      right={
        <GlassButton
          ariaLabel={t('eventDetail.menuLabel')}
          onClick={() => alert(t('eventDetail.soon'))}
          size={40}
        >
          <IconMore size={20} color={colors.textInverse} />
        </GlassButton>
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
        {isCompleted ? (
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
        ) : (
          /* VOTE */
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
        )}

        {/* СОСТАВ И ЯВКА */}
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
              {t('eventDetail.attendees.title')}
            </span>
            <IconChevronRight />
          </div>
          <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: spacing['12'] }}>
            {interp(t('eventDetail.attendees.summary'), {
              going: data.attendance.going,
              total: data.team_size,
              noAnswer: Math.max(0, noAnswer),
            })}
          </div>
          {goingAttendees.length > 0 ? (
            <div style={{ marginBottom: fund ? spacing['12'] : 0 }}>
              <AvatarStack
                items={goingAttendees.map((a) => ({
                  src: a.photo_url,
                  name: formatName(a),
                }))}
              />
            </div>
          ) : null}
          {fund ? (
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
                  {interp(t('eventDetail.attendees.target'), {
                    got: formatRub(fund.got),
                    target: formatRub(fund.target),
                  })}
                </span>
              </div>
            </>
          ) : null}
        </button>

        {/* ССЫЛКИ */}
        <ListRow
          icon={<IconShirt size={20} color={colors.iconFg} />}
          title={t('eventDetail.links.teams.title')}
          subtitle={t('eventDetail.links.teams.subtitle')}
          onClick={() => router.push(`/events/${id}/lineup`)}
        />
        <ListRow
          icon={<IconStats size={20} color={colors.iconFg} />}
          title={t('eventDetail.links.stats.title')}
          subtitle={t('eventDetail.links.stats.subtitle')}
          onClick={() => alert(t('eventDetail.soon'))}
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
          subtitle={interp(t('eventDetail.links.media.subtitle'), { count: 0 })}
          onClick={() => alert(t('eventDetail.soon'))}
        />
      </div>
    </div>
  );
}
