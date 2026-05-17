'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { VoteRequest, VoteResponse } from '@/types/api';

export function useVoteEvent(
  eventId: string,
): UseMutationResult<VoteResponse, ApiError, VoteRequest['vote']> {
  const qc = useQueryClient();
  return useMutation<VoteResponse, ApiError, VoteRequest['vote']>({
    mutationFn: (vote) =>
      apiFetch<VoteResponse>('/api/attendance/vote', {
        method: 'POST',
        body: JSON.stringify({ event_id: eventId, vote }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', eventId] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
