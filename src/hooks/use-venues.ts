'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { VenuesListResponse } from '@/types/api';

export function useVenues(): UseQueryResult<VenuesListResponse> {
  return useQuery<VenuesListResponse>({
    queryKey: ['venues'],
    queryFn: () => apiFetch<VenuesListResponse>('/api/venues'),
  });
}
