import type { ResultSide, TeamSide } from '@/types/api';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

export function asResultSide(value: string | null | undefined): ResultSide | null {
  if (value === 'own' || value === 'opponent' || value === 'light' || value === 'dark') {
    return value;
  }
  return null;
}

export function sidesForEventType(isGame: boolean): { side_a: ResultSide; side_b: ResultSide } {
  return isGame
    ? { side_a: 'own', side_b: 'opponent' }
    : { side_a: 'light', side_b: 'dark' };
}

export function isValidSideForEvent(side: ResultSide, isGame: boolean): boolean {
  return isGame ? side === 'own' || side === 'opponent' : side === 'light' || side === 'dark';
}

// Голы/передачи учитываем для своей команды:
// - тренировка: оба side ('light', 'dark') — наши игроки;
// - игра: только 'own'.
export function isOwnSideForStats(side: ResultSide, isGame: boolean): boolean {
  return isGame ? side === 'own' : side === 'light' || side === 'dark';
}

// Загружает состав на событие (event_lineups) → user_id -> team_side.
export async function loadLineupMap(
  sb: SupabaseClient<Database>,
  eventId: string,
): Promise<Map<string, TeamSide>> {
  const { data } = await sb
    .from('event_lineups')
    .select('user_id, team_side')
    .eq('event_id', eventId);
  const map = new Map<string, TeamSide>();
  for (const r of data ?? []) {
    if (r.team_side === 'light' || r.team_side === 'dark') {
      map.set(r.user_id, r.team_side);
    }
  }
  return map;
}

// Проверка: можно ли использовать игрока для записи на указанной стороне.
// Тренировка: игрок должен быть в составе именно этой стороны.
// Игра (side='own'): игрок должен быть в составе (любая lineup-сторона).
// Сторона 'opponent' игроков не допускает — обработка на клиенте, тут не вызывается.
export function isPlayerEligibleForSide(
  userId: string,
  side: ResultSide,
  isGame: boolean,
  lineup: Map<string, TeamSide>,
): boolean {
  const placed = lineup.get(userId);
  if (!placed) return false;
  if (isGame) return side === 'own';
  return placed === side;
}
