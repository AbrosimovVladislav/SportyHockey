'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { UpdateGoalRequest, UpdateGoalResponse } from '@/types/api';

type Vars = { goalId: string; body: UpdateGoalRequest };

export function useUpdateGoal(
  eventId: string,
): UseMutationResult<UpdateGoalResponse, ApiError, Vars> {
  const qc = useQueryClient();
  return useMutation<UpdateGoalResponse, ApiError, Vars>({
    mutationFn: ({ goalId, body }) =>
      apiFetch<UpdateGoalResponse>(`/api/events/${eventId}/goals/${goalId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-result', eventId] });
    },
  });
}
