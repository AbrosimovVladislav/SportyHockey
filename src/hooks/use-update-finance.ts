'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { invalidateHome } from '@/lib/invalidate-home';
import { invalidatePlayer } from '@/lib/invalidate-player';
import type { UpdateFinanceRequest, UpdateFinanceResponse } from '@/types/api';

// Правка существующей транзакции через PATCH /api/finance/[id]. Принимает
// id транзакции + патч + (опционально) старый user_id — он нужен только для
// инвалидации профиля «прежнего» игрока, если в патче user_id меняется.
export type UpdateFinanceVars = {
  id: string;
  patch: UpdateFinanceRequest;
  prev_user_id?: string | null;
};

export function useUpdateFinance(): UseMutationResult<
  UpdateFinanceResponse,
  ApiError,
  UpdateFinanceVars
> {
  const qc = useQueryClient();
  return useMutation<UpdateFinanceResponse, ApiError, UpdateFinanceVars>({
    mutationFn: ({ id, patch }) =>
      apiFetch<UpdateFinanceResponse>(`/api/finance/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['team-balance'] });
      qc.invalidateQueries({ queryKey: ['finance-list'] });
      qc.invalidateQueries({ queryKey: ['players-balance'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event'] });
      qc.invalidateQueries({ queryKey: ['finance-report'] });
      qc.invalidateQueries({ queryKey: ['finance-analytics'] });
      // Профиль старого игрока (если user_id сменился) + нового — оба.
      if (vars.prev_user_id) invalidatePlayer(qc, vars.prev_user_id);
      if (vars.patch.user_id) invalidatePlayer(qc, vars.patch.user_id);
      invalidateHome(qc, { dashboardStats: true, nextEvent: false, homeActions: false });
    },
  });
}
