'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { PlayerOverview, TeamMemberDetailResponse } from '@/types/api';

export function useTeamMember(userId: string): UseQueryResult<TeamMemberDetailResponse> {
  return useQuery<TeamMemberDetailResponse>({
    queryKey: ['team-member', userId],
    queryFn: () => apiFetch<TeamMemberDetailResponse>(`/api/teams/me/members/${userId}`),
    enabled: Boolean(userId),
  });
}

export function usePlayerOverview(userId: string): UseQueryResult<PlayerOverview> {
  return useQuery<PlayerOverview>({
    queryKey: ['player-overview', userId],
    queryFn: () => apiFetch<PlayerOverview>(`/api/teams/me/members/${userId}/overview`),
    enabled: Boolean(userId),
  });
}
