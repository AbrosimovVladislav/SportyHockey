'use client';

import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { BackButton } from '@/components/back-button';
import { RoundIconButton } from '@/components/round-icon-button';
import { Button } from '@/components/button';
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

const HERO_HEIGHT = 360;

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
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: bg,
    color: fg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['8'] }}>
      <span style={circle}>
        {kind === 'noAnswer' ? (
          <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>−</span>
        ) : (
          <Icon size={16} color={fg} />
        )}
      </span>
      <span style={{ fontSize: 28, fontWeight: 800, color: colors.text, fontVariantNumeric: 'tabular-nums' }}>
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

export default function EventDetailPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  useTgHeader('#233F30');

  const me = useMe();
  const ev = useEvent(id);
  const vote = useVoteEvent(id);

  const data = ev.data;
  const isTraining = data?.type !== 'game';
  const myVote = useMemo<EventAttendee['vote'] | undefined>(() => {
    if (!data || !me.data) return undefined;
    return data.attendees.find((a) => a.user_id === me.data!.user.id)?.vote ?? null;
  }, [data, me.data]);

  const goingAttendees = useMemo(() => (data?.attendees ?? []).filter((a) => a.vote === 'going'), [data]);
  const noAnswer = data ? data.team_size - data.attendance.going - data.attendance.not_going : 0;

  const fund = useMemo(() => {
    if (!data || !data.cost_per_player) return null;
    const target = data.team_size * data.cost_per_player;
    const got = data.attendance.going * data.cost_per_player;
    return { target, got };
  }, [data]);

  const wrap: CSSProperties = {
    background: colors.bgWarm,
    minHeight: '100dvh',
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const hero: CSSProperties = {
    position: 'relative',
    height: HERO_HEIGHT,
    background: `linear-gradient(180deg, ${colors.headerBg} 0%, ${colors.primaryDark} 60%, #0F2A1B 100%)`,
    overflow: 'hidden',
  };

  const heroOverlay: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
  };

  const heroTopBar: CSSProperties = {
    position: 'absolute',
    top: spacing['16'],
    left: spacing['16'],
    right: spacing['16'],
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  };

  const heroBottom: CSSProperties = {
    position: 'absolute',
    left: spacing['20'],
    right: spacing['20'],
    bottom: spacing['32'],
    color: colors.textInverse,
    zIndex: 2,
  };

  const sheet: CSSProperties = {
    background: colors.bgWarm,
    borderRadius: '24px 24px 0 0',
    marginTop: -24,
    position: 'relative',
    zIndex: 3,
    padding: `${spacing['20']}px ${spacing['16']}px 0`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };

  const meName = me.data ? formatName(me.data.user) : '';
  const voteQuestion = isTraining
    ? t('eventDetail.vote.question.training')
    : t('eventDetail.vote.question.game');

  const handleVote = (next: 'going' | 'not_going') => {
    if (vote.isPending) return;
    vote.mutate(next);
  };

  const titleText = data?.title?.trim()
    ? data.title
    : isTraining
      ? t('eventDetail.title.training')
      : t('eventDetail.title.game');

  if (ev.isLoading || !data) {
    return (
      <div style={wrap}>
        <div style={hero}>
          <div style={heroOverlay} />
          <div style={heroTopBar}>
            <BackButton ariaLabel={t('schedule.backLabel')} />
            <RoundIconButton ariaLabel={t('eventDetail.menuLabel')}>
              <IconMore size={22} color={colors.text} />
            </RoundIconButton>
          </div>
        </div>
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
        <div style={hero}>
          <div style={heroOverlay} />
          <div style={heroTopBar}>
            <BackButton ariaLabel={t('schedule.backLabel')} />
          </div>
        </div>
        <div style={sheet}>
          <span style={{ ...typography.body, color: colors.error }}>
            {t('eventDetail.errors.notFound')}
          </span>
        </div>
      </div>
    );
  }

  const venueParts = (data.venue_text ?? '').split('•').map((s) => s.trim()).filter(Boolean);
  const venueMain = venueParts[0] ?? data.venue_text ?? '';
  const venueSub = venueParts.slice(1).join(' • ');

  return (
    <div style={wrap}>
      {/* HERO */}
      <div style={hero}>
        <div style={heroOverlay} />
        <div style={heroTopBar}>
          {/* Тут BackButton рендерится только если history > 1; для случая прямого захода — заменим на свой круг */}
          <RoundIconButton
            ariaLabel={t('schedule.backLabel')}
            onClick={() => history.back()}
          >
            <IconBack size={20} color={colors.text} />
          </RoundIconButton>
          <RoundIconButton
            ariaLabel={t('eventDetail.menuLabel')}
            onClick={() => alert(t('eventDetail.soon'))}
          >
            <IconMore size={22} color={colors.text} />
          </RoundIconButton>
        </div>
        <div style={heroBottom}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            {titleText}
          </div>
          <div style={{ fontSize: 15, marginTop: spacing['8'], opacity: 0.95 }}>
            {formatEventDateRange(data.starts_at, data.ends_at)}
          </div>
          {data.venue_text ? (
            <div style={{ fontSize: 15, marginTop: spacing['4'], opacity: 0.9 }}>
              {data.venue_text}
            </div>
          ) : null}
        </div>
      </div>

      {/* SHEET */}
      <div style={sheet}>
        {/* VOTE */}
        <SectionCard>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing['10'],
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing['6'], flex: 1, minWidth: 180 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>
                {meName ? `${meName}, ${voteQuestion}` : voteQuestion}
              </span>
              <IconInfo size={16} color={colors.textTertiary} />
            </div>
            <div style={{ display: 'flex', gap: spacing['8'] }}>
              <Button
                variant={myVote === 'going' ? 'primary' : 'secondary'}
                size="md"
                onClick={() => handleVote('going')}
                disabled={vote.isPending}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <IconCheck size={16} color={myVote === 'going' ? colors.textInverse : colors.text} />
                  {t('eventDetail.vote.going')}
                </span>
              </Button>
              <Button
                variant={myVote === 'not_going' ? 'danger' : 'secondary'}
                size="md"
                onClick={() => handleVote('not_going')}
                disabled={vote.isPending}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <IconClose size={16} color={myVote === 'not_going' ? colors.textInverse : colors.text} />
                  {t('eventDetail.vote.notGoing')}
                </span>
              </Button>
            </div>
          </div>
        </SectionCard>

        {/* СОСТАВ И ЯВКА */}
        <SectionCard>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing['16'],
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 700, color: colors.text }}>
              {t('eventDetail.attendance.title')}
            </span>
            <IconInfo size={18} color={colors.textTertiary} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing['12'] }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <StatusCircle kind="going" count={data.attendance.going} />
              <span style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 36 }}>
                {t('eventDetail.attendance.going')}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <StatusCircle kind="notGoing" count={data.attendance.not_going} />
              <span style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 36 }}>
                {t('eventDetail.attendance.notGoing')}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <StatusCircle kind="noAnswer" count={Math.max(0, noAnswer)} />
              <span style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 36 }}>
                {t('eventDetail.attendance.noAnswer')}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* УЧАСТНИКИ И ВЗНОСЫ */}
        <button
          type="button"
          className="pressable"
          onClick={() => alert(t('eventDetail.soon'))}
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
          onClick={() => alert(t('eventDetail.soon'))}
        />
        <ListRow
          icon={<IconStats size={20} color={colors.iconFg} />}
          title={t('eventDetail.links.stats.title')}
          subtitle={t('eventDetail.links.stats.subtitle')}
          onClick={() => alert(t('eventDetail.soon'))}
        />

        {/* ПЛОЩАДКА */}
        {data.venue_text ? (
          <ListRow
            icon={<IconLocation size={20} color={colors.iconFg} />}
            title={t('eventDetail.links.venue')}
            subtitle={[venueMain, venueSub].filter(Boolean).join('\n')}
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
