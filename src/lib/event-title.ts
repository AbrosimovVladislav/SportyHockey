import type { EventType } from '@/types/api';

// Название события не вводится руками, а формируется и хранится в events.title
// (см. roadmap 33.2): тренировка → «Тренировка»; игра → «{команда} vs {соперник}».
// «детали» из формы хранятся отдельно в events.details и в названии не участвуют.
const TRAINING_TITLE = 'Тренировка';

export function buildEventTitle(
  type: EventType,
  teamName: string,
  opponentName: string | null | undefined,
): string {
  if (type === 'game') {
    const opp = (opponentName ?? '').trim();
    return opp ? `${teamName} vs ${opp}` : teamName;
  }
  return TRAINING_TITLE;
}
