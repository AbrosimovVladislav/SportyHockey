import type { QueryClient } from '@tanstack/react-query';

const PLAYER_PROFILE_KEYS = [
  'player-finance',
  'player-overview',
  'player-stats',
  'team-member',
] as const;

/**
 * Инвалидирует профильные агрегаты игрока (`/squad/[user_id]`) после мутации на событии —
 * оплаты, явки, голов, штрафов. Сами данные считаются на бэке, но React Query кэширует их
 * под ключами профиля, а мутация происходит на странице события, где эти запросы неактивны.
 * Поэтому инвалидация лишь помечает их stale (немедленных запросов нет) — рефетч случится
 * при следующем заходе в профиль.
 *
 * `userId` опционален: если затронутого игрока видно из vars мутации — точечно по нему;
 * если нет (update/delete по id очка/штрафа, где старого игрока не вычислить) — по всем
 * закэшированным профилям.
 */
export function invalidatePlayer(qc: QueryClient, userId?: string): void {
  for (const key of PLAYER_PROFILE_KEYS) {
    qc.invalidateQueries({ queryKey: userId ? [key, userId] : [key] });
  }
}
