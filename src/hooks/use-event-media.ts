'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { EventMediaResponse } from '@/types/api';

export function useEventMedia(
  eventId: string | undefined,
): UseQueryResult<EventMediaResponse> {
  return useQuery<EventMediaResponse>({
    queryKey: ['event-media', eventId],
    queryFn: () => apiFetch<EventMediaResponse>(`/api/events/${eventId}/media`),
    enabled: Boolean(eventId),
  });
}
