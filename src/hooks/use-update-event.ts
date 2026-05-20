'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { UpdateEventRequest, UpdateEventResponse } from '@/types/api';

export function useUpdateEvent(
  eventId: string,
): UseMutationResult<UpdateEventResponse, ApiError, UpdateEventRequest> {
  const qc = useQueryClient();
  return useMutation<UpdateEventResponse, ApiError, UpdateEventRequest>({
    mutationFn: (body) =>
      apiFetch<UpdateEventResponse>(`/api/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', eventId] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
