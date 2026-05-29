'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { ContentTabs } from '@/components/content-tabs';
import { FilterChips } from '@/components/filter-chips';
import { StatSummaryCard } from '@/components/stat-summary-card';
import { PlayerStatsRow } from '@/components/player-stats-row';
import {
  PointsDistributionCard,
  BarPairCard,
  EfficiencyTop3Card,
  CategoryLeadersCard,
  PositionContributionCard,
  TopCombinationsCard,
  PenaltyLeadersCard,
} from '@/components/team-stats-cards';
import {
  IconCalendar,
  IconTrophy,
  IconHockeyStick,
  IconStats,
  IconWhistle,
} from '@/components/icons';
import { useTeamStats } from '@/hooks/use-team-stats';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { interp } from '@/lib/format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type {
  PlayerPosition,
  TeamStatsPlayerRow,
  TeamStatsType,
} from '@/types/api';

type TopTab = 'stats' | 'analytics';
type PositionFilter = PlayerPosition;

export default function TeamStatsPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader('#FFFFFF');

  const [topTab, setTopTab] = useState<TopTab>('stats');
  const [type, setType] = useState<TeamStatsType>('game');
  const [posFilter, setPosFilter] = useState<PositionFilter>('forward');

  const q = useTeamStats(type);

  const positionLabels: Record<PlayerPosition, string> = {
    forward: t('teamStats.position.forward'),
    defender: t('teamStats.position.defender'),
    goalie: t('teamStats.position.goalie'),
  };

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/squad');
  };

  const root: CSSProperties = {
    background: colors.bg,
    minHeight: '100dvh',
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };
  const content: CSSProperties = {
    padding: `${spacing['12']}px ${spacing['16']}px 0`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };

  return (
    <div style={root}>
      <LightHeader title={t('teamStats.title')} onBack={onBack} />

      <div style={content}>
        <ContentTabs
          tabs={[
            { id: 'stats', label: t('teamStats.tabs.stats') },
            { id: 'analytics', label: t('teamStats.tabs.analytics') },
          ]}
          activeId={topTab}
          onChange={(id) => setTopTab(id as TopTab)}
        />

        <ContentTabs
          tabs={[
            { id: 'game', label: t('teamStats.segment.games') },
            { id: 'training', label: t('teamStats.segment.trainings') },
          ]}
          activeId={type}
          onChange={(id) => setType(id as TeamStatsType)}
        />

        {q.isLoading ? (
          <span style={{ ...typography.body, color: colors.textSecondary }}>
            {t('common.loading')}
          </span>
        ) : q.isError || !q.data ? (
          <span style={{ ...typography.body, color: colors.error }}>{t('common.error')}</span>
        ) : topTab === 'stats' ? (
          <StatsTab
            type={type}
            response={q.data}
            posFilter={posFilter}
            onPosFilterChange={setPosFilter}
            positionLabels={positionLabels}
            onRowClick={(id) => router.push(`/squad/${id}`)}
            t={t}
          />
        ) : (
          <AnalyticsTab type={type} response={q.data} positionLabels={positionLabels} t={t} />
        )}
      </div>
    </div>
  );
}

type T = (k: TKey) => string;

function StatsTab({
  type,
  response,
  posFilter,
  onPosFilterChange,
  positionLabels,
  onRowClick,
  t,
}: {
  type: TeamStatsType;
  response: ReturnType<typeof useTeamStats>['data'] & {};
  posFilter: PositionFilter;
  onPosFilterChange: (p: PositionFilter) => void;
  positionLabels: Record<PlayerPosition, string>;
  onRowClick: (userId: string) => void;
  t: T;
}) {
  const { summary, players } = response;

  const summaryGrid = useMemo<CSSProperties>(
    () => ({
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: spacing['12'],
    }),
    [],
  );

  const filtered = useMemo<TeamStatsPlayerRow[]>(() => {
    const list = players.filter((p) => p.position === posFilter);
    return [...list].sort((a, b) => b.points - a.points || b.goals - a.goals);
  }, [players, posFilter]);

  const tableHeader: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing['8']}px ${spacing['12']}px`,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <>
      <div style={summaryGrid}>
        {type === 'game' ? (
          <>
            <StatSummaryCard
              icon={<IconCalendar size={18} color={colors.primary} />}
              title={t('teamStats.summary.games')}
              value={summary.events_played}
              caption={t('teamStats.summary.games.caption')}
            />
            <StatSummaryCard
              icon={<IconTrophy size={18} color={colors.primary} />}
              title={t('teamStats.summary.wins')}
              value={summary.wins ?? 0}
              caption={t('teamStats.summary.wins.caption')}
            />
            <StatSummaryCard
              icon={<IconHockeyStick size={18} color={colors.primary} />}
              title={t('teamStats.summary.goals')}
              value={summary.goals}
              caption={t('teamStats.summary.goals.caption')}
            />
            <StatSummaryCard
              icon={<IconStats size={18} color={colors.primary} />}
              title={t('teamStats.summary.assists')}
              value={summary.assists}
              caption={t('teamStats.summary.assists.caption')}
            />
          </>
        ) : (
          <>
            <StatSummaryCard
              icon={<IconWhistle size={18} color={colors.primary} />}
              title={t('teamStats.summary.trainings')}
              value={summary.events_played}
              caption={t('teamStats.summary.trainings.caption')}
            />
            <StatSummaryCard
              icon={<IconHockeyStick size={18} color={colors.primary} />}
              title={t('teamStats.summary.goals')}
              value={summary.goals}
              caption={t('teamStats.summary.goals.caption')}
            />
            <StatSummaryCard
              icon={<IconStats size={18} color={colors.primary} />}
              title={t('teamStats.summary.assists')}
              value={summary.assists}
              caption={t('teamStats.summary.assists.caption')}
            />
          </>
        )}
      </div>

      <FilterChips
        options={[
          { id: 'forward', label: t('teamStats.filter.forwards') },
          { id: 'defender', label: t('teamStats.filter.defenders') },
          { id: 'goalie', label: t('teamStats.filter.goalies') },
        ]}
        activeId={posFilter}
        onChange={(id) => onPosFilterChange(id as PositionFilter)}
      />

      {posFilter === 'goalie' ? (
        <div
          style={{
            padding: `${spacing['24']}px 0`,
            textAlign: 'center',
            color: colors.textTertiary,
            fontSize: 13,
          }}
        >
          {t('teamStats.table.goaliesSoon')}
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: `${spacing['24']}px 0`,
            textAlign: 'center',
            color: colors.textTertiary,
            fontSize: 13,
          }}
        >
          {t('teamStats.table.empty')}
        </div>
      ) : (
        <div>
          <div style={tableHeader}>
            <span style={{ width: 24 }}>{' '}</span>
            <span style={{ flex: 1 }}>{t('teamStats.table.player')}</span>
            <span style={{ width: 32, textAlign: 'center' }}>{t('teamStats.table.goals')}</span>
            <span style={{ width: 32, textAlign: 'center' }}>{t('teamStats.table.assists')}</span>
            <span style={{ width: 32, textAlign: 'center' }}>{t('teamStats.table.points')}</span>
            <span style={{ width: 32, textAlign: 'center' }}>{t('teamStats.table.penalty')}</span>
          </div>
          {filtered.map((p, i) => (
            <PlayerStatsRow
              key={p.user_id}
              rank={i + 1}
              stat={{
                user: {
                  user_id: p.user_id,
                  first_name: p.first_name,
                  last_name: p.last_name,
                  username: null,
                  photo_url: p.avatar_url ?? p.photo_url,
                  jersey_number: p.jersey_number,
                  position: p.position,
                },
                goals: p.goals,
                assists: p.assists,
                points: p.points,
                penalty_minutes: p.penalty_minutes,
              }}
              labels={{
                goals: t('teamStats.table.goals'),
                assists: t('teamStats.table.assists'),
                points: t('teamStats.table.points'),
                pim: t('teamStats.table.penalty'),
                position: positionLabels,
              }}
              onClick={() => onRowClick(p.user_id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function AnalyticsTab({
  type,
  response,
  positionLabels,
  t,
}: {
  type: TeamStatsType;
  response: ReturnType<typeof useTeamStats>['data'] & {};
  positionLabels: Record<PlayerPosition, string>;
  t: T;
}) {
  const { analytics } = response;
  return (
    <>
      <PointsDistributionCard
        title={t('teamStats.analytics.pointsTitle')}
        distribution={analytics.points_distribution}
        total={analytics.total_points}
        totalLabel={t('teamStats.analytics.pointsTotal')}
        othersLabel={t('teamStats.analytics.pointsOthers')}
      />
      <BarPairCard
        title={t('teamStats.analytics.goalsAssistsTitle')}
        goals={analytics.total_goals}
        assists={analytics.total_assists}
        goalsLabel={interp(t('teamStats.analytics.goalsCount'), { count: analytics.total_goals })}
        assistsLabel={interp(t('teamStats.analytics.assistsCount'), { count: analytics.total_assists })}
      />
      <EfficiencyTop3Card
        title={t('teamStats.analytics.efficiencyTitle')}
        caption={t(
          type === 'game'
            ? 'teamStats.analytics.efficiencyCaption.games'
            : 'teamStats.analytics.efficiencyCaption.trainings',
        )}
        players={analytics.top_efficiency}
        positionLabels={positionLabels}
        emptyLabel={t('teamStats.analytics.empty')}
      />
      <CategoryLeadersCard
        title={t('teamStats.analytics.leadersTitle')}
        leaders={analytics.leaders}
        labels={{
          points: t('teamStats.analytics.leaders.points'),
          goals: t('teamStats.analytics.leaders.goals'),
          assists: t('teamStats.analytics.leaders.assists'),
          penalty: t('teamStats.analytics.leaders.penalty'),
        }}
        emptyLabel={t('teamStats.analytics.empty')}
        formatPenalty={(n) => interp(t('teamStats.analytics.penaltyMinutes'), { count: n })}
      />
      <PositionContributionCard
        title={t('teamStats.analytics.byPositionTitle')}
        rows={analytics.by_position}
        positionLabels={positionLabels}
        valueTemplate={t('teamStats.analytics.byPosition.value')}
      />
      <TopCombinationsCard
        title={t('teamStats.analytics.combinationsTitle')}
        combinations={analytics.top_combinations}
        emptyLabel={t('teamStats.analytics.empty')}
        valueTemplate={t('teamStats.analytics.combinationsValue')}
      />
      <PenaltyLeadersCard
        title={t('teamStats.analytics.topPenaltyTitle')}
        players={analytics.top_penalties}
        positionLabels={positionLabels}
        emptyLabel={t('teamStats.analytics.empty')}
        valueTemplate={t('teamStats.analytics.penaltyMinutes')}
      />
    </>
  );
}
