'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useActiveTeamStore } from '@/store/active-team';
import type {
  SectionImageKey,
  SetTeamSectionImageResponse,
  SignTeamMediaResponse,
  TeamSectionImagesResponse,
} from '@/types/api';

export class SectionImageUploadError extends Error {}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

// Картинки шапок разделов активной команды. Используются в HomeHero и в
// DarkHeader четырёх разделов (squad / events / event / money). null = дефолт
// из /public/. staleTime длинный — картинки меняются редко.
export function useTeamSectionImages(): UseQueryResult<TeamSectionImagesResponse> {
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  return useQuery<TeamSectionImagesResponse>({
    queryKey: ['team-section-images', activeTeamId],
    queryFn: () => apiFetch<TeamSectionImagesResponse>('/api/teams/me/section-images'),
    enabled: !!activeTeamId,
    staleTime: 5 * 60_000,
  });
}

// Загрузка новой картинки для раздела: signed-upload → PATCH.
export function useUploadSectionImage(): UseMutationResult<
  SetTeamSectionImageResponse,
  ApiError | SectionImageUploadError,
  { section: SectionImageKey; file: File }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ section, file }) => {
      if (!ALLOWED_MIME.has(file.type)) {
        throw new SectionImageUploadError('Можно загружать только JPG, PNG или WebP');
      }
      if (file.size > MAX_FILE_BYTES) {
        throw new SectionImageUploadError('Файл больше 5 МБ');
      }
      const sign = await apiFetch<SignTeamMediaResponse>(
        '/api/teams/me/section-images/sign',
        { method: 'POST', body: JSON.stringify({ mime: file.type, section }) },
      );
      const res = await fetch(sign.signed_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new SectionImageUploadError(
          text || `Не удалось загрузить изображение (${res.status})`,
        );
      }
      return apiFetch<SetTeamSectionImageResponse>('/api/teams/me/section-images', {
        method: 'PATCH',
        body: JSON.stringify({ section, path: sign.path }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-section-images'] });
    },
  });
}

// Сброс конкретного раздела на дефолт.
export function useResetSectionImage(): UseMutationResult<
  SetTeamSectionImageResponse,
  ApiError,
  { section: SectionImageKey }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ section }) =>
      apiFetch<SetTeamSectionImageResponse>('/api/teams/me/section-images', {
        method: 'PATCH',
        body: JSON.stringify({ section, path: null }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-section-images'] });
    },
  });
}
