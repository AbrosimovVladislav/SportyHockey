'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { RosterCard } from '@/components/roster-card';
import { LineSlot as LineSlotComponent } from '@/components/line-slot';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { useT } from '@/hooks/use-t';
import {
  MAX_LINE_INDEX,
  defenseSlot,
  forwardSlot,
  parseDefenseIndex,
  parseForwardIndex,
} from '@/lib/event-lines';
import type {
  EventAttendee,
  EventLineEntry,
  LineIndex,
  LineSlot as LineSlotKey,
  PlayerPosition,
  TeamSide,
} from '@/types/api';

type Props = {
  side: TeamSide;
  teamPlayers: EventAttendee[];
  lines: EventLineEntry[];
  isGame?: boolean;
};

function positionLabel(pos: PlayerPosition | null, t: (k: never) => string): string | null {
  if (!pos) return null;
  if (pos === 'forward') return t('rosterDay.position.forward' as never);
  if (pos === 'defender') return t('rosterDay.position.defender' as never);
  if (pos === 'goalie') return t('rosterDay.position.goalie' as never);
  return null;
}

export function LinesView({ side, teamPlayers, lines, isGame = false }: Props) {
  const t = useT();

  const linesForSide = useMemo(
    () => lines.filter((l) => l.team_side === side),
    [lines, side],
  );

  const occupiedMaxForward = useMemo(() => {
    let m = 0;
    for (const l of linesForSide) {
      const idx = parseForwardIndex(l.slot);
      if (idx != null && idx > m) m = idx;
    }
    return m;
  }, [linesForSide]);

  const occupiedMaxDefense = useMemo(() => {
    let m = 0;
    for (const l of linesForSide) {
      const idx = parseDefenseIndex(l.slot);
      if (idx != null && idx > m) m = idx;
    }
    return m;
  }, [linesForSide]);

  const [forwardCount, setForwardCount] = useState<number>(
    Math.max(1, occupiedMaxForward),
  );
  const [defenseCount, setDefenseCount] = useState<number>(
    Math.max(1, occupiedMaxDefense),
  );

  useEffect(() => {
    setForwardCount((prev) => Math.max(prev, occupiedMaxForward, 1));
  }, [occupiedMaxForward]);
  useEffect(() => {
    setDefenseCount((prev) => Math.max(prev, occupiedMaxDefense, 1));
  }, [occupiedMaxDefense]);

  const slotToUser = useMemo(() => {
    const m = new Map<LineSlotKey, string>();
    for (const l of linesForSide) m.set(l.slot, l.user_id);
    return m;
  }, [linesForSide]);

  const userToSlot = useMemo(() => {
    const m = new Map<string, LineSlotKey>();
    for (const l of linesForSide) m.set(l.user_id, l.slot);
    return m;
  }, [linesForSide]);

  const byId = useMemo(() => {
    const m = new Map<string, EventAttendee>();
    for (const p of teamPlayers) m.set(p.user_id, p);
    return m;
  }, [teamPlayers]);

  const reserves = teamPlayers.filter((p) => !userToSlot.has(p.user_id));

  if (teamPlayers.length === 0) {
    return (
      <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
        <span style={{ fontSize: 13, color: colors.textSecondary }}>
          {isGame ? t('lineup.lines.poolEmptyGame') : t('lineup.lines.noTeamHint')}
        </span>
      </div>
    );
  }

  const renderSlot = (slot: LineSlotKey, label: string) => {
    const userId = slotToUser.get(slot);
    const a = userId ? byId.get(userId) : undefined;
    return (
      <LineSlotComponent key={slot} id={slot} roleLabel={label} filled={Boolean(a)}>
        {a ? (
          <RosterCard
            dragId={a.user_id}
            firstName={a.first_name}
            lastName={a.last_name}
            photoUrl={a.photo_url}
            jersey={a.jersey_number}
            positionLabel={label}
          />
        ) : null}
      </LineSlotComponent>
    );
  };

  const forwardEmpty = (i: number) => {
    const idx = i as LineIndex;
    return (
      !slotToUser.has(forwardSlot(idx, 'lw')) &&
      !slotToUser.has(forwardSlot(idx, 'c')) &&
      !slotToUser.has(forwardSlot(idx, 'rw'))
    );
  };

  const defenseEmpty = (i: number) => {
    const idx = i as LineIndex;
    return (
      !slotToUser.has(defenseSlot(idx, 'ld')) &&
      !slotToUser.has(defenseSlot(idx, 'rd'))
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing['16'],
        padding: `${spacing['8']}px ${spacing['16']}px 0`,
      }}
    >
      {Array.from({ length: forwardCount }, (_, k) => k + 1).map((n) => (
        <section key={`fwd-${n}`} style={section}>
          <SectionHead
            title={t('lineup.lines.forward').replace('{n}', String(n))}
            canRemove={n === forwardCount && forwardCount > 1 && forwardEmpty(n)}
            onRemove={() => setForwardCount((prev) => Math.max(1, prev - 1))}
            removeLabel={t('lineup.lines.removeLine')}
          />
          <div style={row}>
            {renderSlot(forwardSlot(n as LineIndex, 'lw'), t('lineup.role.lw'))}
            {renderSlot(forwardSlot(n as LineIndex, 'c'), t('lineup.role.c'))}
            {renderSlot(forwardSlot(n as LineIndex, 'rw'), t('lineup.role.rw'))}
          </div>
        </section>
      ))}
      {forwardCount < MAX_LINE_INDEX ? (
        <AddButton
          label={t('lineup.lines.addForward')}
          onClick={() => setForwardCount((prev) => Math.min(MAX_LINE_INDEX, prev + 1))}
        />
      ) : null}

      {Array.from({ length: defenseCount }, (_, k) => k + 1).map((n) => (
        <section key={`def-${n}`} style={section}>
          <SectionHead
            title={t('lineup.lines.defense').replace('{n}', String(n))}
            canRemove={n === defenseCount && defenseCount > 1 && defenseEmpty(n)}
            onRemove={() => setDefenseCount((prev) => Math.max(1, prev - 1))}
            removeLabel={t('lineup.lines.removeLine')}
          />
          <div style={row}>
            {renderSlot(defenseSlot(n as LineIndex, 'ld'), t('lineup.role.ld'))}
            {renderSlot(defenseSlot(n as LineIndex, 'rd'), t('lineup.role.rd'))}
          </div>
        </section>
      ))}
      {defenseCount < MAX_LINE_INDEX ? (
        <AddButton
          label={t('lineup.lines.addDefense')}
          onClick={() => setDefenseCount((prev) => Math.min(MAX_LINE_INDEX, prev + 1))}
        />
      ) : null}

      <section style={section}>
        <SectionHead
          title={isGame ? t('lineup.lines.goaliePair') : t('lineup.lines.goalie')}
          canRemove={false}
          onRemove={() => {}}
          removeLabel=""
        />
        <div style={row}>
          {isGame ? (
            <>
              {renderSlot('g1', t('lineup.role.g'))}
              {renderSlot('g2', t('lineup.role.g'))}
            </>
          ) : (
            <>
              {renderSlot('g', t('lineup.role.g'))}
              <div style={{ flex: 1 }} />
            </>
          )}
        </div>
      </section>

      <ReservesPool>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>
          {t('lineup.lines.poolTitle')} · {reserves.length}
        </div>
        {reserves.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              color: colors.textTertiary,
              textAlign: 'center',
              padding: `${spacing['12']}px 0`,
            }}
          >
            {t('lineup.lines.poolEmpty')}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: spacing['6'],
            }}
          >
            {reserves.map((a) => (
              <RosterCard
                key={a.user_id}
                dragId={a.user_id}
                firstName={a.first_name}
                lastName={a.last_name}
                photoUrl={a.photo_url}
                jersey={a.jersey_number}
                positionLabel={positionLabel(a.position, t as (k: never) => string)}
              />
            ))}
          </div>
        )}
      </ReservesPool>
    </div>
  );
}

const section: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing['6'],
};

const row: CSSProperties = {
  display: 'flex',
  gap: spacing['6'],
};

function SectionHead({
  title,
  canRemove,
  onRemove,
  removeLabel,
}: {
  title: string;
  canRemove: boolean;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{title}</span>
      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="pressable"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: 12,
            color: colors.textSecondary,
          }}
        >
          − {removeLabel}
        </button>
      ) : null}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable"
      style={{
        alignSelf: 'flex-start',
        background: 'none',
        border: `1px dashed ${colors.line}`,
        borderRadius: radius.md,
        padding: `${spacing['8']}px ${spacing['12']}px`,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        color: colors.textSecondary,
      }}
    >
      {label}
    </button>
  );
}

function ReservesPool({ children }: { children: ReactNode }) {
  const drop = useDroppable({ id: 'pool_lines' });
  const style: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
    padding: spacing['12'],
    background: drop.isOver ? colors.primaryDrop : colors.bgMuted,
    border: drop.isOver
      ? `2px dashed ${colors.headerAccent}`
      : `1px dashed ${colors.line}`,
    borderRadius: radius.md,
    minHeight: 96,
  };
  return (
    <div ref={drop.setNodeRef} style={style}>
      {children}
    </div>
  );
}
