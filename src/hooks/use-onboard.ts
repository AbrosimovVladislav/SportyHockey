'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { OnboardRequest, OnboardResponse } from '@/types/api';

// Завершение онбординга: подтверждение профиля (+ заявка в команду для самостоятельного игрока).
export function useOnboard(): UseMutationResult<OnboardResponse, ApiError, OnboardRequest> {
  const qc = useQueryClient();
  return useMutation<OnboardResponse, ApiError, OnboardRequest>({
    mutationFn: (body) =>
      apiFetch<OnboardResponse>('/api/me/onboard', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}
