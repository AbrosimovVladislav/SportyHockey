'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { EventsListResponse } from '@/types/api';

export function useEvents(): UseQueryResult<EventsListResponse> {
  return useQuery<EventsListResponse>({
    queryKey: ['events'],
    queryFn: () => apiFetch<EventsListResponse>('/api/events'),
  });
}
