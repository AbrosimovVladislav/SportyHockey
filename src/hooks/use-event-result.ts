'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { EventResultDto } from '@/types/api';

export function useEventResult(id: string | undefined): UseQueryResult<EventResultDto> {
  return useQuery<EventResultDto>({
    queryKey: ['event-result', id],
    queryFn: () => apiFetch<EventResultDto>(`/api/events/${id}/result`),
    enabled: Boolean(id),
  });
}
