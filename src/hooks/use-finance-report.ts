'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useActiveTeamStore } from '@/store/active-team';
import type { FinanceReportResponse } from '@/types/api';

// Хук для экрана `/money/report`. Один запрос покрывает все блоки:
// баланс, timeseries, движение денег, события и последние операции.
// Период — фиксированный месяц [from, to] в YYYY-MM-DD.
//
// Ключ зависит от activeTeamId и периода. Инвалидация по prefix `finance-report`
// прописана в мутациях финансов (use-create-finance / -update / -delete) —
// при правке транзакций срез пересчитается.
export function useFinanceReport(
  period: { from: string; to: string } | null,
  enabled = true,
): UseQueryResult<FinanceReportResponse> {
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  return useQuery<FinanceReportResponse>({
    queryKey: ['finance-report', activeTeamId, period?.from, period?.to],
    queryFn: () => {
      if (!period) throw new Error('Период не задан');
      const qs = new URLSearchParams({ from: period.from, to: period.to });
      return apiFetch<FinanceReportResponse>(`/api/finance/report?${qs.toString()}`);
    },
    enabled: enabled && !!activeTeamId && !!period,
  });
}
