'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { invalidateHome } from '@/lib/invalidate-home';
import type {
  AttendanceCount,
  EventDetailDto,
  EventVote,
  VoteRequest,
  VoteResponse,
} from '@/types/api';

type Ctx = { previous: EventDetailDto | undefined };

export function useVoteEvent(
  eventId: string,
  userId: string | undefined,
): UseMutationResult<VoteResponse, ApiError, VoteRequest['vote'], Ctx> {
  const qc = useQueryClient();
  const key = ['event', eventId] as const;

  return useMutation<VoteResponse, ApiError, VoteRequest['vote'], Ctx>({
    mutationFn: (vote) =>
      apiFetch<VoteResponse>('/api/attendance/vote', {
        method: 'POST',
        body: JSON.stringify({ event_id: eventId, vote }),
      }),
    onMutate: async (nextVote) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<EventDetailDto>(key);
      if (previous && userId) {
        qc.setQueryData<EventDetailDto>(key, patch(previous, userId, nextVote));
      }
      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['events'] });
      // Главная показывает `N из M идут` — обновляем после голоса.
      // home-actions / dashboard-stats голос не двигает, экономим запросы.
      invalidateHome(qc, { nextEvent: true, homeActions: false, dashboardStats: false });
    },
  });
}

function patch(
  ev: EventDetailDto,
  userId: string,
  nextVote: VoteRequest['vote'],
): EventDetailDto {
  const prevVote: EventVote | null =
    ev.attendees.find((a) => a.user_id === userId)?.vote ?? null;

  const attendees = ev.attendees.map((a) =>
    a.user_id === userId ? { ...a, vote: nextVote } : a,
  );

  const attendance: AttendanceCount = {
    going: ev.attendance.going + delta(prevVote, nextVote, 'going'),
    not_going: ev.attendance.not_going + delta(prevVote, nextVote, 'not_going'),
  };

  return { ...ev, attendees, attendance };
}

function delta(prev: EventVote | null, next: EventVote | null, target: EventVote): number {
  return (next === target ? 1 : 0) - (prev === target ? 1 : 0);
}
