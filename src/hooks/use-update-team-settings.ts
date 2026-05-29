'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type {
  SignTeamMediaResponse,
  UpdateTeamSettingsRequest,
  UpdateTeamSettingsResponse,
} from '@/types/api';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export class UploadError extends Error {}

// Тип, по которому решаем, в какой sign-эндпоинт пойти. logo — квадратное
// изображение в карточке, photo — широкая шапка раздела «Команда».
export type TeamMediaKind = 'logo' | 'photo';

type Vars = {
  body: UpdateTeamSettingsRequest;
  // Загрузить файл и подставить в body соответствующий *_path. Если файла нет —
  // body уходит как есть (например, только переименование команды).
  upload?: { kind: TeamMediaKind; file: File } | null;
};

export function useUpdateTeamSettings(): UseMutationResult<
  UpdateTeamSettingsResponse,
  ApiError | UploadError,
  Vars
> {
  const qc = useQueryClient();
  return useMutation<UpdateTeamSettingsResponse, ApiError | UploadError, Vars>({
    mutationFn: async ({ body, upload }) => {
      let extra: Partial<UpdateTeamSettingsRequest> = {};
      if (upload) {
        const { kind, file } = upload;
        if (!ALLOWED_MIME.has(file.type)) {
          throw new UploadError('Можно загружать только JPG, PNG или WebP');
        }
        if (file.size > MAX_FILE_BYTES) {
          throw new UploadError('Файл больше 10 МБ');
        }
        const signUrl =
          kind === 'logo' ? '/api/teams/me/logo/sign' : '/api/teams/me/photo/sign';
        const sign = await apiFetch<SignTeamMediaResponse>(signUrl, {
          method: 'POST',
          body: JSON.stringify({ mime: file.type }),
        });
        const res = await fetch(sign.signed_url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new UploadError(text || `Не удалось загрузить изображение (${res.status})`);
        }
        extra = kind === 'logo' ? { logo_path: sign.path } : { photo_path: sign.path };
      }

      return apiFetch<UpdateTeamSettingsResponse>('/api/teams/me/settings', {
        method: 'PATCH',
        body: JSON.stringify({ ...body, ...extra }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-settings'] });
      // Хаб /squad подтягивает team.photo_url из /api/teams/me.
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
