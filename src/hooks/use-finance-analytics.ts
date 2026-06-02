'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useActiveTeamStore } from '@/store/active-team';
import type { FinanceAnalyticsResponse } from '@/types/api';

// Хук для экрана `/money/analytics`. Один запрос покрывает все 4 графика
// и блок «Прогноз на 3 месяца». Период — произвольный диапазон [from, to]
// (YYYY-MM-DD), внутри сервер дробит на месяцы.
//
// Ключ зависит от activeTeamId + периода. Инвалидируется в мутациях
// финансов и в мутациях событий (явка, отмена) — мы добавляем prefix
// `finance-analytics` к существующим инвалидациям.
export function useFinanceAnalytics(
  period: { from: string; to: string } | null,
  enabled = true,
): UseQueryResult<FinanceAnalyticsResponse> {
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  return useQuery<FinanceAnalyticsResponse>({
    queryKey: ['finance-analytics', activeTeamId, period?.from, period?.to],
    queryFn: () => {
      if (!period) throw new Error('Период не задан');
      const qs = new URLSearchParams({ from: period.from, to: period.to });
      return apiFetch<FinanceAnalyticsResponse>(`/api/finance/analytics?${qs.toString()}`);
    },
    enabled: enabled && !!activeTeamId && !!period,
  });
}
