'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { TeamStatsResponse, TeamStatsType } from '@/types/api';

// Командная статистика и аналитика. Тип события — сегмент-переключатель
// «Игры / Тренировки» на экране /squad/stats.
export function useTeamStats(type: TeamStatsType): UseQueryResult<TeamStatsResponse> {
  return useQuery<TeamStatsResponse>({
    queryKey: ['team-stats', type],
    queryFn: () => apiFetch<TeamStatsResponse>(`/api/teams/me/stats?type=${type}`),
  });
}
