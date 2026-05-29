'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { TeamSettingsDto } from '@/types/api';

// Источник данных всех 4 вкладок экрана /squad/settings.
export function useTeamSettings(): UseQueryResult<TeamSettingsDto> {
  return useQuery<TeamSettingsDto>({
    queryKey: ['team-settings'],
    queryFn: () => apiFetch<TeamSettingsDto>('/api/teams/me/settings'),
  });
}
