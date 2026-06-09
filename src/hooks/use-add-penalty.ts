'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { invalidateHome } from '@/lib/invalidate-home';
import { invalidatePlayer } from '@/lib/invalidate-player';
import type { CreatePenaltyRequest, CreatePenaltyResponse } from '@/types/api';

export function useAddPenalty(
  eventId: string,
): UseMutationResult<CreatePenaltyResponse, ApiError, CreatePenaltyRequest> {
  const qc = useQueryClient();
  return useMutation<CreatePenaltyResponse, ApiError, CreatePenaltyRequest>({
    mutationFn: (body) =>
      apiFetch<CreatePenaltyResponse>(`/api/events/${eventId}/penalties`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['event-result', eventId] });
      if (vars.player_user_id) invalidatePlayer(qc, vars.player_user_id);
      // Минуты удалений в last_game / penalty_minutes таба «Команда».
      invalidateHome(qc, { dashboardStats: true, nextEvent: false, homeActions: false });
    },
  });
}
