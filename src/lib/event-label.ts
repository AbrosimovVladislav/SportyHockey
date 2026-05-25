import { asEventType } from '@/lib/event-enum';

// Ярлык события для списков/истории: своё название, иначе «Игра vs Соперник» / «Игра» / «Тренировка».
export function eventLabel(e: {
  type: string;
  title: string | null;
  opponent_name: string | null;
}): string {
  const title = e.title?.trim();
  if (title) return title;
  if (asEventType(e.type) === 'game') {
    const opp = e.opponent_name?.trim();
    return opp ? `Игра vs ${opp}` : 'Игра';
  }
  return 'Тренировка';
}
