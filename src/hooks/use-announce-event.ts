'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { AnnounceEventResponse } from '@/types/api';

// Публикация (или повторная публикация) анонса события в Telegram-канал команды.
export function useAnnounceEvent(
  eventId: string,
): UseMutationResult<AnnounceEventResponse, ApiError, void> {
  const qc = useQueryClient();
  return useMutation<AnnounceEventResponse, ApiError, void>({
    mutationFn: () =>
      apiFetch<AnnounceEventResponse>(`/api/events/${eventId}/announce`, { method: 'POST' }),
    onSuccess: () => {
      // announced_at в деталях события меняет подпись пункта меню.
      qc.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}
