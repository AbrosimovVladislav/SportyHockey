'use client';

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { UpdateMeRequest, UpdateMeResponse } from '@/types/api';

// Сохраняет на сервере ответ пользователя на нативный запрос Telegram
// «разрешить боту писать вам» (итерация 70) → users.bot_write_allowed.
// Кэш `me` не трогаем: это поле в профиль не входит.
export function useSaveWriteAccess(): UseMutationResult<UpdateMeResponse, ApiError, boolean> {
  return useMutation<UpdateMeResponse, ApiError, boolean>({
    mutationFn: (allowed) =>
      apiFetch<UpdateMeResponse>('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ bot_write_allowed: allowed } satisfies UpdateMeRequest),
      }),
  });
}
