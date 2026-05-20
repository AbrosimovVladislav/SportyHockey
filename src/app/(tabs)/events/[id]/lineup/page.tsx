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
import { LineupChip } from '@/components/lineup-chip';
import { LineupZone } from '@/components/lineup-zone';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { useEvent } from '@/hooks/use-event';
import { useSetLineup } from '@/hooks/use-set-lineup';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useTgSwipes } from '@/hooks/use-tg-swipes';
import { formatEventDateRange } from '@/lib/event-format';
import { formatName } from '@/lib/format-name';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { EventAttendee, PlayerPosition, TeamSide } from '@/types/api';

type ZoneId = TeamSide | 'pool';

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
  useTgSwipes(true);

  const ev = useEvent(id);
  const data = ev.data;
  const setLineup = useSetLineup(id);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 350, tolerance: 8 } }),
  );

  const attendees = useMemo(() => data?.attendees ?? [], [data]);
  const byId = useMemo(() => {
    const m = new Map<string, EventAttendee>();
    for (const a of attendees) m.set(a.user_id, a);
    return m;
  }, [attendees]);

  const groups = useMemo(() => {
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

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const userId = String(e.active.id);
    const overId = e.over?.id ? (String(e.over.id) as ZoneId) : undefined;
    if (!overId) return;
    const current = byId.get(userId)?.team_side ?? null;
    const next: TeamSide | null =
      overId === 'light' || overId === 'dark' ? overId : null;
    if (current === next) return;
    setLineup.mutate({ user_id: userId, team_side: next });
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

  const renderChip = (a: EventAttendee) => (
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
      <LightHeader title={t('lineup.title')} subtitle={subtitle} onBack={onBack} />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={content}>
          <div style={{ display: 'flex', gap: spacing['10'], alignItems: 'stretch' }}>
            <LineupZone
              id="light"
              title={t('lineup.teams.light')}
              count={groups.light.length}
              empty={groups.light.length === 0}
              emptyHint={t('lineup.dropHint')}
            >
              {groups.light.map((a) => renderChip(a))}
            </LineupZone>
            <LineupZone
              id="dark"
              title={t('lineup.teams.dark')}
              count={groups.dark.length}
              empty={groups.dark.length === 0}
              emptyHint={t('lineup.dropHint')}
            >
              {groups.dark.map((a) => renderChip(a))}
            </LineupZone>
          </div>

          <PoolSection
            signedTitle={t('lineup.pool.signed')}
            unsignedTitle={t('lineup.pool.notSigned')}
            signed={groups.signed}
            unsigned={groups.unsigned}
            emptyHint={t('lineup.poolEmpty')}
            renderChip={(a) => renderChip(a)}
          />
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
    background: drop.isOver ? 'rgba(232, 79, 0, 0.06)' : colors.bgMuted,
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
