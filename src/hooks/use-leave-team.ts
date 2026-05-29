'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { LeaveTeamResponse } from '@/types/api';

// Организатор выходит из команды (доступно только организатору; сервер
// возвращает 409, если он единственный).
export function useLeaveTeam(): UseMutationResult<LeaveTeamResponse, ApiError, void> {
  const qc = useQueryClient();
  return useMutation<LeaveTeamResponse, ApiError, void>({
    mutationFn: () =>
      apiFetch<LeaveTeamResponse>('/api/teams/me/leave', { method: 'POST' }),
    onSuccess: () => {
      // После выхода — состав команды и собственный профиль теряют контекст.
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['team-settings'] });
      qc.invalidateQueries({ queryKey: ['team-members'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}
