import type {
  EventAttendee,
  MemberTier,
  PlayerPosition,
  PlayerSlotRole,
  TeamMember,
  TeamSide,
} from '@/types/api';

export function asPosition(value: string | null | undefined): PlayerPosition | null {
  if (value === 'forward' || value === 'defender' || value === 'goalie') return value;
  return null;
}

export function asSlotRole(value: string | null | undefined): PlayerSlotRole | null {
  if (
    value === 'lw' ||
    value === 'c' ||
    value === 'rw' ||
    value === 'ld' ||
    value === 'rd' ||
    value === 'g'
  ) {
    return value;
  }
  return null;
}

export function asTier(value: string | null | undefined): MemberTier {
  return value === 'reserve' ? 'reserve' : 'main';
}

// Адаптер члена команды к форме EventAttendee — чтобы переиспользовать
// компоненты состава (LinesView, LineupZone, RosterCard) на team-level данных.
export function memberToAttendee(m: TeamMember, side: TeamSide | null = null): EventAttendee {
  return {
    user_id: m.user_id,
    first_name: m.first_name,
    last_name: m.last_name,
    username: m.username,
    photo_url: m.avatar_url ?? m.photo_url,
    role: m.role,
    vote: null,
    jersey_number: m.jersey_number,
    position: m.position,
    showed_up: null,
    paid_amount: null,
    payment_claim: false,
    team_side: side,
  };
}
