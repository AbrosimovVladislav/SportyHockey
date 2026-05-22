'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { StatRowSkeleton } from '@/components/skeleton';
import { Button } from '@/components/button';
import { MatchResultChip, outcomeForScore } from '@/components/match-result-chip';
import { MvpCard } from '@/components/mvp-card';
import { EventsTimeline, type TimelineEvent } from '@/components/events-timeline';
import { EventInfoSheet } from '@/components/event-info-sheet';
import { IconShare } from '@/components/icons';
import { formatEventDateRange } from '@/lib/event-format';
import { buildShareText, shareEventImage, shareText } from '@/lib/share-result';
import { BottomSheet } from '@/components/bottom-sheet';
import { ContentTabs } from '@/components/content-tabs';
import { FAB } from '@/components/fab';
import { EmptyState } from '@/components/empty-state';
import { ScoreCard } from '@/components/score-card';
import { GoalRow } from '@/components/goal-row';
import { PenaltyRow } from '@/components/penalty-row';
import { PlayerStatsRow } from '@/components/player-stats-row';
import { AddGoalSheet } from '@/components/add-goal-sheet';
import { AddPenaltySheet } from '@/components/add-penalty-sheet';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import {
  IconPlus,
  IconSticksCrossed,
  IconWhistle,
} from '@/components/icons';
import { useEvent } from '@/hooks/use-event';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useEventResult } from '@/hooks/use-event-result';
import { useAddGoal } from '@/hooks/use-add-goal';
import { useUpdateGoal } from '@/hooks/use-update-goal';
import { useDeleteGoal } from '@/hooks/use-delete-goal';
import { useAddPenalty } from '@/hooks/use-add-penalty';
import { useUpdatePenalty } from '@/hooks/use-update-penalty';
import { useDeletePenalty } from '@/hooks/use-delete-penalty';
import { ApiError } from '@/lib/api-client';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type {
  CreateGoalRequest,
  CreatePenaltyRequest,
  GoalDto,
  GoalParticipant,
  PenaltyDto,
} from '@/types/api';

type TabId = 'overview' | 'events';

export default function EventResultPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  useTgHeader('#FFFFFF');

  const me = useMe();
  const ev = useEvent(id);
  const result = useEventResult(id);
  const addGoal = useAddGoal(id);
  const updGoal = useUpdateGoal(id);
  const delGoal = useDeleteGoal(id);
  const addPenalty = useAddPenalty(id);
  const updPenalty = useUpdatePenalty(id);
  const delPenalty = useDeletePenalty(id);

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isSharing, setIsSharing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [infoEvent, setInfoEvent] = useState<TimelineEvent | null>(null);
  const [goalSheet, setGoalSheet] = useState<{ open: boolean; initial: GoalDto | null }>(
    { open: false, initial: null },
  );
  const [penaltySheet, setPenaltySheet] = useState<{ open: boolean; initial: PenaltyDto | null }>(
    { open: false, initial: null },
  );
  const [goalError, setGoalError] = useState<string | null>(null);
  const [penaltyError, setPenaltyError] = useState<string | null>(null);

  const isOrganizer = useMemo(() => {
    if (!ev.data || !me.data) return false;
    return me.data.memberships.some(
      (m) => m.team_id === ev.data!.team_id && m.role === 'organizer',
    );
  }, [ev.data, me.data]);

  const players: GoalParticipant[] = useMemo(() => {
    if (!ev.data) return [];
    return ev.data.attendees.map<GoalParticipant>((a) => ({
      user_id: a.user_id,
      first_name: a.first_name,
      last_name: a.last_name,
      username: a.username,
      photo_url: a.photo_url,
      jersey_number: a.jersey_number,
      position: a.position,
    }));
  }, [ev.data]);

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(`/events/${id}`);
  };

  const venueName = ev.data?.venue?.name ?? ev.data?.venue_text ?? '';
  const subtitle = ev.data
    ? [formatEventDateRange(ev.data.starts_at, ev.data.ends_at), venueName]
        .filter(Boolean)
        .join(' · ')
    : '';

  const root: CSSProperties = {
    background: colors.bg,
    minHeight: '100dvh',
  };
  const content: CSSProperties = {
    padding: `${spacing['12']}px ${spacing['16']}px ${BOTTOM_NAV_HEIGHT + spacing['48']}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };

  if (result.isLoading || ev.isLoading || !result.data || !ev.data) {
    return (
      <div style={root}>
        <LightHeader title={t('result.title')} subtitle={subtitle} onBack={onBack} />
        <div style={{ padding: `${spacing['16']}px` }}>
          <StatRowSkeleton />
        </div>
      </div>
    );
  }
  if (result.isError || ev.isError) {
    return (
      <div style={root}>
        <LightHeader title={t('result.title')} subtitle={subtitle} onBack={onBack} />
        <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
          <span style={{ ...typography.body, color: colors.error }}>
            {t('eventDetail.errors.notFound')}
          </span>
        </div>
      </div>
    );
  }

  const r = result.data;
  const isGame = r.is_game;
  const sideALabel = isGame ? r.own_team_name || t('result.sides.own') : t('result.sides.light');
  const sideBLabel = isGame
    ? r.opponent_name || t('result.sides.opponent')
    : t('result.sides.dark');

  // Нумерация голов остаётся стабильной (по исходному списку, отсортированному в API по created_at).
  const goalIndexById = new Map<string, number>();
  r.goals.forEach((g, idx) => goalIndexById.set(g.id, idx + 1));

  const mvp = r.stats.find((s) => s.points > 0) ?? null;

  const timelineEvents: TimelineEvent[] = [
    ...r.goals.map<TimelineEvent>((g) => ({ kind: 'goal', goal: g })),
    ...r.penalties.map<TimelineEvent>((p) => ({ kind: 'penalty', penalty: p })),
  ];

  // Тап по таймлайну — просмотр события (не редактирование). Редактировать можно через табу «События».
  const onTimelineSelect = (e: TimelineEvent) => {
    setInfoEvent(e);
  };

  const onShare = async () => {
    setIsSharing(true);
    const text = buildShareText(r, {
      game: {
        vs: ':',
        outcome: {
          win: t('result.outcome.win'),
          draw: t('result.outcome.draw'),
          loss: t('result.outcome.loss'),
        },
      },
      training: { vs: ':' },
      sectionGoals: t('result.share.goalsHeader'),
      unknown: t('result.unknownPlayer'),
      assistsPrefix: t('result.assistsPrefix'),
    });
    // Сначала пробуем поделиться красивой картинкой.
    const imageOutcome = await shareEventImage(id, text, t('result.title'));
    if (imageOutcome === 'shared') {
      setIsSharing(false);
      return;
    }
    if (imageOutcome === 'downloaded') {
      setIsSharing(false);
      if (typeof window !== 'undefined') window.alert(t('result.share.downloaded'));
      return;
    }
    // Картинка не сработала — fallback на текст.
    const textOutcome = await shareText(text, t('result.title'));
    setIsSharing(false);
    if (textOutcome === 'copied' && typeof window !== 'undefined') {
      window.alert(t('result.share.copied'));
    } else if (textOutcome === 'failed' && typeof window !== 'undefined') {
      window.alert(t('result.share.failed'));
    }
  };

  type LogEntry =
    | { kind: 'goal'; created_at: string; goal: GoalDto }
    | { kind: 'penalty'; created_at: string; penalty: PenaltyDto };
  const log: LogEntry[] = [
    ...r.goals.map((g) => ({ kind: 'goal' as const, created_at: g.created_at, goal: g })),
    ...r.penalties.map((p) => ({ kind: 'penalty' as const, created_at: p.created_at, penalty: p })),
  ].sort((a, b) => a.created_at.localeCompare(b.created_at));

  const onSubmitGoal = (body: CreateGoalRequest) => {
    setGoalError(null);
    if (goalSheet.initial) {
      const goalId = goalSheet.initial.id;
      updGoal.mutate(
        { goalId, body },
        {
          onSuccess: () => setGoalSheet({ open: false, initial: null }),
          onError: (e) =>
            setGoalError(e instanceof ApiError ? e.message : t('common.error')),
        },
      );
    } else {
      addGoal.mutate(body, {
        onSuccess: () => setGoalSheet({ open: false, initial: null }),
        onError: (e) =>
          setGoalError(e instanceof ApiError ? e.message : t('common.error')),
      });
    }
  };

  const onSubmitPenalty = (body: CreatePenaltyRequest) => {
    setPenaltyError(null);
    if (penaltySheet.initial) {
      const penaltyId = penaltySheet.initial.id;
      updPenalty.mutate(
        { penaltyId, body },
        {
          onSuccess: () => setPenaltySheet({ open: false, initial: null }),
          onError: (e) =>
            setPenaltyError(e instanceof ApiError ? e.message : t('common.error')),
        },
      );
    } else {
      addPenalty.mutate(body, {
        onSuccess: () => setPenaltySheet({ open: false, initial: null }),
        onError: (e) =>
          setPenaltyError(e instanceof ApiError ? e.message : t('common.error')),
      });
    }
  };

  const handleDeleteGoal = () => {
    const goalId = goalSheet.initial?.id;
    if (!goalId) return;
    if (typeof window !== 'undefined' && !window.confirm(t('result.delete.goal.confirm'))) return;
    setGoalError(null);
    delGoal.mutate(goalId, {
      onSuccess: () => setGoalSheet({ open: false, initial: null }),
      onError: (e) =>
        setGoalError(e instanceof ApiError ? e.message : t('common.error')),
    });
  };
  const handleDeletePenalty = () => {
    const penaltyId = penaltySheet.initial?.id;
    if (!penaltyId) return;
    if (typeof window !== 'undefined' && !window.confirm(t('result.delete.penalty.confirm'))) return;
    setPenaltyError(null);
    delPenalty.mutate(penaltyId, {
      onSuccess: () => setPenaltySheet({ open: false, initial: null }),
      onError: (e) =>
        setPenaltyError(e instanceof ApiError ? e.message : t('common.error')),
    });
  };

  const sectionTitle: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
    padding: `${spacing['8']}px ${spacing['4']}px ${spacing['4']}px`,
  };

  const sectionCard: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['4'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
  };

  const openGoalEdit = (goal: GoalDto) => {
    setGoalError(null);
    setGoalSheet({ open: true, initial: goal });
  };
  const openPenaltyEdit = (penalty: PenaltyDto) => {
    setPenaltyError(null);
    setPenaltySheet({ open: true, initial: penalty });
  };

  return (
    <div style={root}>
      <LightHeader title={t('result.title')} onBack={onBack} />

      <ContentTabs
        tabs={[
          { id: 'overview', label: t('result.tabs.overview') },
          { id: 'events', label: t('result.tabs.events') },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
      />

      <div style={content}>
        <ScoreCard
          sideALabel={sideALabel}
          sideBLabel={sideBLabel}
          scoreA={r.score.score_a}
          scoreB={r.score.score_b}
        />

        {activeTab === 'overview' ? (
          <>
            {isGame ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <MatchResultChip
                  outcome={outcomeForScore(r.score.score_a, r.score.score_b)}
                  labels={{
                    win: t('result.outcome.win'),
                    draw: t('result.outcome.draw'),
                    loss: t('result.outcome.loss'),
                  }}
                />
              </div>
            ) : null}

            {/* Сравнение Light vs Dark отключено: не несёт полезной информации в обзоре тренировки. */}

            {mvp ? (
              <MvpCard
                stat={mvp}
                title={t('result.mvp.title')}
                labels={{
                  goals: t('result.stats.goals'),
                  assists: t('result.stats.assists'),
                  points: t('result.stats.points'),
                  position: {
                    forward: t('result.position.forward'),
                    defender: t('result.position.defender'),
                    goalie: t('result.position.goalie'),
                  },
                }}
              />
            ) : null}

            {r.stats.length > 0 ? (
              <div>
                <div style={sectionTitle}>{t('result.sections.stats')}</div>
                <div style={sectionCard}>
                  {r.stats.map((s, idx) => (
                    <div
                      key={s.user.user_id}
                      style={{
                        borderTop: idx === 0 ? 'none' : `1px solid ${colors.divider}`,
                      }}
                    >
                      <PlayerStatsRow
                        stat={s}
                        labels={{
                          goals: t('result.stats.goals'),
                          assists: t('result.stats.assists'),
                          points: t('result.stats.points'),
                          pim: t('result.stats.pim'),
                          position: {
                            forward: t('result.position.forward'),
                            defender: t('result.position.defender'),
                            goalie: t('result.position.goalie'),
                          },
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {isGame && timelineEvents.length > 0 ? (
              <EventsTimeline
                events={timelineEvents}
                sideAValue={r.score.side_a}
                title={t('result.timeline.title')}
                noTimeLabel={t('result.timeline.noTime')}
                onSelectEvent={onTimelineSelect}
              />
            ) : null}

            {r.stats.length === 0 && r.goals.length === 0 && r.penalties.length === 0 ? (
              <EmptyState
                title={t('result.empty.overview.title')}
                description={t('result.empty.overview.description')}
              />
            ) : null}

            {r.goals.length > 0 || r.penalties.length > 0 ? (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={onShare}
                disabled={isSharing}
              >
                <IconShare size={18} color={colors.text} />
                {isSharing ? t('result.share.sharing') : t('result.share.button')}
              </Button>
            ) : null}
          </>
        ) : (
          <>
            {log.length > 0 ? (
              <div>
                <div style={sectionTitle}>{t('result.sections.log')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
                  {log.map((entry) =>
                    entry.kind === 'goal' ? (
                      <GoalRow
                        key={`g-${entry.goal.id}`}
                        goal={entry.goal}
                        index={goalIndexById.get(entry.goal.id) ?? 0}
                        sideALabel={sideALabel}
                        sideBLabel={sideBLabel}
                        sideAValue={r.score.side_a}
                        unknownLabel={t('result.unknownPlayer')}
                        assistsPrefix={t('result.assistsPrefix')}
                        onClick={() => openGoalEdit(entry.goal)}
                      />
                    ) : (
                      <PenaltyRow
                        key={`p-${entry.penalty.id}`}
                        penalty={entry.penalty}
                        sideALabel={sideALabel}
                        sideBLabel={sideBLabel}
                        sideAValue={r.score.side_a}
                        unknownLabel={t('result.unknownPlayer')}
                        minutesSuffix={t('result.penalty.minutesSuffix')}
                        onClick={() => openPenaltyEdit(entry.penalty)}
                      />
                    ),
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                title={t('result.empty.events.title')}
                description={
                  isOrganizer
                    ? t('result.empty.events.descriptionOrganizer')
                    : t('result.empty.events.description')
                }
              />
            )}
          </>
        )}
      </div>

      {activeTab === 'events' ? (
        <FAB ariaLabel={t('result.add')} variant="primary" onClick={() => setPickerOpen(true)}>
          <IconPlus size={22} color={colors.textInverse} />
        </FAB>
      ) : null}

      <BottomSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t('result.add')}
      >
        <PickItem
          icon={<IconSticksCrossed size={20} color={colors.primary} />}
          label={t('result.add.goal')}
          onClick={() => {
            setPickerOpen(false);
            setGoalError(null);
            setGoalSheet({ open: true, initial: null });
          }}
        />
        <PickItem
          icon={<IconWhistle size={20} color={colors.warning} />}
          label={t('result.add.penalty')}
          onClick={() => {
            setPickerOpen(false);
            setPenaltyError(null);
            setPenaltySheet({ open: true, initial: null });
          }}
        />
      </BottomSheet>

      <AddGoalSheet
        open={goalSheet.open}
        initial={goalSheet.initial}
        onClose={() => {
          setGoalSheet({ open: false, initial: null });
          setGoalError(null);
        }}
        isGame={isGame}
        sideALabel={sideALabel}
        sideBLabel={sideBLabel}
        sideAValue={r.score.side_a}
        sideBValue={r.score.side_b}
        players={players}
        onSubmit={onSubmitGoal}
        onDelete={handleDeleteGoal}
        isPending={addGoal.isPending || updGoal.isPending}
        isDeleting={delGoal.isPending}
        error={goalError}
      />

      <AddPenaltySheet
        open={penaltySheet.open}
        initial={penaltySheet.initial}
        onClose={() => {
          setPenaltySheet({ open: false, initial: null });
          setPenaltyError(null);
        }}
        isGame={isGame}
        sideALabel={sideALabel}
        sideBLabel={sideBLabel}
        sideAValue={r.score.side_a}
        sideBValue={r.score.side_b}
        players={players}
        onSubmit={onSubmitPenalty}
        onDelete={handleDeletePenalty}
        isPending={addPenalty.isPending || updPenalty.isPending}
        isDeleting={delPenalty.isPending}
        error={penaltyError}
      />

      <EventInfoSheet
        open={infoEvent !== null}
        event={infoEvent}
        sideAValue={r.score.side_a}
        sideALabel={sideALabel}
        sideBLabel={sideBLabel}
        onClose={() => setInfoEvent(null)}
      />
    </div>
  );
}

function PickItem({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['12']}px ${spacing['4']}px`,
    width: '100%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    color: colors.text,
    borderRadius: radius.md,
    fontSize: 16,
    fontWeight: 500,
  };
  const iconBox: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    background: colors.bgMuted,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  return (
    <button type="button" className="pressable" onClick={onClick} style={row}>
      <span style={iconBox}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
    </button>
  );
}
