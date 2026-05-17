# Эпик: События

## Цель
Создание, редактирование, просмотр тренировок и игр. Сердце продукта.

## Фичи

### v0.1
- ✅ **API события (итерация 7).** `GET /api/events` (список команды, без `cancelled`, со счётчиком явки + `team_size`), `POST /api/events` (organizer-only, zod), `GET /api/events/[id]` (detail + счётчик явки, 404 если user не в команде), `PATCH /api/events/[id]` (organizer-only, все поля optional + `status`).
- ✅ **Список событий — экран расписания (итерация 9).** DarkHeader («Капитан / Расписание»), белый sheet с радиусом 24px, табы «Список / Календарь», фильтры «Все / Тренировки / Игры», группировка «Сегодня / Эта неделя / Далее», карточка `EventCard` (today/week-режимы) со счётчиком `going / team_size`, FAB для organizer.
- **Создание события — `/events/new` (итерация 10).** Форма: тип, дата/время, площадка свободным текстом, стоимость на игрока, описание. По «Сохранить» → POST + бот рассылает голосование (рассылка в 11.x).
- **Страница события — детали (итерация 11).** Шапка: тип, дата/время, площадка, описание. Блок явки ([voting-attendance.md](voting-attendance.md)). Плашка перехода на страницу состава ([roster-day.md](roster-day.md)). Заглушка «Медиа».
- **Редактирование события (UI).** Только организатор. При изменении даты/времени — бот пушит обновление (в 11.x).
- **Отмена события (UI).** Soft-delete (`status = cancelled`), рассылка отмены (в 11.x).

### v0.2
- Выбор площадки из справочника (см. [venues.md](venues.md))
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
- `src/app/api/events/route.ts` — GET / POST
- `src/app/api/events/[id]/route.ts` — GET / PATCH
- `src/app/(tabs)/events/page.tsx` — экран расписания (итерация 9)
- `src/hooks/use-events.ts`, `src/lib/event-format.ts` — клиентский слой расписания
- `src/lib/event-enum.ts`, `src/lib/event-attendance.ts`, `src/lib/notify.ts`, `src/lib/user-team.ts`
- `src/lib/auth.ts` — `requireOrganizer`
