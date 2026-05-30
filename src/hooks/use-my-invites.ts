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
  ApplyToTeamRequest,
  ApplyToTeamResponse,
  MyInviteDecisionRequest,
  MyInviteDecisionResponse,
  MyInvitesResponse,
} from '@/types/api';

// Личный инбокс игрока (v0.4, итерация 46): все приглашения и заявки,
// где игрок является субъектом (team_join_requests.user_id = me.id).
export function useMyInvites(enabled = true): UseQueryResult<MyInvitesResponse> {
  return useQuery<MyInvitesResponse>({
    queryKey: ['my-invites'],
    queryFn: () => apiFetch<MyInvitesResponse>('/api/me/invites'),
    enabled,
  });
}

type DecideVars = { id: string; action: MyInviteDecisionRequest['action'] };

export function useDecideMyInvite(): UseMutationResult<
  MyInviteDecisionResponse,
  ApiError,
  DecideVars
> {
  const qc = useQueryClient();
  return useMutation<MyInviteDecisionResponse, ApiError, DecideVars>({
    mutationFn: ({ id, action }) =>
      apiFetch<MyInviteDecisionResponse>(`/api/me/invites/${id}/decide`, {
        method: 'POST',
        body: JSON.stringify({ action } satisfies MyInviteDecisionRequest),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-invites'] });
      // Принятое приглашение добавляет игрока в команду — обновляем me.
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useApplyToTeam(): UseMutationResult<
  ApplyToTeamResponse,
  ApiError,
  ApplyToTeamRequest
> {
  const qc = useQueryClient();
  return useMutation<ApplyToTeamResponse, ApiError, ApplyToTeamRequest>({
    mutationFn: (body) =>
      apiFetch<ApplyToTeamResponse>('/api/me/join-requests', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-invites'] });
    },
  });
}
