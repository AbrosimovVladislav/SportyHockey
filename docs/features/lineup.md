# Эпик: Состав команд / звенья

## Цель

Распределение игроков на событие. На v0.1:

- **Команды Светлые/Тёмные** — для тренировки и игры. Drag-and-drop.
- **Звенья по позициям внутри каждой команды** — только на тренировке. Динамическое число звеньев атаки и пар защиты, плюс вратарь.

Полноценные звенья со сложной ротацией и амплуа — post-MVP.

## v0.1 — Команды Светлые / Тёмные (✅ реализовано, итерация 14)

См. [roadmap/v0.1.md, итерация 14](../roadmap/v0.1.md#итерация-14--состав-команды-светлые--тёмные-drag-and-drop).

**Что есть:**

- Экран `/events/[id]/lineup`, доступ из `/events/[id]` через ListRow «Команды».
- Вкладка **«Команды»** — две droppable-зоны бок о бок (`light`/`dark`), под ними пул с делением «Записались» (`vote=going`) / «Не записаны». Применяется и для тренировки, и для игры.

**Хранение:** `event_lineups (event_id uuid, user_id uuid, team_side 'light'|'dark', updated_at, PK (event_id, user_id))`. `on delete cascade` от события и пользователя.

**API:**

- `GET /api/events/[id]` обогащает `EventAttendee` полем `team_side: 'light'|'dark'|null`.
- `POST /api/events/[id]/lineup` (organizer-only) — `{ user_id, team_side: 'light'|'dark'|null }`. `null` → DELETE + каскадно чистит `event_lines` для этого игрока в событии. При смене `team_side` — также чистит `event_lines` в его предыдущей команде.

## v0.1 — Звенья на тренировке (✅ реализовано, итерация 14.5)

См. [roadmap/v0.1.md, итерация 14.5](../roadmap/v0.1.md#итерация-145--звенья--ux-ревизия-состава).

**Что есть:**

- В тренировке у экрана `/events/[id]/lineup` три вкладки: **«Команды» / «Светлые» / «Тёмные»** (`ContentTabs`).
- Для **игры** вкладки звеньев скрыты — показана только «Команды».
- На вкладке «Светлые»/«Тёмные»:
  - **N звеньев атаки** (минимум 1, по умолчанию 1) — каждое = три слота `ЛН | Ц | ПН`.
  - **M пар защиты** (минимум 1) — каждая = `ЛЗ | ПЗ`.
  - **1 вратарь** — один слот `Вр`.
  - Снизу — `ReservesPool` с игроками этой команды, не расставленными в звенья.
- N и M — локальный `useState`. Инициализируется по максимально занятому слоту в `lines`. Кнопки `+ Добавить звено` / `+ Добавить пару защиты` под последней секцией; на последнем пустом звене/паре (если их >1) — кнопка `−` справа от заголовка. Максимум 9 звеньев и 9 пар.

**Хранение:** `event_lines (event_id uuid, team_side 'light'|'dark', slot text, user_id uuid, updated_at, PK (event_id, team_side, slot), UNIQUE (event_id, team_side, user_id))`.

- `slot` валидируется CHECK-regex `^(f[1-9]_(lw|c|rw)|d[1-9]_(ld|rd)|g)$`.
- `on delete cascade` от события и пользователя.

**Типы:** `LineSlot = \`f${1..9}_${'lw'|'c'|'rw'} | d${1..9}_${'ld'|'rd'} | 'g'`(template literal union).`EventLineEntry = { team_side, slot, user_id }`.` EventDetailDto.lines: EventLineEntry[]`.

**API:**

- `GET /api/events/[id]` — отдаёт массив `lines`.
- `POST /api/events/[id]/line` (organizer-only) — `{ user_id, team_side, slot: LineSlot | null }`.
  - `slot=null` → DELETE из `event_lines` для `(event_id, team_side, user_id)`.
  - иначе: проверяем `event_lineups` (игрок должен быть в этой команде); удаляем коллизии `OR(user_id, slot)`; вставляем новую строку.

**UI-стек:**

- `@dnd-kit/core@^6.3.1` с `collisionDetection={pointerWithin}` — drop определяется по точке пальца/курсора на grip-handle, не по площади карточки.
- `TouchSensor` (delay 350ms, tolerance 8) + `PointerSensor` (distance 8). `DragOverlay` для превью.
- `disableVerticalSwipes()` / `enableVerticalSwipes()` через хук `useTgSwipes` — чтобы тяга вниз не сворачивала миниапп.

**Компоненты:**

- `RosterCard` — универсальный «постер» с пропом `layout: 'horizontal' | 'vertical'`. Horizontal — для зон команд (одна карточка на ряд, full-width, аватар 44, имя/фамилия отдельными строками, `#номер · амплуа` снизу). Vertical — для слотов звеньев и пула резерва (компактный, аватар 36, имя/фамилия по центру). Grip-handle крупный (touch hit 32×64 в horizontal, 28×28 в vertical), `touchAction: none`.
- `LineSlot` — droppable одиночный слот звена. Подпись позиции (ЛН/Ц/ПН/ЛЗ/ПЗ/Вр) если пустой; рамка убирается при заполнении.
- `LineupZone` — droppable-контейнер зоны команды (одна колонка `RosterCard`).
- `LineupChip` (старый) — длинный горизонтальный pill, используется только в пуле «Записались/Не записаны» на вкладке «Команды».

**Хуки:** `useSetLineup` и `useSetLine` — TanStack мутации с оптимистичным апдейтом кеша `['event', id]`.

## Связанные файлы

- `src/app/(tabs)/events/[id]/lineup/page.tsx` — корень экрана, табы + DnD-обвязка
- `src/app/(tabs)/events/[id]/lineup/lines-view.tsx` — формация одной команды (звенья + резервы)
- `src/app/api/events/[id]/lineup/route.ts` — POST для команд
- `src/app/api/events/[id]/line/route.ts` — POST для звеньев
- `src/hooks/use-set-lineup.ts`, `src/hooks/use-set-line.ts`
- `src/hooks/use-tg-swipes.ts`
- `src/lib/event-lines.ts` — slot-хелперы, regex, max index
- `src/components/roster-card.tsx`, `src/components/line-slot.tsx`, `src/components/lineup-zone.tsx`, `src/components/lineup-chip.tsx`

