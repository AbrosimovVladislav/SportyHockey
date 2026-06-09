'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import { invalidateHome } from '@/lib/invalidate-home';
import { invalidatePlayer } from '@/lib/invalidate-player';
import type { EventDetailDto, SetPaymentRequest } from '@/types/api';

type Ctx = { previous: EventDetailDto | undefined };

export function useSetPayment(
  eventId: string,
): UseMutationResult<{ ok: true }, ApiError, SetPaymentRequest, Ctx> {
  const qc = useQueryClient();
  const key = ['event', eventId] as const;

  return useMutation<{ ok: true }, ApiError, SetPaymentRequest, Ctx>({
    mutationFn: (body) =>
      apiFetch<{ ok: true }>(`/api/events/${eventId}/payment`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<EventDetailDto>(key);
      if (previous) qc.setQueryData<EventDetailDto>(key, patch(previous, vars));
      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['events'] });
      invalidatePlayer(qc, vars.user_id);
      // Оплата ↔ финансовая транзакция → `team_summary.balance` на главной.
      invalidateHome(qc, { dashboardStats: true, nextEvent: false, homeActions: false });
    },
  });
}

function patch(ev: EventDetailDto, vars: SetPaymentRequest): EventDetailDto {
  const cost = ev.cost_per_player;
  const attendees = ev.attendees.map((a) =>
    a.user_id === vars.user_id
      ? { ...a, paid_amount: vars.amount, payment_claim: false }
      : a,
  );

  let paid_count = 0;
  let partial_count = 0;
  let debt_count = 0;
  let collected = 0;
  for (const a of attendees) {
    if (a.vote !== 'going') continue;
    const amount = a.paid_amount ?? 0;
    collected += amount;
    if (cost == null || cost === 0) {
      if (amount > 0) paid_count += 1;
      else debt_count += 1;
    } else if (amount >= cost) {
      paid_count += 1;
    } else if (amount > 0) {
      partial_count += 1;
    } else {
      debt_count += 1;
    }
  }

  return {
    ...ev,
    attendees,
    payments: {
      paid_count,
      partial_count,
      debt_count,
      collected,
      target: ev.payments.target,
    },
  };
}
