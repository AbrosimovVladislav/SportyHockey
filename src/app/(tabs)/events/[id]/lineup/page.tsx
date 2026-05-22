'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { ContentTabs } from '@/components/content-tabs';
import { LightHeader } from '@/components/light-header';
import { LineupChip } from '@/components/lineup-chip';
import { LineupZone } from '@/components/lineup-zone';
import { RosterCard } from '@/components/roster-card';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { LinesView } from './lines-view';
import { useEvent } from '@/hooks/use-event';
import { useSetLine } from '@/hooks/use-set-line';
import { useSetLineup } from '@/hooks/use-set-lineup';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useTgSwipes } from '@/hooks/use-tg-swipes';
import { asLineSlot } from '@/lib/event-lines';
import { formatEventDateRange } from '@/lib/event-format';
import { formatName } from '@/lib/format-name';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { EventAttendee, LineSlot as LineSlotKey, PlayerPosition, TeamSide } from '@/types/api';

type TabId = 'teams' | 'lines_light' | 'lines_dark';

function positionLabel(pos: PlayerPosition | null, t: (k: never) => string): string | null {
  if (!pos) return null;
  if (pos === 'forward') return t('rosterDay.position.forward' as never);
  if (pos === 'defender') return t('rosterDay.position.defender' as never);
  if (pos === 'goalie') return t('rosterDay.position.goalie' as never);
  return null;
}

function positionLabelShort(pos: PlayerPosition | null, t: (k: never) => string): string | null {
  if (!pos) return null;
  if (pos === 'forward') return t('lineup.positionShort.forward' as never);
  if (pos === 'defender') return t('lineup.positionShort.defender' as never);
  if (pos === 'goalie') return t('lineup.positionShort.goalie' as never);
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
  useTgSwipes(true);

  const ev = useEvent(id);
  const data = ev.data;
  const setLineup = useSetLineup(id);
  const setLine = useSetLine(id);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('teams');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 400, tolerance: 8 } }),
  );

  const attendees = useMemo(() => data?.attendees ?? [], [data]);
  const lines = useMemo(() => data?.lines ?? [], [data]);
  const byId = useMemo(() => {
    const m = new Map<string, EventAttendee>();
    for (const a of attendees) m.set(a.user_id, a);
    return m;
  }, [attendees]);

  const teamGroups = useMemo(() => {
    const light: EventAttendee[] = [];
    const dark: EventAttendee[] = [];
    const signed: EventAttendee[] = [];
    const unsigned: EventAttendee[] = [];
    for (const a of attendees) {
      if (a.team_side === 'light') light.push(a);
      else if (a.team_side === 'dark') dark.push(a);
      else if (a.vote === 'going') signed.push(a);
      else unsigned.push(a);
    }
    return { light, dark, signed, unsigned };
  }, [attendees]);

  const gameRoster = useMemo(
    () => attendees.filter((a) => a.vote === 'going' || a.showed_up === true),
    [attendees],
  );

  const linesIndex = useMemo(() => {
    const m = new Map<string, { team_side: TeamSide; slot: LineSlotKey }>();
    for (const l of lines) m.set(l.user_id, { team_side: l.team_side, slot: l.slot });
    return m;
  }, [lines]);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const isGame = data?.type === 'game';

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const userId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    if (isGame) {
      if (overId === 'pool_lines') {
        if (!linesIndex.has(userId)) return;
        setLine.mutate({ user_id: userId, team_side: 'light', slot: null });
        return;
      }
      const slot = asLineSlot(overId);
      if (!slot) return;
      const current = linesIndex.get(userId);
      if (current && current.slot === slot) return;
      setLine.mutate({ user_id: userId, team_side: 'light', slot });
      return;
    }

    if (activeTab === 'teams') {
      const current = byId.get(userId)?.team_side ?? null;
      const next: TeamSide | null =
        overId === 'light' || overId === 'dark' ? overId : null;
      if (current === next) return;
      setLineup.mutate({ user_id: userId, team_side: next });
      return;
    }

    const side: TeamSide = activeTab === 'lines_light' ? 'light' : 'dark';
    if (overId === 'pool_lines') {
      if (!linesIndex.has(userId)) return;
      setLine.mutate({ user_id: userId, team_side: side, slot: null });
      return;
    }
    const slot = asLineSlot(overId);
    if (!slot) return;
    const current = linesIndex.get(userId);
    if (current && current.team_side === side && current.slot === slot) return;
    setLine.mutate({ user_id: userId, team_side: side, slot });
  };

  const root: CSSProperties = {
    background: colors.bg,
    minHeight: '100dvh',
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(`/events/${id}`);
  };

  const venueName = data?.venue?.name ?? '';
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
  const showTabs = data.type === 'training';
  const currentTab: TabId = showTabs ? activeTab : 'teams';
  const pageTitle = isGame ? t('lineup.title.game') : t('lineup.title');
  const overlayLayout: 'horizontal' | 'vertical' =
    isGame || currentTab !== 'teams' ? 'vertical' : 'horizontal';

  const tabs =
    showTabs
      ? [
          { id: 'teams' as const, label: t('lineup.tabs.teams') },
          { id: 'lines_light' as const, label: t('lineup.tabs.linesLight') },
          { id: 'lines_dark' as const, label: t('lineup.tabs.linesDark') },
        ]
      : [];

  const renderTeamCard = (a: EventAttendee): ReactNode => (
    <RosterCard
      key={a.user_id}
      dragId={a.user_id}
      firstName={a.first_name}
      lastName={a.last_name}
      photoUrl={a.photo_url}
      jersey={a.jersey_number}
      positionLabel={positionLabelShort(a.position, t as (k: never) => string)}
      layout="horizontal"
    />
  );

  const renderPoolChip = (a: EventAttendee): ReactNode => (
    <LineupChip
      key={a.user_id}
      id={a.user_id}
      name={formatName(a)}
      photoUrl={a.photo_url}
      subtitle={playerSubtitle(a, t as (k: never) => string)}
    />
  );

  return (
    <div style={root}>
      <LightHeader title={pageTitle} subtitle={subtitle} onBack={onBack} />

      {showTabs ? (
        <ContentTabs
          tabs={tabs}
          activeId={currentTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {isGame ? (
          <LinesView
            side="light"
            teamPlayers={gameRoster}
            lines={lines}
            isGame
          />
        ) : currentTab === 'teams' ? (
          <div
            style={{
              padding: `${spacing['8']}px ${spacing['16']}px 0`,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing['16'],
            }}
          >
            <div style={{ display: 'flex', gap: spacing['10'], alignItems: 'stretch' }}>
              <LineupZone
                id="light"
                title={t('lineup.teams.light')}
                count={teamGroups.light.length}
                empty={teamGroups.light.length === 0}
                emptyHint={t('lineup.dropHint')}
              >
                {teamGroups.light.map(renderTeamCard)}
              </LineupZone>
              <LineupZone
                id="dark"
                title={t('lineup.teams.dark')}
                count={teamGroups.dark.length}
                empty={teamGroups.dark.length === 0}
                emptyHint={t('lineup.dropHint')}
              >
                {teamGroups.dark.map(renderTeamCard)}
              </LineupZone>
            </div>

            <PoolTeamsSection
              signedTitle={t('lineup.pool.signed')}
              unsignedTitle={t('lineup.pool.notSigned')}
              signed={teamGroups.signed}
              unsigned={teamGroups.unsigned}
              emptyHint={t('lineup.poolEmpty')}
              renderChip={renderPoolChip}
            />
          </div>
        ) : (
          <LinesView
            side={currentTab === 'lines_light' ? 'light' : 'dark'}
            teamPlayers={
              currentTab === 'lines_light' ? teamGroups.light : teamGroups.dark
            }
            lines={lines}
          />
        )}

        <DragOverlay dropAnimation={null}>
          {activeAttendee ? (
            <div style={{ width: overlayLayout === 'horizontal' ? 240 : 132 }}>
              <RosterCard
                dragId={activeAttendee.user_id}
                firstName={activeAttendee.first_name}
                lastName={activeAttendee.last_name}
                photoUrl={activeAttendee.photo_url}
                jersey={activeAttendee.jersey_number}
                positionLabel={
                  overlayLayout === 'horizontal'
                    ? positionLabelShort(activeAttendee.position, t as (k: never) => string)
                    : positionLabel(activeAttendee.position, t as (k: never) => string)
                }
                layout={overlayLayout}
                forOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function PoolTeamsSection({
  signedTitle,
  unsignedTitle,
  signed,
  unsigned,
  emptyHint,
  renderChip,
}: {
  signedTitle: string;
  unsignedTitle: string;
  signed: EventAttendee[];
  unsigned: EventAttendee[];
  emptyHint: string;
  renderChip: (a: EventAttendee) => ReactNode;
}) {
  const drop = useDroppable({ id: 'pool' });

  const isEmpty = signed.length === 0 && unsigned.length === 0;

  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
    padding: spacing['12'],
    background: drop.isOver ? colors.primaryDrop : colors.bgMuted,
    border: drop.isOver
      ? `2px dashed ${colors.headerAccent}`
      : `1px dashed ${colors.line}`,
    borderRadius: 12,
    minHeight: 96,
  };
  const groupHead: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing['6'],
  };
  const groupTitle: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: colors.text,
  };
  const groupCount: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    fontVariantNumeric: 'tabular-nums',
  };
  const list: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['6'],
  };
  const emptyStyle: CSSProperties = {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    padding: `${spacing['12']}px 0`,
  };

  return (
    <div ref={drop.setNodeRef} style={wrap}>
      {isEmpty ? <div style={emptyStyle}>{emptyHint}</div> : null}
      {signed.length > 0 ? (
        <div>
          <div style={groupHead}>
            <span style={groupTitle}>{signedTitle}</span>
            <span style={groupCount}>{signed.length}</span>
          </div>
          <div style={list}>{signed.map(renderChip)}</div>
        </div>
      ) : null}
      {unsigned.length > 0 ? (
        <div>
          <div style={groupHead}>
            <span style={groupTitle}>{unsignedTitle}</span>
            <span style={groupCount}>{unsigned.length}</span>
          </div>
          <div style={list}>{unsigned.map(renderChip)}</div>
        </div>
      ) : null}
    </div>
  );
}
