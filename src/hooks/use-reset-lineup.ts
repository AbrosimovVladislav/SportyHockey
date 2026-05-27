'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';

// Сброс раскидки события к дефолту команды. Без оптимистика — полный пересбор на сервере,
// просто инвалидируем событие после успеха.
export function useResetLineup(eventId: string): UseMutationResult<{ ok: true }, ApiError, void> {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, ApiError, void>({
    mutationFn: () =>
      apiFetch<{ ok: true }>(`/api/events/${eventId}/lineup/reset`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', eventId], refetchType: 'all' });
    },
  });
}
