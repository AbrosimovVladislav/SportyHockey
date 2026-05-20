# Эпик: Состав команд / звенья

## Цель
Распределение игроков на событие по командам. На v0.1 — упрощённая форма «Светлые / Тёмные» с drag-and-drop. Полноценные звенья (5×N, амплуа, ротация) — post-MVP.

## v0.1 — Светлые / Тёмные на событие (✅ реализовано)

См. итерация 14 в [roadmap/v0.1.md](../roadmap/v0.1.md).

**Что есть:**
- Отдельный экран `/events/[id]/lineup`, доступ из `/events/[id]` через ListRow «Команды».
- Две droppable-зоны бок о бок: «Светлые» / «Тёмные». Снизу пул игроков с делением «Записались» (`vote=going`) / «Не записаны» (всё остальное). Drag-and-drop из любой группы в любую.
- Drop в пул снимает игрока с команды.
- Применяется и для тренировки, и для игры — модель «две команды» унифицирована.

**Хранение:** отдельная таблица `event_lineups (event_id uuid, user_id uuid, team_side 'light'|'dark', updated_at, PK (event_id, user_id))`. Отсутствие строки = игрок не распределён. `on delete cascade` от события и пользователя.

**API:**
- `GET /api/events/[id]` обогащает `EventAttendee` полем `team_side: 'light'|'dark'|null`.
- `POST /api/events/[id]/lineup` (organizer-only) — `{ user_id, team_side: 'light'|'dark'|null }`. `null` → DELETE, иначе UPSERT по `(event_id, user_id)`.

**UI-стек:**
- `@dnd-kit/core@^6.3.1` — TouchSensor (long-press 350ms, tolerance 8 — чтобы скролл не активировал drag) + PointerSensor (distance 8). `DragOverlay` для превью.
- `disableVerticalSwipes()` / `enableVerticalSwipes()` через хук `useTgSwipes` — чтобы тяга вниз не сворачивала миниапп. `mountSwipeBehavior()` в `providers.tsx`.
- Компоненты: `LineupChip` (handle-точки слева — единственный активатор drag), `LineupZone` (droppable-контейнер с подсветкой при `isOver`).

**Hooks:** `useSetLineup(eventId)` — TanStack мутация с оптимистичным апдейтом `attendees[].team_side` в кеше `['event', id]`.

## Post-MVP — полноценные звенья

См. [roadmap/post-mvp.md](../roadmap/post-mvp.md).

- Звенья по позициям (5 игроков × N звеньев) — внутри каждой команды или отдельно
- Авто-баланс по рейтингу
- История звеньев по сезону
- Печать / экспорт расстановки для тренера

## Открытые вопросы
- Деление «светлые/тёмные» + звенья: оверлей или две независимые модели?
- Источник рейтинга для авто-баланса.

## Связанные файлы
- `src/app/(tabs)/events/[id]/lineup/page.tsx`
- `src/app/api/events/[id]/lineup/route.ts`
- `src/hooks/use-set-lineup.ts`
- `src/hooks/use-tg-swipes.ts`
- `src/components/lineup-chip.tsx`, `src/components/lineup-zone.tsx`
