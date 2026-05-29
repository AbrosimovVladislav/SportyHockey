'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { TeamInviteDto } from '@/types/api';

// Постоянный токен команды для копирования ссылки приглашения. Лениво
// создаётся на сервере — клиенту достаточно одного GET.
export function useTeamInvite(): UseQueryResult<TeamInviteDto> {
  return useQuery<TeamInviteDto>({
    queryKey: ['team-invite'],
    queryFn: () => apiFetch<TeamInviteDto>('/api/teams/me/invite'),
  });
}
