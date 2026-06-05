import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type {
  FinanceTransaction,
  FinancePartyUser,
  FinancePartyEvent,
} from '@/types/api';
import {
  ledgerToLegacyType,
  ledgerToLegacyCategory,
  ledgerToLegacyUserId,
} from '@/lib/finance-ledger';

type SB = SupabaseClient<Database>;

// v0.5, итерация 60. Маппер ledger-строки в API DTO `FinanceTransaction`.
//
// FK-JOIN на `users` через `from_id`/`to_id` невозможен (полиморфная ссылка
// без FK constraint — postgrest такого не умеет). Поэтому имена/аватары
// игроков подтягиваются batch-запросом: сначала SELECT транзакций, потом
// один SELECT users по списку уникальных user-id. Маппер собирает DTO,
// восстанавливая старые поля type/category/user из ledger через
// `ledgerToLegacy*` хелперы.
//
// Событие (`event_id`) остаётся обычным FK, его подтягиваем стандартным JOIN.

export type RawFinanceRow = {
  id: string;
  kind: string;
  from_kind: string | null;
  from_id: string | null;
  to_kind: string | null;
  to_id: string | null;
  external_kind: string | null;
  amount: number;
  description: string | null;
  occurred_on: string;
  created_at: string | null;
  event: RawEvent | RawEvent[] | null;
};

type RawUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  photo_url: string | null;
};

type RawEvent = {
  id: string;
  title: string | null;
  type: string;
  opponent_name: string | null;
  starts_at: string;
};

// SELECT для ленты транзакций. user JOIN не делаем — подтягиваем batch'ем
// в `mapFinanceTransactionsBatch`. Событие пристёгивается обычным FK-JOIN.
export const FINANCE_SELECT =
  'id, kind, from_kind, from_id, to_kind, to_id, external_kind, amount, ' +
  'description, occurred_on, created_at, ' +
  'event:events!event_id(id, title, type, opponent_name, starts_at)';

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

// Маппер одной строки. Принимает резолвер user — функцию, которая возвращает
// `FinancePartyUser | null` по user-id. Резолвер обычно строится из batch-
// запроса (см. `mapFinanceTransactionsBatch`).
export function mapFinanceTransaction(
  row: RawFinanceRow,
  resolveUser: (userId: string) => FinancePartyUser | null,
): FinanceTransaction {
  const e = pickOne(row.event);
  const event: FinancePartyEvent | null = e
    ? {
        id: e.id,
        title: e.title,
        type: e.type,
        opponent_name: e.opponent_name,
        starts_at: e.starts_at,
      }
    : null;

  const legacyUserId = ledgerToLegacyUserId(row);
  const user = legacyUserId ? resolveUser(legacyUserId) : null;

  return {
    id: row.id,
    type: ledgerToLegacyType(row),
    category: ledgerToLegacyCategory(row),
    amount: Number(row.amount),
    description: row.description,
    occurred_on: row.occurred_on,
    created_at: row.created_at ?? new Date().toISOString(),
    user,
    event,
  };
}

// Подтягивает users batch'ем по списку транзакций и возвращает уже собранные
// DTO. Один SELECT на всю страницу — не N+1.
export async function mapFinanceTransactionsBatch(
  sb: SB,
  rows: RawFinanceRow[],
): Promise<FinanceTransaction[]> {
  if (rows.length === 0) return [];

  const userIds = new Set<string>();
  for (const r of rows) {
    const uid = ledgerToLegacyUserId(r);
    if (uid) userIds.add(uid);
  }

  const userMap = new Map<string, FinancePartyUser>();
  if (userIds.size > 0) {
    const { data, error } = await sb
      .from('users')
      .select('id, first_name, last_name, avatar_url, photo_url')
      .in('id', Array.from(userIds));
    if (error) throw new Error(error.message);
    for (const u of (data ?? []) as RawUser[]) {
      userMap.set(u.id, {
        user_id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        avatar_url: u.avatar_url,
        photo_url: u.photo_url,
      });
    }
  }

  return rows.map((r) => mapFinanceTransaction(r, (uid) => userMap.get(uid) ?? null));
}
