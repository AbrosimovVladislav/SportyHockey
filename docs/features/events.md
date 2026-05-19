# Эпик: События

## Цель
Создание, редактирование, просмотр тренировок и игр. Сердце продукта.

## Фичи

### v0.1
- ✅ **API события (итерация 7).** `GET /api/events` (список команды, без `cancelled`, со счётчиком явки + `team_size`), `POST /api/events` (organizer-only, zod), `GET /api/events/[id]` (detail + счётчик явки, 404 если user не в команде), `PATCH /api/events/[id]` (organizer-only, все поля optional + `status`).
- ✅ **Список событий — экран расписания (итерация 9).** DarkHeader («Капитан / Расписание»), белый sheet с радиусом 24px, табы «Список / Календарь», фильтры «Все / Тренировки / Игры», группировка «Сегодня / Эта неделя / Далее», карточка `EventCard` (today/week-режимы) со счётчиком `going / team_size`, FAB для organizer.
- ✅ **Создание события — `/events/new` (итерация 10).** Лёгкая белая шапка (back + заголовок), белый фон. Форма: чипы тип (тренировка/игра, с иконками), секция «Расписание» (Дата → нативный календарь, Начало → нативный time picker, Длительность → нативный time picker как таймер, шаг 5 мин), Textarea «Детали события» (сохраняется в `events.title`), арена через BottomSheet из `GET /api/venues`, редактируемое поле «Взнос с игрока» с предзаполнением из `venue.default_cost_per_player`. POST принимает `{ type, starts_at, duration_minutes, venue_id, title?, cost_per_player? }`. BottomNav скрывается при открытии клавиатуры. Бот-рассылка вынесена в 12.x.
- **Поле «Оплата арене» в форме (итерация 13.x).** Добавлено редактируемое поле «Оплата арене» перед «Взнос с игрока». Предзаполнение из `venue.cost_per_arena`. Сохраняется в `events.arena_cost`. Используется потом в финансах (expense арене).
- ✅ **Страница события — детали (итерация 11).** Hero-шапка (плейсхолдер фото) с заголовком, датой/временем (`formatEventDateRange`) и площадкой; vote-карточка (Я иду / Не иду), карточка «Состав и явка» (3 счётчика), карточка «Участники и взносы» (avatar-stack + прогресс-бар взносов), `ListRow`-секции «Команды», «Статистика события», «Площадка», «Медиа» — пока заглушки.
- **Редактирование события (UI).** Только организатор. При изменении даты/времени — бот пушит обновление (в 12.x).
- **Отмена события (UI).** Soft-delete (`status = cancelled`), рассылка отмены (в 12.x).

### v0.2
- Календарный вид (контент таба «Календарь» в `/events` — на v0.1 заглушка)
- Дубликат события («Повторить как в прошлый раз»)
- Турниры — отдельный `events.type='tournament'` + чип-фильтр на расписании

### v0.5+
- Публичные события (`visibility = public`), лендинг события
- Серии тренировок (recurring)

## Не входит на PoC
- Серии / recurring
- Календарный вид

## Связанные файлы
- `src/app/api/events/route.ts` — GET / POST (venue_id + duration_minutes)
- `src/app/api/events/[id]/route.ts` — GET / PATCH
- `src/app/api/venues/route.ts` — GET площадок команды
- `src/app/(tabs)/events/page.tsx` — экран расписания (итерация 9)
- `src/app/(tabs)/events/new/page.tsx` — форма создания (итерация 10)
- `src/app/(tabs)/events/[id]/page.tsx` — детали + голосование (итерация 11)
- `src/hooks/use-events.ts`, `src/hooks/use-event.ts`, `src/hooks/use-venues.ts`, `src/hooks/use-vote-event.ts`
- `src/lib/event-format.ts` — клиентский слой расписания + `formatLongDateLocal`, `combineDateTime`
- `src/lib/event-enum.ts`, `src/lib/event-attendance.ts`, `src/lib/notify.ts`, `src/lib/user-team.ts`
- `src/lib/auth.ts` — `requireOrganizer`
- DS-компоненты формы: `src/components/type-chips.tsx`, `src/components/card-field.tsx`, `src/components/bottom-sheet.tsx`
