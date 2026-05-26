'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type {
  CreateMemberRequest,
  CreateMemberResponse,
  SignAvatarResponse,
  UpdateMemberResponse,
} from '@/types/api';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export class UploadError extends Error {}

type Vars = { body: CreateMemberRequest; photo?: File | null };

// Создаёт игрока, затем (если есть фото) грузит аватар вторым шагом:
// signed-upload требует уже созданного user_id.
export function useCreateMember(): UseMutationResult<CreateMemberResponse, ApiError | UploadError, Vars> {
  const qc = useQueryClient();
  return useMutation<CreateMemberResponse, ApiError | UploadError, Vars>({
    mutationFn: async ({ body, photo }) => {
      const created = await apiFetch<CreateMemberResponse>('/api/teams/me/members', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (photo) {
        if (!ALLOWED_MIME.has(photo.type)) {
          throw new UploadError('Можно загружать только JPG, PNG или WebP');
        }
        if (photo.size > MAX_FILE_BYTES) {
          throw new UploadError('Файл больше 10 МБ');
        }
        const sign = await apiFetch<SignAvatarResponse>(
          `/api/teams/me/members/${created.user_id}/avatar/sign`,
          { method: 'POST', body: JSON.stringify({ mime: photo.type }) },
        );
        const res = await fetch(sign.signed_url, {
          method: 'PUT',
          headers: { 'Content-Type': photo.type },
          body: photo,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new UploadError(text || `Не удалось загрузить фото (${res.status})`);
        }
        await apiFetch<UpdateMemberResponse>(`/api/teams/me/members/${created.user_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ avatar_path: sign.path }),
        });
      }

      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}
