'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
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
    },
  });
}
