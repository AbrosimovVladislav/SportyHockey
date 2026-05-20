'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { DeleteMediaResponse, EventMediaResponse } from '@/types/api';

export function useDeleteMedia(
  eventId: string,
): UseMutationResult<DeleteMediaResponse, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<DeleteMediaResponse, ApiError, string, EventMediaResponse | undefined>({
    mutationFn: (mediaId) =>
      apiFetch<DeleteMediaResponse>(`/api/events/${eventId}/media/${mediaId}`, {
        method: 'DELETE',
      }),
    onMutate: async (mediaId) => {
      await qc.cancelQueries({ queryKey: ['event-media', eventId] });
      const prev = qc.getQueryData<EventMediaResponse>(['event-media', eventId]);
      if (prev) {
        qc.setQueryData<EventMediaResponse>(['event-media', eventId], {
          items: prev.items.filter((it) => it.id !== mediaId),
        });
      }
      return prev;
    },
    onError: (_e, _mediaId, ctx) => {
      if (ctx) qc.setQueryData(['event-media', eventId], ctx);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['event-media', eventId] });
      qc.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}
