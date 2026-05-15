# Эпик: Онбординг

## Цель
Привести пользователя из бота в Mini App, понять роль, собрать минимум данных. На PoC — один welcome-экран + branch по роли.

## Фичи

### v0.1
- **Welcome-экран `/onboarding`.** Один экран. Выбор роли (organizer / player) кнопками.
- **Organizer flow.** Поле «Название команды» (2–50 символов). По «Создать команду» — `POST /api/teams` создаёт запись в `teams` + `team_memberships(role=organizer)`. После успеха — редирект на `/`.
- **Player flow без ссылки.** Empty state «Попроси организатора прислать ссылку приглашения в Telegram». Кнопка «Назад».
- **Player flow со ссылкой (через бота).** Игрок жмёт `https://t.me/<bot>?start=team_<uuid>` — бот обрабатывает deeplink, upsert'ит user, создаёт `team_memberships(role=player)`, отвечает «Ты в команде Х» + inline-кнопкой «Открыть Mini App». При открытии Mini App `GET /api/me` уже видит membership → gate пропускает на `/`.
- **Gate.** В `(tabs)/layout.tsx` — если у user нет memberships, `router.replace('/onboarding')`. В `/onboarding` — обратное правило: при появлении membership `replace('/')`.
- **Имя пользователя.** Берём из Telegram `initData.user.first_name` (через `requireUser` → upsert в `users`), не спрашиваем.

## Не входит в v0.1
- Загрузка лого команды (вернёмся к этому в v0.2 вместе с дизайн-системой)
- Self-join игрока без ссылки (выбор команды из списка)
- Multi-step онбординг (город, амплуа, номер)
- Coach-роль

## Связанные файлы
- `src/app/onboarding/page.tsx`
- `src/app/(tabs)/layout.tsx` — gate
- `src/app/api/me/route.ts`
- `src/app/api/teams/route.ts`
- `src/lib/bot.ts` — handler deeplink `/start team_<uuid>`
- `src/hooks/use-me.ts`
