'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { LightHeader } from '@/components/light-header';
import { ContentTabs } from '@/components/content-tabs';
import { LineupChip } from '@/components/lineup-chip';
import { LineupZone } from '@/components/lineup-zone';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { useEvent } from '@/hooks/use-event';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { formatEventDateRange } from '@/lib/event-format';
import { formatName } from '@/lib/format-name';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { EventAttendee, PlayerPosition } from '@/types/api';

type TeamSide = 'light' | 'dark';
type LineKey = 'line1' | 'line2' | 'line3';
type TabId = 'teams' | 'lines';
type PoolId = 'pool';
type ZoneId = TeamSide | LineKey | PoolId;

const LINE_ORDER: readonly LineKey[] = ['line1', 'line2', 'line3'] as const;

function positionLabel(pos: PlayerPosition | null, t: (k: never) => string): string | null {
  if (!pos) return null;
  if (pos === 'forward') return t('rosterDay.position.forward' as never);
  if (pos === 'defender') return t('rosterDay.position.defender' as never);
  if (pos === 'goalie') return t('rosterDay.position.goalie' as never);
  return null;
}

function playerSubtitle(a: EventAttendee, t: (k: never) => string): string | undefined {
  const pos = positionLabel(a.position, t);
  if (a.jersey_number != null && pos) return `#${a.jersey_number} · ${pos}`;
  if (a.jersey_number != null) return `#${a.jersey_number}`;
  if (pos) return pos;
  return undefined;
}

export default function EventLineupPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  useTgHeader('#FFFFFF');

  const ev = useEvent(id);
  const data = ev.data;
  const isGame = data?.type === 'game';

  const [tab, setTab] = useState<TabId>('teams');
  const effectiveTab: TabId = isGame ? 'lines' : tab;

  const [teams, setTeams] = useState<Record<string, TeamSide>>({});
  const [lines, setLines] = useState<Record<string, LineKey>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const attendees = useMemo(() => data?.attendees ?? [], [data]);
  const byId = useMemo(() => {
    const m = new Map<string, EventAttendee>();
    for (const a of attendees) m.set(a.user_id, a);
    return m;
  }, [attendees]);

  const teamsGroups = useMemo(() => {
    const light: EventAttendee[] = [];
    const dark: EventAttendee[] = [];
    const pool: EventAttendee[] = [];
    for (const a of attendees) {
      const s = teams[a.user_id];
      if (s === 'light') light.push(a);
      else if (s === 'dark') dark.push(a);
      else pool.push(a);
    }
    return { light, dark, pool };
  }, [attendees, teams]);

  const linesGroups = useMemo(() => {
    const buckets: Record<LineKey, EventAttendee[]> = { line1: [], line2: [], line3: [] };
    const pool: EventAttendee[] = [];
    for (const a of attendees) {
      const k = lines[a.user_id];
      if (k && buckets[k]) buckets[k].push(a);
      else pool.push(a);
    }
    return { buckets, pool };
  }, [attendees, lines]);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const userId = String(e.active.id);
    const overId = e.over?.id ? (String(e.over.id) as ZoneId) : undefined;
    if (!overId) return;
    if (effectiveTab === 'lines') {
      setLines((prev) => {
        const next = { ...prev };
        if (overId === 'pool') delete next[userId];
        else if (overId === 'line1' || overId === 'line2' || overId === 'line3')
          next[userId] = overId;
        return next;
      });
    } else {
      setTeams((prev) => {
        const next = { ...prev };
        if (overId === 'pool') delete next[userId];
        else if (overId === 'light' || overId === 'dark') next[userId] = overId;
        return next;
      });
    }
  };

  const root: CSSProperties = {
    background: colors.bg,
    minHeight: '100dvh',
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };
  const content: CSSProperties = {
    padding: `${spacing['8']}px ${spacing['16']}px 0`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(`/events/${id}`);
  };

  const venueName = data?.venue?.name ?? data?.venue_text ?? '';
  const subtitle = data
    ? [formatEventDateRange(data.starts_at, data.ends_at), venueName].filter(Boolean).join(' · ')
    : '';

  if (ev.isLoading || !data) {
    return (
      <div style={root}>
        <LightHeader title={t('lineup.title')} onBack={onBack} />
        <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
          <span style={{ ...typography.body, color: colors.textSecondary }}>
            {t('common.loading')}
          </span>
        </div>
      </div>
    );
  }
  if (ev.isError) {
    return (
      <div style={root}>
        <LightHeader title={t('lineup.title')} onBack={onBack} />
        <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
          <span style={{ ...typography.body, color: colors.error }}>
            {t('eventDetail.errors.notFound')}
          </span>
        </div>
      </div>
    );
  }

  const activeAttendee = activeId ? byId.get(activeId) : null;

  const renderChip = (a: EventAttendee, variant: 'pool' | 'zone' = 'zone') => (
    <LineupChip
      key={a.user_id}
      id={a.user_id}
      name={formatName(a)}
      photoUrl={a.photo_url}
      subtitle={playerSubtitle(a, t as (k: never) => string)}
      variant={variant}
    />
  );

  const poolList = effectiveTab === 'lines' ? linesGroups.pool : teamsGroups.pool;
  const tabsOptions = [
    { id: 'teams' as TabId, label: t('lineup.tabs.teams') },
    { id: 'lines' as TabId, label: t('lineup.tabs.lines') },
  ];

  return (
    <div style={root}>
      <LightHeader title={t('lineup.title')} subtitle={subtitle} onBack={onBack} />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={content}>
          {!isGame ? (
            <ContentTabs tabs={tabsOptions} activeId={tab} onChange={(v) => setTab(v as TabId)} />
          ) : null}

          {effectiveTab === 'teams' ? (
            <>
              <LineupZone
                id="light"
                title={t('lineup.teams.light')}
                count={teamsGroups.light.length}
                empty={teamsGroups.light.length === 0}
                emptyHint={t('lineup.dropHint')}
              >
                {teamsGroups.light.map((a) => renderChip(a, 'zone'))}
              </LineupZone>
              <LineupZone
                id="dark"
                title={t('lineup.teams.dark')}
                count={teamsGroups.dark.length}
                empty={teamsGroups.dark.length === 0}
                emptyHint={t('lineup.dropHint')}
              >
                {teamsGroups.dark.map((a) => renderChip(a, 'zone'))}
              </LineupZone>
            </>
          ) : (
            <>
              {LINE_ORDER.map((key, idx) => (
                <LineupZone
                  key={key}
                  id={key}
                  title={
                    idx === 0
                      ? t('lineup.lines.first')
                      : idx === 1
                        ? t('lineup.lines.second')
                        : t('lineup.lines.third')
                  }
                  count={linesGroups.buckets[key].length}
                  empty={linesGroups.buckets[key].length === 0}
                  emptyHint={t('lineup.dropHint')}
                >
                  {linesGroups.buckets[key].map((a) => renderChip(a, 'zone'))}
                </LineupZone>
              ))}
            </>
          )}

          <PoolSection
            title={t('lineup.pool')}
            count={poolList.length}
            empty={poolList.length === 0}
            emptyHint={t('lineup.poolEmpty')}
          >
            {poolList.map((a) => renderChip(a, 'pool'))}
          </PoolSection>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeAttendee ? (
            <LineupChip
              id={activeAttendee.user_id}
              name={formatName(activeAttendee)}
              photoUrl={activeAttendee.photo_url}
              subtitle={playerSubtitle(activeAttendee, t as (k: never) => string)}
              forOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function PoolSection({
  title,
  count,
  empty,
  emptyHint,
  children,
}: {
  title: string;
  count: number;
  empty: boolean;
  emptyHint: string;
  children: ReactNode;
}) {
  const drop = useDroppable({ id: 'pool' });

  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
    padding: spacing['12'],
    background: drop.isOver ? 'rgba(232, 79, 0, 0.06)' : colors.bgMuted,
    border: drop.isOver
      ? `2px dashed ${colors.headerAccent}`
      : `1px dashed ${colors.line}`,
    borderRadius: 12,
    minHeight: 96,
  };
  const header: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing['4'],
  };
  const titleStyle: CSSProperties = { fontSize: 14, fontWeight: 700, color: colors.text };
  const countStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
  };
  const emptyStyle: CSSProperties = {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    padding: `${spacing['12']}px 0`,
  };

  return (
    <div ref={drop.setNodeRef} style={wrap}>
      <div style={header}>
        <span style={titleStyle}>{title}</span>
        <span style={countStyle}>{count}</span>
      </div>
      {empty ? (
        <div style={emptyStyle}>{emptyHint}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['6'] }}>
          {children}
        </div>
      )}
    </div>
  );
}
