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
import type { BindTeamChannelRequest, TeamChannelDto } from '@/types/api';

// Группа команды в Telegram для анонсов (итерации 70–71). Привязка бывает и «снаружи»
// приложения (бота добавили в группу), поэтому держим короткий staleTime и обновляемся
// при возврате в Mini App.
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

// Привязка публичной группы по @нику из настроек команды.
export function useBindTeamChannel(): UseMutationResult<
  TeamChannelDto,
  ApiError,
  BindTeamChannelRequest
> {
  const qc = useQueryClient();
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  return useMutation<TeamChannelDto, ApiError, BindTeamChannelRequest>({
    mutationFn: (body) =>
      apiFetch<TeamChannelDto>('/api/teams/me/channel', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      qc.setQueryData(['team-channel', activeTeamId], data);
    },
  });
}
