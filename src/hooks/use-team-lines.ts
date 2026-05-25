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
        const sourceSlot = previous.lines.find((l) => l.user_id === vars.user_id)?.slot ?? null;
        const occupant =
          vars.slot !== null
            ? (previous.lines.find((l) => l.slot === vars.slot && l.user_id !== vars.user_id)
                ?.user_id ?? null)
            : null;

        const filtered = previous.lines.filter(
          (l) => l.user_id !== vars.user_id && (vars.slot === null || l.slot !== vars.slot),
        );
        const nextLines: TeamDefaultLineEntry[] = [...filtered];
        if (vars.slot !== null) {
          nextLines.push({ user_id: vars.user_id, slot: vars.slot });
          // Свап: вытесненный игрок встаёт на освободившийся слот перетащенного.
          if (occupant && sourceSlot) {
            nextLines.push({ user_id: occupant, slot: sourceSlot });
          }
        }
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
