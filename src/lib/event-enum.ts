import type { EventStatus, EventType } from '@/types/api';

export function asEventType(v: string | null): EventType {
  return v === 'game' ? 'game' : 'training';
}

export function asEventStatus(v: string | null): EventStatus {
  if (v === 'cancelled') return 'cancelled';
  if (v === 'completed') return 'completed';
  return 'scheduled';
}
