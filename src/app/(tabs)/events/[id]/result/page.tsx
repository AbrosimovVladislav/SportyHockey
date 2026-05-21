'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BottomSheet } from '@/components/bottom-sheet';
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
import { useDeleteGoal } from '@/hooks/use-delete-goal';
import { useAddPenalty } from '@/hooks/use-add-penalty';
import { useDeletePenalty } from '@/hooks/use-delete-penalty';
import { ApiError } from '@/lib/api-client';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { GoalParticipant } from '@/types/api';

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
  const delGoal = useDeleteGoal(id);
  const addPenalty = useAddPenalty(id);
  const delPenalty = useDeletePenalty(id);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);
  const [penaltySheetOpen, setPenaltySheetOpen] = useState(false);
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
    return ev.data.attendees.map((a) => ({
      user_id: a.user_id,
      first_name: a.first_name,
      last_name: a.last_name,
      username: a.username,
      photo_url: a.photo_url,
      jersey_number: a.jersey_number,
    }));
  }, [ev.data]);

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(`/events/${id}`);
  };

  const root: CSSProperties = {
    background: colors.bg,
    minHeight: '100dvh',
  };
  const content: CSSProperties = {
    padding: `${spacing['8']}px ${spacing['16']}px ${BOTTOM_NAV_HEIGHT + spacing['48']}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };

  if (result.isLoading || ev.isLoading || !result.data || !ev.data) {
    return (
      <div style={root}>
        <LightHeader title={t('result.title')} onBack={onBack} />
        <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
          <span style={{ ...typography.body, color: colors.textSecondary }}>
            {t('common.loading')}
          </span>
        </div>
      </div>
    );
  }
  if (result.isError || ev.isError) {
    return (
      <div style={root}>
        <LightHeader title={t('result.title')} onBack={onBack} />
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

  const onSubmitGoal = (body: Parameters<typeof addGoal.mutate>[0]) => {
    setGoalError(null);
    addGoal.mutate(body, {
      onSuccess: () => setGoalSheetOpen(false),
      onError: (e) =>
        setGoalError(e instanceof ApiError ? e.message : t('common.error')),
    });
  };
  const onSubmitPenalty = (body: Parameters<typeof addPenalty.mutate>[0]) => {
    setPenaltyError(null);
    addPenalty.mutate(body, {
      onSuccess: () => setPenaltySheetOpen(false),
      onError: (e) =>
        setPenaltyError(e instanceof ApiError ? e.message : t('common.error')),
    });
  };

  const handleDeleteGoal = (goalId: string) => {
    if (typeof window !== 'undefined' && !window.confirm(t('result.delete.goal.confirm'))) return;
    delGoal.mutate(goalId);
  };
  const handleDeletePenalty = (penaltyId: string) => {
    if (typeof window !== 'undefined' && !window.confirm(t('result.delete.penalty.confirm'))) return;
    delPenalty.mutate(penaltyId);
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

  const isEmpty = r.goals.length === 0 && r.penalties.length === 0;

  return (
    <div style={root}>
      <LightHeader title={t('result.title')} onBack={onBack} />

      <div style={content}>
        <ScoreCard
          sideALabel={sideALabel}
          sideBLabel={sideBLabel}
          scoreA={r.score.score_a}
          scoreB={r.score.score_b}
        />

        {r.stats.length > 0 ? (
          <Section title={t('result.sections.stats')}>
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
                    }}
                  />
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {r.goals.length > 0 ? (
          <Section title={t('result.sections.goals')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
              {r.goals.map((g, idx) => (
                <GoalRow
                  key={g.id}
                  goal={g}
                  index={idx + 1}
                  sideALabel={sideALabel}
                  sideBLabel={sideBLabel}
                  sideAValue={r.score.side_a}
                  unknownLabel={t('result.unknownPlayer')}
                  assistsPrefix={t('result.assistsPrefix')}
                  onDelete={isOrganizer ? () => handleDeleteGoal(g.id) : undefined}
                />
              ))}
            </div>
          </Section>
        ) : null}

        {r.penalties.length > 0 ? (
          <Section title={t('result.sections.penalties')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
              {r.penalties.map((p) => (
                <PenaltyRow
                  key={p.id}
                  penalty={p}
                  sideALabel={sideALabel}
                  sideBLabel={sideBLabel}
                  sideAValue={r.score.side_a}
                  unknownLabel={t('result.unknownPlayer')}
                  minutesSuffix={t('result.penalty.minutesSuffix')}
                  onDelete={isOrganizer ? () => handleDeletePenalty(p.id) : undefined}
                />
              ))}
            </div>
          </Section>
        ) : null}

        {isEmpty ? (
          <EmptyState
            title={t('result.empty.title')}
            description={isOrganizer ? t('result.empty.descriptionOrganizer') : t('result.empty.description')}
          />
        ) : null}
      </div>

      {isOrganizer ? (
        <FAB ariaLabel={t('result.add')} variant="primary" onClick={() => setPickerOpen(true)}>
          <IconPlus size={22} color={colors.textInverse} />
        </FAB>
      ) : null}

      {isOrganizer ? (
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
              setGoalSheetOpen(true);
            }}
          />
          <PickItem
            icon={<IconWhistle size={20} color={colors.warning} />}
            label={t('result.add.penalty')}
            onClick={() => {
              setPickerOpen(false);
              setPenaltySheetOpen(true);
            }}
          />
        </BottomSheet>
      ) : null}

      {isOrganizer ? (
        <AddGoalSheet
          open={goalSheetOpen}
          onClose={() => {
            setGoalSheetOpen(false);
            setGoalError(null);
          }}
          isGame={isGame}
          sideALabel={sideALabel}
          sideBLabel={sideBLabel}
          sideAValue={r.score.side_a}
          sideBValue={r.score.side_b}
          players={players}
          onSubmit={onSubmitGoal}
          isPending={addGoal.isPending}
          error={goalError}
        />
      ) : null}

      {isOrganizer ? (
        <AddPenaltySheet
          open={penaltySheetOpen}
          onClose={() => {
            setPenaltySheetOpen(false);
            setPenaltyError(null);
          }}
          isGame={isGame}
          sideALabel={sideALabel}
          sideBLabel={sideBLabel}
          sideAValue={r.score.side_a}
          sideBValue={r.score.side_b}
          players={players}
          onSubmit={onSubmitPenalty}
          isPending={addPenalty.isPending}
          error={penaltyError}
        />
      ) : null}
    </div>
  );

  function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
      <div>
        <div style={sectionTitle}>{title}</div>
        {children}
      </div>
    );
  }
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
