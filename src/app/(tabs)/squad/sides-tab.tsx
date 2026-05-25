'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
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
import { LineupZone } from '@/components/lineup-zone';
import { LineupChip } from '@/components/lineup-chip';
import { RosterCard } from '@/components/roster-card';
import { useTeamSides, useSetTeamSide } from '@/hooks/use-team-sides';
import { useT } from '@/hooks/use-t';
import { formatName } from '@/lib/format-name';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { TKey } from '@/i18n/ru';
import type { PlayerPosition, TeamMember, TeamSide } from '@/types/api';

type Props = {
  members: TeamMember[];
  canEdit: boolean;
};

function shortPos(pos: PlayerPosition | null, t: (k: TKey) => string): string | null {
  if (pos === 'forward') return t('lineup.positionShort.forward');
  if (pos === 'defender') return t('lineup.positionShort.defender');
  if (pos === 'goalie') return t('lineup.positionShort.goalie');
  return null;
}

function chipSubtitle(m: TeamMember, t: (k: TKey) => string): string | undefined {
  const pos = shortPos(m.position, t);
  if (m.jersey_number != null && pos) return `#${m.jersey_number} · ${pos}`;
  if (m.jersey_number != null) return `#${m.jersey_number}`;
  return pos ?? undefined;
}

export function SquadSidesTab({ members, canEdit }: Props) {
  const t = useT();
  const sidesQ = useTeamSides();
  const setSide = useSetTeamSide();
  const [activeId, setActiveId] = useState<string | null>(null);

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 400, tolerance: 8 },
  });
  const sensors = useSensors(...(canEdit ? [pointerSensor, touchSensor] : []));

  const sideByUser = useMemo(() => {
    const m = new Map<string, TeamSide>();
    for (const s of sidesQ.data?.sides ?? []) m.set(s.user_id, s.team_side);
    return m;
  }, [sidesQ.data]);

  const groups = useMemo(() => {
    const light: TeamMember[] = [];
    const dark: TeamMember[] = [];
    const pool: TeamMember[] = [];
    for (const m of members) {
      const side = sideByUser.get(m.user_id);
      if (side === 'light') light.push(m);
      else if (side === 'dark') dark.push(m);
      else pool.push(m);
    }
    return { light, dark, pool };
  }, [members, sideByUser]);

  const memberById = useMemo(() => {
    const m = new Map<string, TeamMember>();
    for (const p of members) m.set(p.user_id, p);
    return m;
  }, [members]);

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!canEdit) return;
    const userId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    let next: TeamSide | null;
    if (overId === 'light' || overId === 'dark') next = overId;
    else if (overId === 'pool') next = null;
    else return;
    if ((sideByUser.get(userId) ?? null) === next) return;
    setSide.mutate({ user_id: userId, team_side: next });
  };

  const renderCard = (m: TeamMember): ReactNode => (
    <RosterCard
      key={m.user_id}
      dragId={m.user_id}
      firstName={m.first_name}
      lastName={m.last_name}
      photoUrl={m.avatar_url ?? m.photo_url}
      jersey={m.jersey_number}
      positionLabel={shortPos(m.position, t)}
      layout="horizontal"
    />
  );

  const activeMember = activeId ? memberById.get(activeId) : null;

  const wrap: CSSProperties = {
    padding: `${spacing['8']}px ${spacing['16']}px 0`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={wrap}>
        <div style={{ display: 'flex', gap: spacing['10'], alignItems: 'stretch' }}>
          <LineupZone
            id="light"
            title={t('lineup.teams.light')}
            count={groups.light.length}
            empty={groups.light.length === 0}
            emptyHint={t('lineup.dropHint')}
          >
            {groups.light.map(renderCard)}
          </LineupZone>
          <LineupZone
            id="dark"
            title={t('lineup.teams.dark')}
            count={groups.dark.length}
            empty={groups.dark.length === 0}
            emptyHint={t('lineup.dropHint')}
          >
            {groups.dark.map(renderCard)}
          </LineupZone>
        </div>

        <PoolZone
          title={t('squad.sides.poolTitle')}
          count={groups.pool.length}
          emptyHint={t('squad.sides.poolEmpty')}
        >
          {groups.pool.map((m) => (
            <LineupChip
              key={m.user_id}
              id={m.user_id}
              name={formatName(m)}
              photoUrl={m.avatar_url ?? m.photo_url}
              subtitle={chipSubtitle(m, t)}
            />
          ))}
        </PoolZone>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeMember ? (
          <div style={{ width: 240 }}>
            <RosterCard
              dragId={activeMember.user_id}
              firstName={activeMember.first_name}
              lastName={activeMember.last_name}
              photoUrl={activeMember.avatar_url ?? activeMember.photo_url}
              jersey={activeMember.jersey_number}
              positionLabel={shortPos(activeMember.position, t)}
              layout="horizontal"
              forOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function PoolZone({
  title,
  count,
  emptyHint,
  children,
}: {
  title: string;
  count: number;
  emptyHint: string;
  children: ReactNode;
}) {
  const drop = useDroppable({ id: 'pool' });

  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
    padding: spacing['12'],
    background: drop.isOver ? colors.primaryDrop : colors.bgMuted,
    border: drop.isOver ? `2px dashed ${colors.headerAccent}` : `1px dashed ${colors.line}`,
    borderRadius: radius.md,
    minHeight: 96,
  };
  const head: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  };
  const titleStyle: CSSProperties = { fontSize: 13, fontWeight: 700, color: colors.text };
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
  const list: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['6'],
  };

  return (
    <div ref={drop.setNodeRef} style={wrap}>
      <div style={head}>
        <span style={titleStyle}>{title}</span>
        <span style={countStyle}>{count}</span>
      </div>
      {count === 0 ? <div style={emptyStyle}>{emptyHint}</div> : <div style={list}>{children}</div>}
    </div>
  );
}
