'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type {
  PlayerFinance,
  PlayerOverview,
  PlayerStats,
  TeamMemberDetailResponse,
} from '@/types/api';

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

export function usePlayerFinance(userId: string, enabled = true): UseQueryResult<PlayerFinance> {
  return useQuery<PlayerFinance>({
    queryKey: ['player-finance', userId],
    queryFn: () => apiFetch<PlayerFinance>(`/api/teams/me/members/${userId}/finance`),
    enabled: Boolean(userId) && enabled,
  });
}

export function usePlayerStats(userId: string, enabled = true): UseQueryResult<PlayerStats> {
  return useQuery<PlayerStats>({
    queryKey: ['player-stats', userId],
    queryFn: () => apiFetch<PlayerStats>(`/api/teams/me/members/${userId}/stats`),
    enabled: Boolean(userId) && enabled,
  });
}
