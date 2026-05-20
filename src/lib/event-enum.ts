import type { EventStatus, EventType } from '@/types/api';

export function asEventType(v: string | null): EventType {
  return v === 'game' ? 'game' : 'training';
}

export function asEventStatus(v: string | null): EventStatus {
  if (v === 'cancelled') return 'cancelled';
  if (v === 'completed') return 'completed';
  return 'scheduled';
}

// Эффективный статус: если событие не отменено и его время окончания в прошлом — считаем завершённым.
export function effectiveEventStatus(
  raw: string | null,
  endsAt: string | null,
  now: Date = new Date(),
): EventStatus {
  const status = asEventStatus(raw);
  if (status !== 'scheduled') return status;
  if (!endsAt) return status;
  const endsTs = new Date(endsAt).getTime();
  if (Number.isNaN(endsTs)) return status;
  return endsTs < now.getTime() ? 'completed' : 'scheduled';
}
