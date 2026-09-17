'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useActiveTeamStore } from '@/store/active-team';
import type { TeamChannelDto } from '@/types/api';

// Telegram-канал анонсов активной команды (итерация 70). Привязка идёт через бота
// (организатор пересылает ему пост из канала), поэтому статус меняется «снаружи»
// приложения: держим короткий staleTime и обновляемся при возврате в Mini App.
export function useTeamChannel(enabled = true): UseQueryResult<TeamChannelDto> {
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  return useQuery<TeamChannelDto>({
    queryKey: ['team-channel', activeTeamId],
    queryFn: () => apiFetch<TeamChannelDto>('/api/teams/me/channel'),
    enabled: enabled && !!activeTeamId,
    staleTime: 5_000,
  });
}

export function useUnbindTeamChannel(): UseMutationResult<TeamChannelDto, ApiError, void> {
  const qc = useQueryClient();
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  return useMutation<TeamChannelDto, ApiError, void>({
    mutationFn: () => apiFetch<TeamChannelDto>('/api/teams/me/channel', { method: 'DELETE' }),
    onSuccess: (data) => {
      qc.setQueryData(['team-channel', activeTeamId], data);
    },
  });
}
