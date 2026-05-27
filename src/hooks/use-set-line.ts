'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { EventDetailDto, EventLineEntry, SetLineRequest } from '@/types/api';

type Ctx = { previous: EventDetailDto | undefined };

export function useSetLine(
  eventId: string,
): UseMutationResult<{ ok: true }, ApiError, SetLineRequest, Ctx> {
  const qc = useQueryClient();
  const key = ['event', eventId] as const;

  return useMutation<{ ok: true }, ApiError, SetLineRequest, Ctx>({
    mutationFn: (body) =>
      apiFetch<{ ok: true }>(`/api/events/${eventId}/line`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<EventDetailDto>(key);
      if (previous) {
        const sourceSlot =
          previous.lines.find((l) => l.team_side === vars.team_side && l.user_id === vars.user_id)
            ?.slot ?? null;
        const occupant =
          vars.slot !== null
            ? (previous.lines.find(
                (l) =>
                  l.team_side === vars.team_side &&
                  l.slot === vars.slot &&
                  l.user_id !== vars.user_id,
              )?.user_id ?? null)
            : null;

        const filtered = previous.lines.filter((l) => {
          if (l.team_side !== vars.team_side) return true;
          if (l.user_id === vars.user_id) return false;
          if (vars.slot !== null && l.slot === vars.slot) return false;
          return true;
        });
        const nextLines: EventLineEntry[] = [...filtered];
        if (vars.slot !== null) {
          nextLines.push({ team_side: vars.team_side, slot: vars.slot, user_id: vars.user_id });
          // Свап: вытесненный игрок встаёт на освободившийся слот перетащенного.
          if (occupant && sourceSlot) {
            nextLines.push({ team_side: vars.team_side, slot: sourceSlot, user_id: occupant });
          }
        }
        qc.setQueryData<EventDetailDto>(key, { ...previous, lines: nextLines });
      }
      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}
