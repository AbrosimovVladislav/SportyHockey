'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { ContentTabs } from '@/components/content-tabs';
import { FilterChips } from '@/components/filter-chips';
import { StatSummaryCard } from '@/components/stat-summary-card';
import {
  TeamStatsTableRow,
  TeamStatsTableHeader,
} from '@/components/team-stats-table-row';
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
// На вратарей данных пока нет — фильтр амплуа в таблице ограничен двумя
// группами. null = «фильтр снят», показываем всех игроков; повторный клик по
// активному чипу возвращает в null (toggle-поведение).
type PositionFilter = 'forward' | 'defender' | null;

export default function TeamStatsPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader('#FFFFFF');

  const [topTab, setTopTab] = useState<TopTab>('stats');
  const [type, setType] = useState<TeamStatsType>('game');
  const [posFilter, setPosFilter] = useState<PositionFilter>(null);

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
  // Табы вплотную к шапке (paddingTop: 0), между табами и чипами тоже
  // минимальный воздух (gap: 4) — chips здесь ещё дополнительно идут в compact-
  // режиме, без своего верхнего паддинга. Без этого набора расстояние шапка→
  // чипы получалось около 60px и визуально разрывало секцию.
  const content: CSSProperties = {
    padding: `0 ${spacing['16']}px 0`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['4'],
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

        <FilterChips
          compact
          options={[
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
  onRowClick,
  t,
}: {
  type: TeamStatsType;
  response: ReturnType<typeof useTeamStats>['data'] & {};
  posFilter: PositionFilter;
  onPosFilterChange: (p: PositionFilter) => void;
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

  // posFilter === null → показываем всех игроков; иначе фильтруем по амплуа.
  // Сортировка одинаковая в обоих режимах: по очкам, при равных — по голам.
  const filtered = useMemo<TeamStatsPlayerRow[]>(() => {
    const list = posFilter ? players.filter((p) => p.position === posFilter) : players;
    return [...list].sort((a, b) => b.points - a.points || b.goals - a.goals);
  }, [players, posFilter]);

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
        ]}
        // Когда фильтр снят, передаём пустую строку — ни один чип не подсветится.
        activeId={posFilter ?? ''}
        // Toggle: клик по уже активному → null; иначе — выбор нового амплуа.
        onChange={(id) => {
          const next = id as 'forward' | 'defender';
          onPosFilterChange(posFilter === next ? null : next);
        }}
      />

      {filtered.length === 0 ? (
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
          <TeamStatsTableHeader
            type={type}
            labels={{
              player: t('teamStats.table.player'),
              games: t('teamStats.table.short.games'),
              goals: t('teamStats.table.short.goals'),
              assists: t('teamStats.table.short.assists'),
              points: t('teamStats.table.short.points'),
              penalty: t('teamStats.table.short.penalty'),
            }}
          />
          {filtered.map((p) => (
            <TeamStatsTableRow
              key={p.user_id}
              player={p}
              type={type}
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
  const isGame = type === 'game';
  // На тренировках штрафы не считаем — карточки «Топ штрафников» нет,
  // в «Лучшие по категориям» строку «Штрафы» тоже скрываем. Во «Вкладе по амплуа»
  // вратарей всегда исключаем (вратарские голы/передачи на PoC не ведём).
  const byPosition = analytics.by_position.filter((r) => r.position !== 'goalie');

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
          isGame
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
        // «Лучшие по категориям» — про результативность; штрафы вынесены
        // в отдельную карточку «Топ штрафников» (только на вкладке «Игры»).
        showPenalty={false}
      />
      <PositionContributionCard
        title={t('teamStats.analytics.byPositionTitle')}
        rows={byPosition}
        positionLabels={positionLabels}
        valueTemplate={t('teamStats.analytics.byPosition.value')}
      />
      <TopCombinationsCard
        title={t('teamStats.analytics.combinationsTitle')}
        combinations={analytics.top_combinations}
        emptyLabel={t('teamStats.analytics.empty')}
        valueTemplate={t('teamStats.analytics.combinationsValue')}
      />
      {isGame ? (
        <PenaltyLeadersCard
          title={t('teamStats.analytics.topPenaltyTitle')}
          players={analytics.top_penalties}
          positionLabels={positionLabels}
          emptyLabel={t('teamStats.analytics.empty')}
          valueTemplate={t('teamStats.analytics.penaltyMinutes')}
        />
      ) : null}
    </>
  );
}
