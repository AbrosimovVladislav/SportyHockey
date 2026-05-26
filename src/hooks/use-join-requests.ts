'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type {
  JoinRequestDecisionRequest,
  JoinRequestDecisionResponse,
  JoinRequestsResponse,
} from '@/types/api';

// Входящие заявки на вступление (для организатора).
export function useJoinRequests(enabled: boolean): UseQueryResult<JoinRequestsResponse> {
  return useQuery<JoinRequestsResponse>({
    queryKey: ['join-requests'],
    queryFn: () => apiFetch<JoinRequestsResponse>('/api/teams/me/join-requests'),
    enabled,
  });
}

type DecideVars = { id: string; action: JoinRequestDecisionRequest['action'] };

export function useDecideJoinRequest(): UseMutationResult<
  JoinRequestDecisionResponse,
  ApiError,
  DecideVars
> {
  const qc = useQueryClient();
  return useMutation<JoinRequestDecisionResponse, ApiError, DecideVars>({
    mutationFn: ({ id, action }) =>
      apiFetch<JoinRequestDecisionResponse>(`/api/teams/me/join-requests/${id}`, {
        method: 'POST',
        body: JSON.stringify({ action } satisfies JoinRequestDecisionRequest),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['join-requests'] });
      qc.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}
