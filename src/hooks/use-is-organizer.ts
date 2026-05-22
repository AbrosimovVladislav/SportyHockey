'use client';

import { useMe } from '@/hooks/use-me';
import { useActiveTeamStore } from '@/store/active-team';

export type IsOrganizerResult = {
  isOrganizer: boolean;
  isLoading: boolean;
};

// teamId=undefined → активная команда из store (или первая membership).
// teamId=null → не фильтруем (organizer хоть где-то).
// teamId='uuid' → проверяем эту команду.
export function useIsOrganizer(teamId?: string | null): IsOrganizerResult {
  const me = useMe();
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  const isLoading = me.isLoading;
  const memberships = me.data?.memberships;
  if (!memberships) {
    return { isOrganizer: false, isLoading };
  }
  const resolvedTeamId =
    teamId === undefined ? activeTeamId ?? memberships[0]?.team_id ?? null : teamId;
  const isOrganizer = memberships.some(
    (m) => m.role === 'organizer' && (resolvedTeamId == null || m.team_id === resolvedTeamId),
  );
  return { isOrganizer, isLoading };
}
