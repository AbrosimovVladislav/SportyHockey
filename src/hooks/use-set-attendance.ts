'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { invalidateHome } from '@/lib/invalidate-home';
import { invalidatePlayer } from '@/lib/invalidate-player';
import type { EventDetailDto, SetAttendanceRequest } from '@/types/api';

type Ctx = { previous: EventDetailDto | undefined };

export function useSetAttendance(
  eventId: string,
): UseMutationResult<{ ok: true }, ApiError, SetAttendanceRequest, Ctx> {
  const qc = useQueryClient();
  const key = ['event', eventId] as const;

  return useMutation<{ ok: true }, ApiError, SetAttendanceRequest, Ctx>({
    mutationFn: (body) =>
      apiFetch<{ ok: true }>(`/api/events/${eventId}/attendance`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<EventDetailDto>(key);
      if (previous) {
        qc.setQueryData<EventDetailDto>(key, {
          ...previous,
          attendees: previous.attendees.map((a) =>
            a.user_id === vars.user_id ? { ...a, showed_up: vars.showed_up } : a,
          ),
        });
      }
      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: key });
      invalidatePlayer(qc, vars.user_id);
      // attendance_rate в списке состава тоже зависит от showed_up
      qc.invalidateQueries({ queryKey: ['team-members'] });
      // `team_summary.balance` использует charged = ∑ cost_per_player по
      // showed_up=true (см. team-finance.ts). Отметка явки сдвигает баланс.
      invalidateHome(qc, { dashboardStats: true, nextEvent: false, homeActions: false });
    },
  });
}
