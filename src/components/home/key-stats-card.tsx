'use client';

import { useState, type CSSProperties } from 'react';
import { FilterChips } from '@/components/filter-chips';
import { LastGameTile } from '@/components/home/last-game-tile';
import { TeamSummaryTile } from '@/components/home/team-summary-tile';
import { TopPlayersTable } from '@/components/home/top-players-table';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { useT } from '@/hooks/use-t';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

// Блок «Ключевая статистика» (v0.6, итерация 64). Карточка с заголовком и
// тремя pill-табами: «Топ 5 игроков» / «Последняя игра» / «Команда». Источник
// данных — `useDashboardStats` (один эндпоинт, три набора). Каждый таб рисует
// свой компонент со своим empty state.

type TabId = 'top' | 'lastGame' | 'team';

export function KeyStatsCard() {
  const t = useT();
  const [active, setActive] = useState<TabId>('top');
  const statsQ = useDashboardStats();

  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    border: `1px solid ${colors.line}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  };
  const header: CSSProperties = {
    padding: `${spacing['16']}px ${spacing['16']}px ${spacing['4']}px`,
  };
  const title: CSSProperties = {
    ...typography.h3,
    color: colors.text,
    margin: 0,
  };
  const tabsWrap: CSSProperties = {
    padding: `${spacing['8']}px ${spacing['8']}px ${spacing['4']}px`,
  };
  // Фиксированный минимум, чтобы переключение табов не двигало layout
  // страницы (топ-5 высокий, last_game пониже, team_summary плотная).
  // Берём с запасом ≈ заполненный топ-5 — это самый длинный таб.
  const body: CSSProperties = {
    padding: `${spacing['4']}px ${spacing['8']}px ${spacing['8']}px`,
    minHeight: 360,
  };
  const skel: CSSProperties = {
    height: 320,
    background: colors.bgMuted,
    margin: spacing['8'],
    borderRadius: radius.md,
  };

  return (
    <section style={card}>
      <header style={header}>
        <h2 style={title}>{t('home.stats.title')}</h2>
      </header>
      <div style={tabsWrap}>
        <FilterChips
          compact
          activeId={active}
          onChange={(id) => setActive(id as TabId)}
          options={[
            { id: 'top', label: t('home.stats.tabs.top') },
            { id: 'lastGame', label: t('home.stats.tabs.lastGame') },
            { id: 'team', label: t('home.stats.tabs.team') },
          ]}
        />
      </div>
      <div style={body}>
        {statsQ.isLoading || statsQ.isPending ? (
          <div style={skel} aria-hidden />
        ) : !statsQ.data ? null : active === 'top' ? (
          <TopPlayersTable
            players={statsQ.data.top_players}
            emptyTitle={t('home.stats.top.empty.title')}
            emptySubtitle={t('home.stats.top.empty.subtitle')}
            labels={{
              player: t('home.stats.top.header.player'),
              goals: t('home.stats.top.header.goals'),
              assists: t('home.stats.top.header.assists'),
              points: t('home.stats.top.header.points'),
            }}
          />
        ) : active === 'lastGame' ? (
          <LastGameTile
            game={statsQ.data.last_game}
            emptyTitle={t('home.stats.lastGame.empty')}
            labels={{
              assists: t('home.stats.lastGame.assists'),
              penalties: t('home.stats.lastGame.penalties'),
              opponent: t('home.nextEvent.versus.opponent'),
            }}
          />
        ) : (
          <TeamSummaryTile
            summary={statsQ.data.team_summary}
            labels={{
              games: t('home.stats.team.games'),
              trainings: t('home.stats.team.trainings'),
              wins: t('home.stats.team.wins'),
              goalsFor: t('home.stats.team.goalsFor'),
              goalsAgainst: t('home.stats.team.goalsAgainst'),
              balance: t('home.stats.team.balance'),
            }}
          />
        )}
      </div>
    </section>
  );
}
