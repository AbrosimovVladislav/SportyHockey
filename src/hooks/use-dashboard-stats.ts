'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useActiveTeamStore } from '@/store/active-team';
import type { DashboardStatsResponse } from '@/types/api';

// Блок «Ключевая статистика» на главной (v0.6, итерация 64). Ключ привязан
// к activeTeamId — при переключении команды переключаются и стат-разрезы.
// Инвалидация (когда подключим): use-add-goal / use-update-goal / use-delete-goal
// / use-add-penalty / use-update-penalty / use-delete-penalty / use-create-event
// / use-update-event / use-delete-event / use-create-finance / use-update-finance
// / use-delete-finance (баланс в team_summary).
export function useDashboardStats(): UseQueryResult<DashboardStatsResponse> {
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  return useQuery<DashboardStatsResponse>({
    queryKey: ['dashboard-stats', activeTeamId],
    queryFn: () => apiFetch<DashboardStatsResponse>('/api/team/dashboard-stats'),
  });
}
