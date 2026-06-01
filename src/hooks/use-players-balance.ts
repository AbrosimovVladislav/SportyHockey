'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useActiveTeamStore } from '@/store/active-team';
import type { PlayersBalanceResponse } from '@/types/api';

// Балансы всех игроков активной команды для экрана `/money/players`. Привязан
// к activeTeamId — при переключении команды список переключается. Инвалидация
// после мутаций над `finance_transactions` уже включена в `useCreateFinance`
// через ключ `['players-balance']`.
export function usePlayersBalance(enabled = true): UseQueryResult<PlayersBalanceResponse> {
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  return useQuery<PlayersBalanceResponse>({
    queryKey: ['players-balance', activeTeamId],
    queryFn: () => apiFetch<PlayersBalanceResponse>('/api/finance/players'),
    enabled,
  });
}
