'use client';

import { useMe } from '@/hooks/use-me';

export type IsOrganizerResult = {
  isOrganizer: boolean;
  isLoading: boolean;
};

export function useIsOrganizer(teamId?: string | null): IsOrganizerResult {
  const me = useMe();
  const isLoading = me.isLoading;
  const memberships = me.data?.memberships;
  if (!memberships) {
    return { isOrganizer: false, isLoading };
  }
  const isOrganizer = memberships.some(
    (m) => m.role === 'organizer' && (teamId == null || m.team_id === teamId),
  );
  return { isOrganizer, isLoading };
}
