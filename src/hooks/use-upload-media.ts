'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type {
  EventMediaResponse,
  SignMediaResponse,
} from '@/types/api';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export class UploadError extends Error {}

export function useUploadMedia(
  eventId: string,
): UseMutationResult<EventMediaResponse, ApiError | UploadError, File[]> {
  const qc = useQueryClient();
  return useMutation<EventMediaResponse, ApiError | UploadError, File[]>({
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

      const sign = await apiFetch<SignMediaResponse>(
        `/api/events/${eventId}/media/sign`,
        {
          method: 'POST',
          body: JSON.stringify({
            files: files.map((f) => ({ mime: f.type, size: f.size })),
          }),
        },
      );

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
            throw new UploadError(
              text || `Не удалось загрузить файл (${res.status})`,
            );
          }
        }),
      );

      return apiFetch<EventMediaResponse>(`/api/events/${eventId}/media`, {
        method: 'POST',
        body: JSON.stringify({
          items: sign.uploads.map((u) => ({ path: u.path, mime: u.mime })),
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-media', eventId] });
      qc.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}
