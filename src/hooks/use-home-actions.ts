'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useActiveTeamStore } from '@/store/active-team';
import type { HomeActionsResponse } from '@/types/api';

// Контекст quick-actions на главной (v0.6, итерация 63): последнее
// прошедшее событие, последняя прошедшая игра, число заявок на вступление.
// Ключ привязан к activeTeamId. Инвалидируется в use-create-event,
// use-update-event (status → cancelled может «забрать» last_past),
// use-delete-event и в хуках обработки заявок (когда подключим).
export function useHomeActions(): UseQueryResult<HomeActionsResponse> {
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  return useQuery<HomeActionsResponse>({
    queryKey: ['home-actions', activeTeamId],
    queryFn: () => apiFetch<HomeActionsResponse>('/api/team/home-actions'),
  });
}
