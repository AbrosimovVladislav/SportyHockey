'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { LinePlayerChip } from '@/components/line-player-chip';
import { LineSlot } from '@/components/line-slot';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { useT } from '@/hooks/use-t';
import { formatName } from '@/lib/format-name';
import { forwardSlot, defenseSlot } from '@/lib/event-lines';
import type { EventAttendee, EventLineEntry, LineSlot as LineSlotKey, TeamSide } from '@/types/api';

type Props = {
  side: TeamSide;
  teamPlayers: EventAttendee[];
  lines: EventLineEntry[];
};

export function LinesView({ side, teamPlayers, lines }: Props) {
  const t = useT();

  const linesForSide = lines.filter((l) => l.team_side === side);
  const slotToUser = new Map<LineSlotKey, string>();
  const userToSlot = new Map<string, LineSlotKey>();
  for (const l of linesForSide) {
    slotToUser.set(l.slot, l.user_id);
    userToSlot.set(l.user_id, l.slot);
  }

  const byId = new Map<string, EventAttendee>();
  for (const p of teamPlayers) byId.set(p.user_id, p);

  const reserves = teamPlayers.filter((p) => !userToSlot.has(p.user_id));

  const section: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['6'],
  };
  const sectionHead: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: colors.text,
  };
  const row: CSSProperties = {
    display: 'flex',
    gap: spacing['6'],
  };

  const renderSlot = (slot: LineSlotKey, label: string) => {
    const userId = slotToUser.get(slot);
    const a = userId ? byId.get(userId) : undefined;
    return (
      <LineSlot
        key={slot}
        id={slot}
        roleLabel={label}
        filled={Boolean(a)}
      >
        {a ? (
          <LinePlayerChip
            dragId={a.user_id}
            name={formatName(a)}
            photoUrl={a.photo_url}
            jersey={a.jersey_number}
            roleLabel={label}
          />
        ) : null}
      </LineSlot>
    );
  };

  if (teamPlayers.length === 0) {
    return (
      <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
        <span style={{ fontSize: 13, color: colors.textSecondary }}>
          {t('lineup.lines.noTeamHint')}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing['16'],
        padding: `${spacing['8']}px ${spacing['16']}px 0`,
      }}
    >
      {([1, 2, 3] as const).map((n) => (
        <div key={`fwd-${n}`} style={section}>
          <div style={sectionHead}>
            {t('lineup.lines.forward').replace('{n}', String(n))}
          </div>
          <div style={row}>
            {renderSlot(forwardSlot(n, 'lw'), t('lineup.role.lw'))}
            {renderSlot(forwardSlot(n, 'c'), t('lineup.role.c'))}
            {renderSlot(forwardSlot(n, 'rw'), t('lineup.role.rw'))}
          </div>
        </div>
      ))}

      {([1, 2, 3] as const).map((n) => (
        <div key={`def-${n}`} style={section}>
          <div style={sectionHead}>
            {t('lineup.lines.defense').replace('{n}', String(n))}
          </div>
          <div style={row}>
            {renderSlot(defenseSlot(n, 'ld'), t('lineup.role.ld'))}
            {renderSlot(defenseSlot(n, 'rd'), t('lineup.role.rd'))}
          </div>
        </div>
      ))}

      <div style={section}>
        <div style={sectionHead}>{t('lineup.lines.goalie')}</div>
        <div style={row}>
          {renderSlot('g', t('lineup.role.g'))}
          <div style={{ flex: 1 }} />
        </div>
      </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['6'] }}>
            {reserves.map((a) => (
              <LinePlayerChip
                key={a.user_id}
                dragId={a.user_id}
                name={formatName(a)}
                photoUrl={a.photo_url}
                jersey={a.jersey_number}
                roleLabel={null}
              />
            ))}
          </div>
        )}
      </ReservesPool>
    </div>
  );
}

function ReservesPool({ children }: { children: ReactNode }) {
  const drop = useDroppable({ id: 'pool_lines' });
  const style: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
    padding: spacing['12'],
    background: drop.isOver ? 'rgba(232, 79, 0, 0.06)' : colors.bgMuted,
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
