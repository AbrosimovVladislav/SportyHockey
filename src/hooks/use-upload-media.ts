'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { EventMediaResponse } from '@/types/api';

export function useUploadMedia(
  eventId: string,
): UseMutationResult<EventMediaResponse, ApiError, File[]> {
  const qc = useQueryClient();
  return useMutation<EventMediaResponse, ApiError, File[]>({
    mutationFn: (files) => {
      const form = new FormData();
      for (const f of files) form.append('files', f);
      return apiFetch<EventMediaResponse>(`/api/events/${eventId}/media`, {
        method: 'POST',
        body: form,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-media', eventId] });
      qc.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}
