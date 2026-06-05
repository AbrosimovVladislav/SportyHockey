'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useActiveTeamStore } from '@/store/active-team';
import type { HomeNextEventResponse } from '@/types/api';

// Главная страница (v0.6, итерация 62): ближайшее предстоящее событие
// активной команды. Ключ привязан к activeTeamId — при переключении команды
// дайджест переключается. Инвалидируется в use-create-event / use-update-event /
// use-delete-event / use-vote-event / use-set-attendance (когда подключим).
export function useNextEvent(): UseQueryResult<HomeNextEventResponse> {
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  return useQuery<HomeNextEventResponse>({
    queryKey: ['next-event', activeTeamId],
    queryFn: () => apiFetch<HomeNextEventResponse>('/api/team/next-event'),
  });
}
