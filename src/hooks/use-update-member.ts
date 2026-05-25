'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { invalidatePlayer } from '@/lib/invalidate-player';
import type {
  SignAvatarResponse,
  UpdateMemberRequest,
  UpdateMemberResponse,
} from '@/types/api';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export class UploadError extends Error {}

type Vars = { body: UpdateMemberRequest; photo?: File | null };

export function useUpdateMember(
  userId: string,
): UseMutationResult<UpdateMemberResponse, ApiError | UploadError, Vars> {
  const qc = useQueryClient();
  return useMutation<UpdateMemberResponse, ApiError | UploadError, Vars>({
    mutationFn: async ({ body, photo }) => {
      let avatarPath: string | undefined;
      if (photo) {
        if (!ALLOWED_MIME.has(photo.type)) {
          throw new UploadError('Можно загружать только JPG, PNG или WebP');
        }
        if (photo.size > MAX_FILE_BYTES) {
          throw new UploadError('Файл больше 10 МБ');
        }
        const sign = await apiFetch<SignAvatarResponse>(
          `/api/teams/me/members/${userId}/avatar/sign`,
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
        avatarPath = sign.path;
      }

      return apiFetch<UpdateMemberResponse>(`/api/teams/me/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(avatarPath ? { ...body, avatar_path: avatarPath } : body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-member', userId] });
      qc.invalidateQueries({ queryKey: ['team-members'] });
      invalidatePlayer(qc, userId);
    },
  });
}
