import 'server-only';
import type {
  FinanceTransaction,
  FinanceTxType,
  FinanceExpenseCategory,
  FinancePartyUser,
  FinancePartyEvent,
} from '@/types/api';

// Сырые поля, которые мы выбираем в JOIN-запросе. Описаны узко (а не через
// Tables<'finance_transactions'>), чтобы маппер был устойчив к расширениям
// строки в БД и читался как контракт «что именно нужно фронту».
export type RawFinanceRow = {
  id: string;
  type: string;
  category: string | null;
  amount: number;
  description: string | null;
  occurred_on: string;
  created_at: string | null;
  user: RawUser | RawUser[] | null;
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

// Колонки для SELECT — единая строка для всех роутов раздела.
export const FINANCE_SELECT =
  'id, type, category, amount, description, occurred_on, created_at, ' +
  'user:users(id, first_name, last_name, avatar_url, photo_url), ' +
  'event:events(id, title, type, opponent_name, starts_at)';

const ALLOWED_TYPES: ReadonlySet<FinanceTxType> = new Set([
  'player_payment',
  'expense',
  'refund',
  'adjustment',
]);
const ALLOWED_CATEGORIES: ReadonlySet<FinanceExpenseCategory> = new Set([
  'arena',
  'inventory',
  'uniform',
  'other',
]);

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export function mapFinanceTransaction(row: RawFinanceRow): FinanceTransaction {
  const u = pickOne(row.user);
  const e = pickOne(row.event);

  const user: FinancePartyUser | null = u
    ? {
        user_id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        avatar_url: u.avatar_url,
        photo_url: u.photo_url,
      }
    : null;

  const event: FinancePartyEvent | null = e
    ? {
        id: e.id,
        title: e.title,
        type: e.type,
        opponent_name: e.opponent_name,
        starts_at: e.starts_at,
      }
    : null;

  return {
    id: row.id,
    type: asTxType(row.type),
    category: asExpenseCategory(row.category),
    amount: Number(row.amount),
    description: row.description,
    occurred_on: row.occurred_on,
    created_at: row.created_at ?? new Date().toISOString(),
    user,
    event,
  };
}

// На уровне БД стоит CHECK constraint, эти функции защищают фронт от мусора,
// если кто-то всё же запишет старое значение мимо нашего API.
export function asTxType(v: string | null | undefined): FinanceTxType {
  return v && ALLOWED_TYPES.has(v as FinanceTxType) ? (v as FinanceTxType) : 'player_payment';
}

export function asExpenseCategory(
  v: string | null | undefined,
): FinanceExpenseCategory | null {
  if (!v) return null;
  return ALLOWED_CATEGORIES.has(v as FinanceExpenseCategory)
    ? (v as FinanceExpenseCategory)
    : null;
}
