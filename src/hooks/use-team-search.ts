'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { TeamSearchResponse } from '@/types/api';

// Поиск команды при онбординге игрока.
export function useTeamSearch(q: string): UseQueryResult<TeamSearchResponse> {
  return useQuery<TeamSearchResponse>({
    queryKey: ['team-search', q],
    queryFn: () => apiFetch<TeamSearchResponse>(`/api/teams/search?q=${encodeURIComponent(q)}`),
  });
}
