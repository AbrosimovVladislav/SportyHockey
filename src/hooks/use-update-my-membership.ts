'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type {
  UpdateMyMembershipRequest,
  UpdateMyMembershipResponse,
} from '@/types/api';

// PATCH /api/me/membership — игрок редактирует свои командные поля в
// активной команде (v0.4, итерация 44).
export function useUpdateMyMembership(): UseMutationResult<
  UpdateMyMembershipResponse,
  ApiError,
  UpdateMyMembershipRequest
> {
  const qc = useQueryClient();
  return useMutation<UpdateMyMembershipResponse, ApiError, UpdateMyMembershipRequest>({
    mutationFn: (body) =>
      apiFetch<UpdateMyMembershipResponse>('/api/me/membership', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['team-members'] });
      qc.invalidateQueries({ queryKey: ['team-member'] });
    },
  });
}
