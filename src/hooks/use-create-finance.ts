'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { invalidatePlayer } from '@/lib/invalidate-player';
import type { CreateFinanceRequest, CreateFinanceResponse } from '@/types/api';

// Создание любой транзакции из бoттомшитов quick-actions на `/money`.
// Инвалидирует баланс, ленту и (если транзакция привязана к игроку) — его финансы.
export function useCreateFinance(): UseMutationResult<
  CreateFinanceResponse,
  ApiError,
  CreateFinanceRequest
> {
  const qc = useQueryClient();
  return useMutation<CreateFinanceResponse, ApiError, CreateFinanceRequest>({
    mutationFn: (body) =>
      apiFetch<CreateFinanceResponse>('/api/finance', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['team-balance'] });
      qc.invalidateQueries({ queryKey: ['finance-list'] });
      qc.invalidateQueries({ queryKey: ['players-balance'] });
      if (vars.user_id) invalidatePlayer(qc, vars.user_id);
    },
  });
}
