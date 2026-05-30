'use client';

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type {
  SignAvatarRequest,
  SignAvatarResponse,
  UpdateMeRequest,
  UpdateMeResponse,
} from '@/types/api';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export class UploadError extends Error {}

type Vars = {
  // Поля профиля — без `avatar_path`, его подставляет хук после загрузки файла.
  body: Omit<UpdateMeRequest, 'avatar_path'>;
  // Опциональный новый аватар. Если задан — сначала sign + upload, потом PATCH.
  photo?: File | null;
};

// PATCH /api/me с интегрированной загрузкой аватара. Аналог useUpdateMember,
// но запросы идут «от имени себя» (requireUser) — игрок редактирует только свои поля.
export function useUpdateMe(): UseMutationResult<UpdateMeResponse, ApiError | UploadError, Vars> {
  const qc = useQueryClient();
  return useMutation<UpdateMeResponse, ApiError | UploadError, Vars>({
    mutationFn: async ({ body, photo }) => {
      let avatarPath: string | undefined;
      if (photo) {
        if (!ALLOWED_MIME.has(photo.type)) {
          throw new UploadError('Можно загружать только JPG, PNG или WebP');
        }
        if (photo.size > MAX_FILE_BYTES) {
          throw new UploadError('Файл больше 10 МБ');
        }
        const sign = await apiFetch<SignAvatarResponse>('/api/me/avatar/sign', {
          method: 'POST',
          body: JSON.stringify({ mime: photo.type } satisfies SignAvatarRequest),
        });
        const res = await fetch(sign.signed_url, {
          method: 'PUT',
          headers: { 'Content-Type': photo.type },
          body: photo,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new UploadError(text || `Не удалось загрузить фото (${res.status})`);
        }
        avatarPath = sign.path;
      }

      const payload: UpdateMeRequest = avatarPath
        ? { ...body, avatar_path: avatarPath }
        : body;
      return apiFetch<UpdateMeResponse>('/api/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      qc.setQueryData(['me'], data);
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['team-members'] });
      qc.invalidateQueries({ queryKey: ['team-member'] });
    },
  });
}
