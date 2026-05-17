'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { TeamMembersResponse } from '@/types/api';

export function useTeamMembers(): UseQueryResult<TeamMembersResponse> {
  return useQuery<TeamMembersResponse>({
    queryKey: ['team-members'],
    queryFn: () => apiFetch<TeamMembersResponse>('/api/teams/me/members'),
  });
}
