'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { EventDetailDto } from '@/types/api';

export function useEvent(id: string | undefined): UseQueryResult<EventDetailDto> {
  return useQuery<EventDetailDto>({
    queryKey: ['event', id],
    queryFn: () => apiFetch<EventDetailDto>(`/api/events/${id}`),
    enabled: Boolean(id),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}
