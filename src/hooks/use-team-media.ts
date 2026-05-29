'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { UploadError } from '@/hooks/use-upload-media';
import type {
  DeleteMediaResponse,
  SignMediaResponse,
  TeamMediaResponse,
} from '@/types/api';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export type TeamMediaFilters = {
  from: string | null;
  to: string | null;
};

// Общая галерея команды с опциональным фильтром по диапазону дат события.
export function useTeamMedia(filters: TeamMediaFilters): UseQueryResult<TeamMediaResponse> {
  const { from, to } = filters;
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  const path = qs ? `/api/teams/me/media?${qs}` : '/api/teams/me/media';
  return useQuery<TeamMediaResponse>({
    queryKey: ['team-media', from, to],
    queryFn: () => apiFetch<TeamMediaResponse>(path),
  });
}

// Загрузка фото прямо в общую галерею команды, без привязки к событию.
// Sign → upload в Storage → commit. Структурно повторяет useUploadMedia, но
// signed-paths кладутся под `{team_id}/general/`, а commit пишет event_id=null.
export function useUploadTeamMedia(): UseMutationResult<
  TeamMediaResponse,
  ApiError | UploadError,
  File[]
> {
  const qc = useQueryClient();
  return useMutation<TeamMediaResponse, ApiError | UploadError, File[]>({
    mutationFn: async (files) => {
      if (files.length === 0) {
        throw new UploadError('Файлы не выбраны');
      }
      for (const f of files) {
        if (!ALLOWED_MIME.has(f.type)) {
          throw new UploadError('Можно загружать только JPG, PNG или WebP');
        }
        if (f.size > MAX_FILE_BYTES) {
          throw new UploadError('Файл больше 10 МБ');
        }
      }

      const sign = await apiFetch<SignMediaResponse>('/api/teams/me/media/sign', {
        method: 'POST',
        body: JSON.stringify({
          files: files.map((f) => ({ mime: f.type, size: f.size })),
        }),
      });

      await Promise.all(
        files.map(async (f, i) => {
          const up = sign.uploads[i];
          if (!up) throw new UploadError('Нет signed URL');
          const res = await fetch(up.signed_url, {
            method: 'PUT',
            headers: { 'Content-Type': f.type },
            body: f,
          });
          if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new UploadError(text || `Не удалось загрузить файл (${res.status})`);
          }
        }),
      );

      return apiFetch<TeamMediaResponse>('/api/teams/me/media', {
        method: 'POST',
        body: JSON.stringify({
          items: sign.uploads.map((u) => ({ path: u.path, mime: u.mime })),
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-media'] });
    },
  });
}

// Удаление из общей галереи: универсальный endpoint, работает и для медиа с
// привязкой к событию, и для общих.
export function useDeleteTeamMedia(): UseMutationResult<
  DeleteMediaResponse,
  ApiError,
  { mediaId: string; eventId?: string | null }
> {
  const qc = useQueryClient();
  return useMutation<DeleteMediaResponse, ApiError, { mediaId: string; eventId?: string | null }>({
    mutationFn: ({ mediaId }) =>
      apiFetch<DeleteMediaResponse>(`/api/teams/me/media/${mediaId}`, {
        method: 'DELETE',
      }),
    onSettled: (_data, _err, { eventId }) => {
      qc.invalidateQueries({ queryKey: ['team-media'] });
      if (eventId) {
        qc.invalidateQueries({ queryKey: ['event-media', eventId] });
        qc.invalidateQueries({ queryKey: ['event', eventId] });
      }
    },
  });
}
