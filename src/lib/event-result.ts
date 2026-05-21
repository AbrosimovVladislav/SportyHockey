import type { ResultSide } from '@/types/api';

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
