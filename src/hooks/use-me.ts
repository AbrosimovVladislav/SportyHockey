'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { MeResponse } from '@/types/api';

export function useMe(): UseQueryResult<MeResponse> {
  return useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () => apiFetch<MeResponse>('/api/me'),
  });
}
