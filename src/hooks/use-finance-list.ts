'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useActiveTeamStore } from '@/store/active-team';
import type { FinanceListResponse, FinanceTxType, FinanceExpenseCategory } from '@/types/api';

export type FinanceListFilters = {
  limit?: number;
  cursor?: string;
  type?: FinanceTxType;
  category?: FinanceExpenseCategory;
  user_id?: string;
  event_id?: string;
  from?: string;
  to?: string;
};

// Лента транзакций активной команды. На хабе используется без фильтров с
// limit=10. На экране «Операции» (итерация 53) — с фильтрами и пагинацией.
export function useFinanceList(
  filters: FinanceListFilters = {},
  enabled = true,
): UseQueryResult<FinanceListResponse> {
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  const params = new URLSearchParams();
  if (filters.limit != null) params.set('limit', String(filters.limit));
  if (filters.cursor) params.set('cursor', filters.cursor);
  if (filters.type) params.set('type', filters.type);
  if (filters.category) params.set('category', filters.category);
  if (filters.user_id) params.set('user_id', filters.user_id);
  if (filters.event_id) params.set('event_id', filters.event_id);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  const qs = params.toString();
  const path = `/api/finance${qs ? `?${qs}` : ''}`;

  return useQuery<FinanceListResponse>({
    queryKey: ['finance-list', activeTeamId, filters],
    queryFn: () => apiFetch<FinanceListResponse>(path),
    enabled,
  });
}
