'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useActiveTeamStore } from '@/store/active-team';
import type { TeamBalanceResponse } from '@/types/api';

// Хук для разбивки баланса активной команды на хабе `/money`. Привязан
// к activeTeamId — при переключении команды переключается и баланс.
export function useTeamBalance(enabled = true): UseQueryResult<TeamBalanceResponse> {
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  return useQuery<TeamBalanceResponse>({
    queryKey: ['team-balance', activeTeamId],
    queryFn: () => apiFetch<TeamBalanceResponse>('/api/finance/balance'),
    enabled,
  });
}
