'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { SetTeamLineRequest, TeamDefaultLineEntry, TeamLinesResponse } from '@/types/api';

const KEY = ['team-lines'] as const;

export function useTeamLines(): UseQueryResult<TeamLinesResponse> {
  return useQuery<TeamLinesResponse>({
    queryKey: KEY,
    queryFn: () => apiFetch<TeamLinesResponse>('/api/teams/me/lines'),
  });
}

type Ctx = { previous: TeamLinesResponse | undefined };

export function useSetTeamLine(): UseMutationResult<{ ok: true }, ApiError, SetTeamLineRequest, Ctx> {
  const qc = useQueryClient();

  return useMutation<{ ok: true }, ApiError, SetTeamLineRequest, Ctx>({
    mutationFn: (body) =>
      apiFetch<{ ok: true }>('/api/teams/me/lines', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<TeamLinesResponse>(KEY);
      if (previous) {
        const filtered = previous.lines.filter((l) => {
          if (l.user_id === vars.user_id) return false;
          if (vars.slot !== null && l.slot === vars.slot) return false;
          return true;
        });
        const nextLines: TeamDefaultLineEntry[] =
          vars.slot === null ? filtered : [...filtered, { user_id: vars.user_id, slot: vars.slot }];
        qc.setQueryData<TeamLinesResponse>(KEY, { lines: nextLines });
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
