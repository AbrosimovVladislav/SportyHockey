import type { MemberRole } from '@/types/api';

export function asMemberRole(value: string | null | undefined): MemberRole {
  return value === 'organizer' ? 'organizer' : 'player';
}
