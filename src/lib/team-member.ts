import type { MemberTier, PlayerPosition, PlayerSlotRole } from '@/types/api';

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
