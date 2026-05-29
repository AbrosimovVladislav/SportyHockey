'use client';

import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { JoinAcceptResponse, JoinPreviewDto } from '@/types/api';

// Превью команды на странице /join/[token] — название и логотип. already=true,
// если пользователь уже в этой команде.
export function useJoinPreview(token: string): UseQueryResult<JoinPreviewDto> {
  return useQuery<JoinPreviewDto>({
    queryKey: ['join-preview', token],
    queryFn: () => apiFetch<JoinPreviewDto>(`/api/join/${encodeURIComponent(token)}/preview`),
    enabled: token.length > 0,
    // Превью — короткоживущий контекст входа; держать stale-кэш бессмысленно.
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

// Принятие приглашения. По успеху клиент редиректит на /squad — список команд
// и членств в /me обновится.
export function useAcceptInvite(token: string): UseMutationResult<JoinAcceptResponse, ApiError, void> {
  const qc = useQueryClient();
  return useMutation<JoinAcceptResponse, ApiError, void>({
    mutationFn: () =>
      apiFetch<JoinAcceptResponse>(`/api/join/${encodeURIComponent(token)}`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['team-members'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}
