'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { ArchiveTeamResponse } from '@/types/api';

// Soft-archive команды: проставить archived_at. Поведение архивированной
// команды (что недоступно, кто видит, разархивирование) — post-MVP.
export function useArchiveTeam(): UseMutationResult<ArchiveTeamResponse, ApiError, void> {
  const qc = useQueryClient();
  return useMutation<ArchiveTeamResponse, ApiError, void>({
    mutationFn: () =>
      apiFetch<ArchiveTeamResponse>('/api/teams/me/archive', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-settings'] });
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
