'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { invalidateHome } from '@/lib/invalidate-home';
import { invalidatePlayer } from '@/lib/invalidate-player';
import type { CreateGoalRequest, CreateGoalResponse } from '@/types/api';

export function useAddGoal(
  eventId: string,
): UseMutationResult<CreateGoalResponse, ApiError, CreateGoalRequest> {
  const qc = useQueryClient();
  return useMutation<CreateGoalResponse, ApiError, CreateGoalRequest>({
    mutationFn: (body) =>
      apiFetch<CreateGoalResponse>(`/api/events/${eventId}/goals`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['event-result', eventId] });
      for (const id of [vars.scorer_user_id, vars.assist1_user_id, vars.assist2_user_id]) {
        if (id) invalidatePlayer(qc, id);
      }
      // Новый гол → top-5 / счёт последней игры / goals_for/against на главной.
      invalidateHome(qc, { dashboardStats: true, nextEvent: false, homeActions: false });
    },
  });
}
