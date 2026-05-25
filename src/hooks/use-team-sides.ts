'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { SetTeamSideRequest, TeamDefaultSideEntry, TeamSidesResponse } from '@/types/api';

const KEY = ['team-sides'] as const;

export function useTeamSides(): UseQueryResult<TeamSidesResponse> {
  return useQuery<TeamSidesResponse>({
    queryKey: KEY,
    queryFn: () => apiFetch<TeamSidesResponse>('/api/teams/me/sides'),
  });
}

type Ctx = { previous: TeamSidesResponse | undefined };

export function useSetTeamSide(): UseMutationResult<{ ok: true }, ApiError, SetTeamSideRequest, Ctx> {
  const qc = useQueryClient();

  return useMutation<{ ok: true }, ApiError, SetTeamSideRequest, Ctx>({
    mutationFn: (body) =>
      apiFetch<{ ok: true }>('/api/teams/me/sides', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<TeamSidesResponse>(KEY);
      if (previous) {
        const filtered = previous.sides.filter((s) => s.user_id !== vars.user_id);
        const nextSides: TeamDefaultSideEntry[] =
          vars.team_side === null
            ? filtered
            : [...filtered, { user_id: vars.user_id, team_side: vars.team_side }];
        qc.setQueryData<TeamSidesResponse>(KEY, { sides: nextSides });
      }
      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEY, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
