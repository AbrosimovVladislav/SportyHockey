# Эпик: Голосование и явка

## Цель
Игроки голосуют, организатор видит явку. Mini App — основной интерфейс с полным функционалом. Бот — **дополнительный упрощённый интерфейс** для тех, кто не хочет открывать Mini App: голосование инлайн-кнопками в личке, без перехода в app.

## Фичи

### v0.1
- ✅ **Голосование в Mini App (organizer, итерация 11).** Компактный блок с двумя кнопками `Я иду / Не иду` (без «может быть» — БД допускает `maybe`, но UI/API его не пишет).
- ✅ **Голосование в Mini App (player, итерация 20).** Большой `PlayerVoteBlock` на странице события: заголовок «Идёте на тренировку?/игру?» и две full-width кнопки «Я иду» (primary) / «Я не иду» (outline). Тап по активной — снимает голос.
- ✅ **Голосование в боте (итерация 20).** При создании события `notifyEventCreated` шлёт DM каждому игроку команды (`memberships.role='player'` + `users.telegram_id`) с карточкой и inline-кнопками. См. [notifications.md](notifications.md).
- ✅ **Изменение голоса (итерация 20).** Mini App и бот используют один и тот же `POST /api/attendance/vote` (zod schema `vote: 'going' | 'not_going' | null`). Бот — через callback handlers `vote:going|not_going:<event_id>`, которые работают напрямую с `event_attendances`. Повторный клик по активному варианту снимает голос.
- ✅ **Сводка явки (организатор).** На странице события: блок «Состав и явка» с тремя счётчиками `going / not_going / no answer` (скрыт для игрока). Список явки — `/events/[id]/attendees`.
- ✅ **Команда `/events` в боте (итерация 20).** Возвращает ближайшие 5 событий всех команд пользователя — отдельной карточкой на каждое, с inline-кнопками голосования.
- ✅ **Напоминание о голосовании (итерация 20).** Vercel Cron `0 15 * * *` (18:00 МСК) — `/api/cron/voting-reminder` шлёт DM игрокам без голоса для событий, начинающихся в течение 24 часов.

### v0.2+
- Дедлайн голосования (после него только организатор может менять)
- «Согласовать состав» — кнопка фиксирует список и шлёт сводку
- Авто-подтверждение явки через геолокацию (опционально)

## Связанные файлы
- `src/app/(tabs)/events/[id]/page.tsx` — VOTE-блок organizer + `PlayerVoteBlock` для игрока
- `src/app/(tabs)/events/[id]/attendees/page.tsx` — списки голосов + actions организатора
- `src/app/api/attendance/vote/route.ts` — POST голоса из Mini App
- `src/hooks/use-vote-event.ts` — мутация голоса
- `src/lib/bot.ts` — grammy callback handlers `vote:going|not_going:*`
- `src/lib/bot-event-card.ts` — карточка события с inline-кнопками
- `src/lib/notify.ts` — `notifyEventCreated`, `sendVotingReminder`
- `src/app/api/cron/voting-reminder/route.ts` — cron
