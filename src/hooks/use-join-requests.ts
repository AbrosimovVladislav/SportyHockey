'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { invalidateHome } from '@/lib/invalidate-home';
import type {
  JoinRequestDecisionRequest,
  JoinRequestDecisionResponse,
  JoinRequestsResponse,
} from '@/types/api';

type Scope = 'pending' | 'all';

// Заявки на вступление для организатора. scope='pending' (default) — только
// ожидающие (используется в pop-up в профиле и для бейджа в хабе /squad).
// scope='all' — вся история (для экрана /squad/requests).
export function useJoinRequests(
  enabled: boolean,
  scope: Scope = 'pending',
): UseQueryResult<JoinRequestsResponse> {
  const url = scope === 'all' ? '/api/teams/me/join-requests?status=all' : '/api/teams/me/join-requests?status=pending';
  return useQuery<JoinRequestsResponse>({
    queryKey: ['join-requests', scope],
    queryFn: () => apiFetch<JoinRequestsResponse>(url),
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
      // Инвалидируем оба ключа — и pop-up в профиле, и экран /squad/requests
      // отрисуют свежие данные сразу после решения.
      qc.invalidateQueries({ queryKey: ['join-requests'] });
      // Принятый игрок должен появиться в /squad даже если список не смонтирован.
      qc.invalidateQueries({ queryKey: ['team-members'], refetchType: 'all' });
      // Бейдж pending-counter на плитке «Заявки» на главной.
      invalidateHome(qc, { homeActions: true, nextEvent: false, dashboardStats: false });
    },
  });
}
