'use client';

import { useMemo, type CSSProperties } from 'react';
import { Avatar } from '@/components/avatar';
import { Chip } from '@/components/chip';
import { IconChevronRight } from '@/components/icons';
import { formatName } from '@/lib/format-name';
import {
  lineIndexOfSlot,
  slotKind,
  slotSortKey,
} from '@/lib/event-lines';
import type {
  EventAttendee,
  EventLineEntry,
  TeamSide,
} from '@/types/api';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export type PlayerLineupKind = 'forward' | 'defense' | 'goalie';

type Labels = {
  title: string;
  viewAll: string;
  you: string;
  sideOnlyTitle: string;
  sideOnlyHint: string;
  notInRosterTitle: string;
  notInRosterHint: string;
  notGoingTitle: string;
  notGoingHint: string;
  linePrefix: string;
  defensePrefix: string;
  goalieLabel: string;
  sideLight: string;
  sideDark: string;
  // ключ = role (lw|c|rw|ld|rd|g|g1|g2)
  positions: Record<string, string>;
};

type Props = {
  myUserId: string;
  myVote: 'going' | 'not_going' | null;
  mySide: TeamSide | null;
  isGame: boolean;
  attendees: EventAttendee[];
  lines: EventLineEntry[];
  labels: Labels;
  onOpenLineup: () => void;
};

export function PlayerLineupBlock({
  myUserId,
  myVote,
  mySide,
  isGame,
  attendees,
  lines,
  labels,
  onOpenLineup,
}: Props) {
  const myLine = useMemo(() => lines.find((l) => l.user_id === myUserId) ?? null, [lines, myUserId]);

  const lineMates = useMemo(() => {
    if (!myLine) return [] as EventLineEntry[];
    const kind = slotKind(myLine.slot);
    if (kind === 'goalie') return [myLine];
    const lineIdx = lineIndexOfSlot(myLine.slot);
    if (lineIdx == null) return [myLine];
    return lines
      .filter(
        (l) =>
          l.team_side === myLine.team_side &&
          slotKind(l.slot) === kind &&
          lineIndexOfSlot(l.slot) === lineIdx,
      )
      .sort((a, b) => slotSortKey(a.slot) - slotSortKey(b.slot));
  }, [lines, myLine]);

  const attendeeById = useMemo(() => {
    const map = new Map<string, EventAttendee>();
    for (const a of attendees) map.set(a.user_id, a);
    return map;
  }, [attendees]);

  if (myVote === 'not_going') {
    return (
      <EmptyCard title={labels.notGoingTitle} hint={labels.notGoingHint} />
    );
  }

  if (!myLine) {
    if (mySide) {
      return (
        <SideOnlyCard
          mySide={mySide}
          title={labels.sideOnlyTitle}
          hint={labels.sideOnlyHint}
          isGame={isGame}
          sideLightLabel={labels.sideLight}
          sideDarkLabel={labels.sideDark}
        />
      );
    }
    return (
      <EmptyCard
        title={labels.notInRosterTitle}
        hint={labels.notInRosterHint}
      />
    );
  }

  const kind = slotKind(myLine.slot);
  const lineIdx = lineIndexOfSlot(myLine.slot);
  const lineLabel =
    kind === 'goalie'
      ? labels.goalieLabel
      : kind === 'forward'
        ? `${labels.linePrefix} ${lineIdx ?? '?'}`
        : `${labels.defensePrefix} ${lineIdx ?? '?'}`;

  const chipLabel =
    !isGame && myLine.team_side
      ? `${myLine.team_side === 'light' ? labels.sideLight : labels.sideDark} · ${lineLabel}`
      : lineLabel;

  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['16'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };

  const headRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing['8'],
  };

  return (
    <div style={card}>
      <div style={headRow}>
        <span style={{ fontSize: 18, fontWeight: 800, color: colors.text }}>{labels.title}</span>
        <Chip tone={myLine.team_side === 'dark' ? 'dark' : 'neutral'}>{chipLabel}</Chip>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(lineMates.length, 1)}, 1fr)`,
          gap: spacing['8'],
        }}
      >
        {lineMates.map((slot) => {
          const a = attendeeById.get(slot.user_id);
          const isMe = slot.user_id === myUserId;
          const name = a ? formatName(a) : '—';
          const roleKey = slot.slot.includes('_') ? slot.slot.split('_')[1] : slot.slot;
          const role = labels.positions[roleKey] ?? '';
          return (
            <SlotCard
              key={slot.slot}
              name={name}
              photoUrl={a?.photo_url ?? null}
              role={role}
              isMe={isMe}
              youLabel={labels.you}
            />
          );
        })}
      </div>

      <button
        type="button"
        className="pressable"
        onClick={onOpenLineup}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing['8'],
          padding: `${spacing['10']}px 0 0`,
          background: 'transparent',
          border: 'none',
          borderTop: `1px solid ${colors.divider}`,
          cursor: 'pointer',
          color: colors.text,
          fontSize: 15,
          fontWeight: 500,
          textAlign: 'left',
        }}
      >
        <span style={{ flex: 1 }}>{labels.viewAll}</span>
        <IconChevronRight />
      </button>
    </div>
  );
}

type SlotCardProps = {
  name: string;
  photoUrl: string | null;
  role: string;
  isMe: boolean;
  youLabel: string;
};

function SlotCard({ name, photoUrl, role, isMe, youLabel }: SlotCardProps) {
  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing['6'],
    minWidth: 0,
  };
  const avatarBox: CSSProperties = {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: '50%',
    border: isMe ? `2px solid ${colors.primary}` : 'none',
    padding: isMe ? 2 : 0,
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const youChip: CSSProperties = {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    transform: 'translateX(-50%)',
    background: colors.primary,
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: radius.pill,
    lineHeight: '14px',
  };
  return (
    <div style={wrap}>
      <span style={avatarBox}>
        <Avatar src={photoUrl} name={name} size={isMe ? 64 : 64} />
        {isMe ? <span style={youChip}>{youLabel}</span> : null}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: colors.text,
          textAlign: 'center',
          lineHeight: 1.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </span>
      {role ? (
        <span
          style={{
            fontSize: 11,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          {role}
        </span>
      ) : null}
    </div>
  );
}

type SideOnlyCardProps = {
  mySide: TeamSide;
  title: string;
  hint: string;
  isGame: boolean;
  sideLightLabel: string;
  sideDarkLabel: string;
};

function SideOnlyCard({ mySide, title, hint, isGame, sideLightLabel, sideDarkLabel }: SideOnlyCardProps) {
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['16'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };
  const sideLabel = isGame
    ? title
    : mySide === 'light'
      ? sideLightLabel
      : sideDarkLabel;
  return (
    <div style={card}>
      <span style={{ fontSize: 18, fontWeight: 800, color: colors.text }}>{title}</span>
      <Chip tone={mySide === 'dark' ? 'dark' : 'neutral'}>{sideLabel}</Chip>
      <span style={{ fontSize: 13, color: colors.textSecondary }}>{hint}</span>
    </div>
  );
}

function EmptyCard({ title, hint }: { title: string; hint: string }) {
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['20'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
    textAlign: 'center',
    alignItems: 'center',
  };
  return (
    <div style={card}>
      <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{title}</span>
      <span style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.4 }}>{hint}</span>
    </div>
  );
}
