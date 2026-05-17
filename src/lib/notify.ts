import 'server-only';

// Заглушки нотификаций. Реальная рассылка через бот — в итерации 11.x (см. roadmap v0.1).
// API создаёт/обновляет/отменяет событие — потом эти хуки превратятся в рассылку голосования.

export async function notifyEventCreated(eventId: string): Promise<void> {
  console.log('[notify] event created:', eventId);
}

export async function notifyEventUpdated(eventId: string): Promise<void> {
  console.log('[notify] event updated:', eventId);
}

export async function notifyEventCancelled(eventId: string): Promise<void> {
  console.log('[notify] event cancelled:', eventId);
}
