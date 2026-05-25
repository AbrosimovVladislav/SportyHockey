'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { DeleteMemberResponse } from '@/types/api';

export function useDeleteMember(
  userId: string,
): UseMutationResult<DeleteMemberResponse, ApiError, void> {
  const qc = useQueryClient();
  return useMutation<DeleteMemberResponse, ApiError, void>({
    mutationFn: () =>
      apiFetch<DeleteMemberResponse>(`/api/teams/me/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-members'] });
      qc.removeQueries({ queryKey: ['team-member', userId] });
      // игрок мог стоять в дефолтных звеньях/распределении — их тоже пересчитать
      qc.invalidateQueries({ queryKey: ['team-lines'] });
      qc.invalidateQueries({ queryKey: ['team-sides'] });
    },
  });
}
