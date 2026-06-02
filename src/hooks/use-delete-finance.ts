'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { invalidatePlayer } from '@/lib/invalidate-player';
import type { DeleteFinanceResponse } from '@/types/api';

// Удаление транзакции через DELETE /api/finance/[id]. user_id опционален —
// нужен только для инвалидации профиля затронутого игрока (если была привязка).
export type DeleteFinanceVars = {
  id: string;
  user_id?: string | null;
};

export function useDeleteFinance(): UseMutationResult<
  DeleteFinanceResponse,
  ApiError,
  DeleteFinanceVars
> {
  const qc = useQueryClient();
  return useMutation<DeleteFinanceResponse, ApiError, DeleteFinanceVars>({
    mutationFn: ({ id }) =>
      apiFetch<DeleteFinanceResponse>(`/api/finance/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['team-balance'] });
      qc.invalidateQueries({ queryKey: ['finance-list'] });
      qc.invalidateQueries({ queryKey: ['players-balance'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event'] });
      if (vars.user_id) invalidatePlayer(qc, vars.user_id);
    },
  });
}
