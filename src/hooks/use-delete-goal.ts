'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { invalidateHome } from '@/lib/invalidate-home';
import { invalidatePlayer } from '@/lib/invalidate-player';
import type { DeleteGoalResponse } from '@/types/api';

export function useDeleteGoal(
  eventId: string,
): UseMutationResult<DeleteGoalResponse, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<DeleteGoalResponse, ApiError, string>({
    mutationFn: (goalId) =>
      apiFetch<DeleteGoalResponse>(`/api/events/${eventId}/goals/${goalId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-result', eventId] });
      // удалённого автора/ассистентов из vars (только goalId) не вычислить
      invalidatePlayer(qc);
      invalidateHome(qc, { dashboardStats: true, nextEvent: false, homeActions: false });
    },
  });
}
