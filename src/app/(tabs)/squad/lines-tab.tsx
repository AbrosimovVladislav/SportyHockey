'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { LinesView } from '@/app/(tabs)/events/[id]/lineup/lines-view';
import { RosterCard } from '@/components/roster-card';
import { useTeamLines, useSetTeamLine } from '@/hooks/use-team-lines';
import { useLineupDndSensors } from '@/hooks/use-lineup-dnd-sensors';
import { useT } from '@/hooks/use-t';
import { asLineSlot } from '@/lib/event-lines';
import { memberToAttendee } from '@/lib/team-member';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { EventLineEntry, LineSlot, PlayerPosition, TeamMember } from '@/types/api';

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

export function SquadLinesTab({ members, canEdit }: Props) {
  const t = useT();
  const linesQ = useTeamLines();
  const setLine = useSetTeamLine();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useLineupDndSensors(canEdit);

  const attendees = useMemo(() => members.map((m) => memberToAttendee(m, 'light')), [members]);

  const lineEntries = useMemo<EventLineEntry[]>(
    () =>
      (linesQ.data?.lines ?? []).map((l) => ({
        team_side: 'light' as const,
        slot: l.slot,
        user_id: l.user_id,
      })),
    [linesQ.data],
  );

  const userToSlot = useMemo(() => {
    const m = new Map<string, LineSlot>();
    for (const l of lineEntries) m.set(l.user_id, l.slot);
    return m;
  }, [lineEntries]);

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

    if (overId === 'pool_lines') {
      if (!userToSlot.has(userId)) return;
      setLine.mutate({ user_id: userId, slot: null });
      return;
    }
    const slot = asLineSlot(overId);
    if (!slot) return;
    if (userToSlot.get(userId) === slot) return;
    setLine.mutate({ user_id: userId, slot });
  };

  if (linesQ.isLoading) {
    return (
      <div style={{ padding: `${spacing['24']}px ${spacing['20']}px` }}>
        <span style={{ ...typography.body, color: colors.textSecondary }}>
          {t('squad.lines.loading')}
        </span>
      </div>
    );
  }

  const activeMember = activeId ? memberById.get(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <LinesView side="light" teamPlayers={attendees} lines={lineEntries} />

      <DragOverlay dropAnimation={null}>
        {activeMember ? (
          <div style={{ width: 132 }}>
            <RosterCard
              dragId={activeMember.user_id}
              firstName={activeMember.first_name}
              lastName={activeMember.last_name}
              photoUrl={activeMember.avatar_url ?? activeMember.photo_url}
              jersey={activeMember.jersey_number}
              positionLabel={shortPos(activeMember.position, t)}
              layout="vertical"
              forOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
