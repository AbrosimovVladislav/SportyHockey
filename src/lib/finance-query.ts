import 'server-only';

// v0.5, итерация 60. Хелперы для трансляции legacy-фильтров API (type/
// category/user_id) в полиморфные критерии БД (kind/from_kind/to_kind/
// from_id/to_id). Используются в `/api/finance` GET и других читалках, где
// клиент шлёт фильтр в старом формате.

// PostgREST builder — обобщённый, не привязан к одной таблице. Подходит
// и для `.from('finance_transactions').select(...)`, и для `.update(...).select()`.
// FIXME:type — postgrest-js не экспортирует подходящий generic'и для цепочек
// фильтров, опишем как `any`-подобный объект, но возвращаем тот же тип.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterBuilder = any;

// Маппинг legacy type → набор условий на from_kind/to_kind/kind.
//   'player_payment' → user → team       (transfer)
//   'refund'         → team → user       (transfer)
//   'expense'        → team → venue|external (transfer; category дораздробляет)
//   'adjustment'     → kind='adjustment' (одна сторона)
//
// `category` уточняет expense:
//   'arena'                                → to_kind='venue'
//   'inventory' | 'uniform' | 'other'      → to_kind='external' AND external_kind=<cat>
export function applyLegacyTypeFilter(
  q: FilterBuilder,
  type: string | null,
  category: string | null,
): FilterBuilder {
  if (type === 'player_payment') {
    return q.eq('from_kind', 'user').eq('to_kind', 'team');
  }
  if (type === 'refund') {
    return q.eq('from_kind', 'team').eq('to_kind', 'user');
  }
  if (type === 'adjustment') {
    return q.eq('kind', 'adjustment');
  }
  if (type === 'expense') {
    let chain = q.eq('kind', 'transfer').eq('from_kind', 'team');
    if (category === 'arena') {
      chain = chain.eq('to_kind', 'venue');
    } else if (category === 'inventory' || category === 'uniform' || category === 'other') {
      chain = chain.eq('to_kind', 'external').eq('external_kind', category);
    } else {
      // type=expense без категории — это либо arena, либо external. Используем `in`.
      chain = chain.in('to_kind', ['venue', 'external']);
    }
    return chain;
  }
  // type не задан — фильтр только по category.
  if (category === 'arena') {
    return q.eq('to_kind', 'venue');
  }
  if (category === 'inventory' || category === 'uniform' || category === 'other') {
    return q.eq('to_kind', 'external').eq('external_kind', category);
  }
  return q;
}

// Legacy user_id фильтр. Раньше это был просто `eq('user_id', uid)`. Теперь
// игрок может быть либо отправителем (player_payment), либо получателем
// (refund/adjustment). Используем `or` с двумя условиями.
export function applyLegacyUserFilter(
  q: FilterBuilder,
  userId: string | null,
): FilterBuilder {
  if (!userId) return q;
  return q.or(
    `and(from_kind.eq.user,from_id.eq.${userId}),and(to_kind.eq.user,to_id.eq.${userId})`,
  );
}
