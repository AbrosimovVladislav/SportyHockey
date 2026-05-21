'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { UpdatePenaltyRequest, UpdatePenaltyResponse } from '@/types/api';

type Vars = { penaltyId: string; body: UpdatePenaltyRequest };

export function useUpdatePenalty(
  eventId: string,
): UseMutationResult<UpdatePenaltyResponse, ApiError, Vars> {
  const qc = useQueryClient();
  return useMutation<UpdatePenaltyResponse, ApiError, Vars>({
    mutationFn: ({ penaltyId, body }) =>
      apiFetch<UpdatePenaltyResponse>(`/api/events/${eventId}/penalties/${penaltyId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-result', eventId] });
    },
  });
}
