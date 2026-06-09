'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { invalidateHome } from '@/lib/invalidate-home';
import { invalidatePlayer } from '@/lib/invalidate-player';
import type { DeletePenaltyResponse } from '@/types/api';

export function useDeletePenalty(
  eventId: string,
): UseMutationResult<DeletePenaltyResponse, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<DeletePenaltyResponse, ApiError, string>({
    mutationFn: (penaltyId) =>
      apiFetch<DeletePenaltyResponse>(`/api/events/${eventId}/penalties/${penaltyId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-result', eventId] });
      // удалённого игрока из vars (только penaltyId) не вычислить
      invalidatePlayer(qc);
      invalidateHome(qc, { dashboardStats: true, nextEvent: false, homeActions: false });
    },
  });
}
