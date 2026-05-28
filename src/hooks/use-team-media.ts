'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { DeleteMediaResponse, TeamMediaResponse } from '@/types/api';

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

// Удаление из общей галереи: вызываем существующий endpoint удаления медиа события
// (права и проверки уже там), инвалидируем оба ключа.
export function useDeleteTeamMedia(): UseMutationResult<
  DeleteMediaResponse,
  ApiError,
  { mediaId: string; eventId: string }
> {
  const qc = useQueryClient();
  return useMutation<DeleteMediaResponse, ApiError, { mediaId: string; eventId: string }>({
    mutationFn: ({ mediaId, eventId }) =>
      apiFetch<DeleteMediaResponse>(`/api/events/${eventId}/media/${mediaId}`, {
        method: 'DELETE',
      }),
    onSettled: (_data, _err, { eventId }) => {
      qc.invalidateQueries({ queryKey: ['team-media'] });
      qc.invalidateQueries({ queryKey: ['event-media', eventId] });
      qc.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}
