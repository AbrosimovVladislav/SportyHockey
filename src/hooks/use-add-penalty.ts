'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-result', eventId] });
    },
  });
}
