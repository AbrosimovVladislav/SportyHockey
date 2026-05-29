'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { TeamPublicDto } from '@/types/api';

// Базовые публичные поля команды — для хаба /squad и шапок. Доступно
// любому участнику (не organizer-only).
export function useTeam(): UseQueryResult<TeamPublicDto> {
  return useQuery<TeamPublicDto>({
    queryKey: ['team'],
    queryFn: () => apiFetch<TeamPublicDto>('/api/teams/me'),
  });
}
