'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { EventDetailDto, PaymentClaimResponse } from '@/types/api';

type Ctx = { previous: EventDetailDto | undefined };

export function usePaymentClaim(
  eventId: string,
  userId: string | undefined,
): UseMutationResult<PaymentClaimResponse, ApiError, void, Ctx> {
  const qc = useQueryClient();
  const key = ['event', eventId] as const;

  return useMutation<PaymentClaimResponse, ApiError, void, Ctx>({
    mutationFn: () =>
      apiFetch<PaymentClaimResponse>(`/api/events/${eventId}/payment-claim`, {
        method: 'POST',
      }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<EventDetailDto>(key);
      if (previous && userId) {
        qc.setQueryData<EventDetailDto>(key, {
          ...previous,
          attendees: previous.attendees.map((a) =>
            a.user_id === userId ? { ...a, payment_claim: true } : a,
          ),
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}
