# SportyHockey — Architecture

Обновлено: 2026-09-17. Главный источник правды по состоянию проекта — [ROADMAP.md](ROADMAP.md); здесь только каркас.

## Стек

- **Next.js 16** (App Router) + **React 19** + TypeScript strict — фронт и API в одном проекте на Vercel.
- **Supabase Postgres 17** — данные. **Supabase Storage** (public-бакет `team-media`) — фото, аватары, логотипы, картинки разделов.
- **TanStack Query v5** — серверный стейт. **Zustand** — UI-стейт (активная команда). **recharts** — графики финансов.
- **grammy** — Telegram-бот, webhook в `/api/bot`: `/start`, `/events`, inline-голосование, привязка канала команды. Один бот на все команды; анонсы событий публикуются в канал команды (`teams.announce_chat_id`), подробности — [features/notifications.md](features/notifications.md).
- **Auth:** Telegram `initData` + HMAC на каждом запросе. Без JWT, cookies, сессий.

## Поток авторизации

1. Mini App открывается → TG SDK даёт `initData`.
2. Каждый fetch на `/api/*` несёт `Authorization: tma <initData>` и, если выбрана команда, `x-team-id`.
3. `requireUser(req)` валидирует HMAC через `BOT_TOKEN` (порог свежести `auth_date` — 7 дней), создаёт/обновляет строку в `users`, возвращает `user`. Новый пользователь получает `onboarded = false` → layout табов уводит его на `/onboarding`.
4. **Мультикомандность:** активная команда приходит в `x-team-id`. `resolveActiveTeamId` проверяет членство (fallback — первая команда пользователя), `requireOrganizer` — роль `organizer` именно в этой команде. API дополнительно сверяет `team_id` сущности с командой из контекста.

## Структура проекта

```
src/
├── app/
│   ├── (tabs)/              # 5 табов: / (Главная), /events, /money, /squad (Команда), /profile + вложенные экраны
│   ├── onboarding/          # первый вход, создание команды
│   ├── join/[token]/        # вступление по invite-ссылке
│   ├── api/                 # все endpoints
│   └── providers.tsx        # TG SDK + TanStack Query
├── components/              # UI-кит и блоки разделов (home/, finance-*/)
├── hooks/                   # query/mutation хуки — один файл на запрос
├── lib/                     # auth, bot, supabase-server, расчёты (финансы, статистика), утилиты
├── store/                   # Zustand: active-team
├── theme/                   # colors / spacing / typography / radius
├── types/                   # db.ts (сгенерён) + api.ts (DTO)
└── i18n/ru.ts               # плоский dict ключ → строка
supabase/migrations/         # SQL-миграции (зеркало истории в Supabase)
```

## API

Все роуты требуют `requireUser`; мутации организатора — `requireOrganizer`. Сгруппировано по доменам, полный список — в [src/app/api/](../src/app/api/).

| Домен | Префикс | Что делает |
| --- | --- | --- |
| Профиль | `/api/me/*` | профиль, онбординг, аватар, переключение членства, приглашения и заявки игрока |
| Команды | `/api/teams`, `/api/teams/search`, `/api/teams/me/*` | создание и поиск, состав и карточки игроков, настройки, дефолтные звенья и стороны, invite-ссылка, заявки, медиа, лого/фото, картинки разделов, статистика, архив/выход |
| Вступление | `/api/join/[token]` | превью и вступление по ссылке |
| События | `/api/events`, `/api/events/[id]/*` | CRUD, явка, оплата и claim, состав (стороны, звенья, сброс), результат (голы, удаления), медиа, share-image |
| Голосование | `/api/attendance/vote` | голос игрока (он же из бота) |
| Финансы | `/api/finance`, `/api/finance/*` | лента операций, баланс, балансы игроков, срез за период, аналитика и прогноз |
| Главная | `/api/team/*` | ближайшее событие, quick-actions, ключевая статистика |
| Площадки | `/api/venues` | только чтение — CRUD площадок в приложении нет |
| Анонсы | `/api/events/[id]/announce`, `/api/teams/me/channel` | публикация анонса в Telegram-канал; статус и отвязка канала |
| Бот | `/api/bot` | grammy webhook (защищён `X-Telegram-Bot-Api-Secret-Token`) |

Загрузка файлов везде одинаковая: `*/sign` отдаёт signed upload URL → клиент грузит напрямую в Storage → отдельный запрос сохраняет ссылку.

## Хуки

Один хук на запрос в [src/hooks/](../src/hooks/), все поверх [`api-client.ts`](../src/lib/api-client.ts). Дефолтный `staleTime` 30 с, `refetchOnWindowFocus` включён. Мутации сами инвалидируют зависимые ключи; для главной и профиля игрока — хелперы [`invalidate-home.ts`](../src/lib/invalidate-home.ts) и [`invalidate-player.ts`](../src/lib/invalidate-player.ts).

## Данные

18 таблиц в `public`:

- **Люди и команды:** `users`, `teams`, `team_memberships`, `team_invites`, `team_join_requests`, `team_default_lines`, `team_default_sides`, `team_section_images`
- **События:** `events`, `event_attendances`, `event_lineups` (сторона: light/dark или own/opponent), `event_lines` (звенья), `event_penalties`
- **Результат:** `result_points` (гол и передача — строки одной таблицы), `result_point_links` (гол ↔ передача)
- **Финансы:** `finance_transactions` — единая лента «кто → кому» (`from_kind/from_id → to_kind/to_id`). Долги, переплаты и депозиты — не записи, а вычисляемые разрезы.
- **Прочее:** `venues` (глобальный справочник, без привязки к команде), `media_items`

Важное:

- View, функций, enum'ов и триггеров в схеме нет — вся логика в [src/lib/](../src/lib/).
- Сервер живёт в UTC. Всё, что бот пишет людям текстом (дата и время события), форматируется в поясе команды — `teams.timezone`, заполняется с устройства организатора; см. [`bot-format.ts`](../src/lib/bot-format.ts).
- **RLS выключен на всех таблицах — осознанное решение.** Доступ только через server-side API с service-role. Security advisor Supabase будет показывать это как ERROR — так и задумано.
- Схема меняется только миграцией: применили в Supabase → положили тот же SQL в `supabase/migrations/<version>_<name>.sql` → перегенерили [`src/types/db.ts`](../src/types/db.ts).

## Инфраструктура

- **Supabase:** проект `wzwpnwianozcqavfqvht` (eu-central-1), организация на тарифе Pro — auto-pause не применяется.
- **Vercel:** авто-деплой `main` (production) и PR (preview). Env-переменные — в [README](../README.md).

## Принципы

1. **Один цикл планирования:** план → ревью → ok/fix → имплементация.
2. **Все данные — через `/api/*`.** Никогда не вызывать Supabase из React-компонента.
3. **Auth-гард в каждом route**: `requireUser` или `requireOrganizer`.
4. **Service-role ключ** — только в [`supabase-server.ts`](../src/lib/supabase-server.ts) (`import 'server-only'`).
5. **Стейт:** server → TanStack Query, UI → Zustand, локальный → useState.
6. **Стиль:** цвета/отступы/типографика только из `src/theme/`. Тексты — через i18n.

Запреты — в [CLAUDE.md](../CLAUDE.md).

## Где искать детали

- **Версии и итерации:** [`ROADMAP.md`](ROADMAP.md) + `roadmap/v0.X.md`
- **Эпики:** [`docs/features/`](features/)
- **Дизайн:** [`DESIGN.md`](DESIGN.md)
- **Практики работы с Claude Code:** [`BEST_PRACTICES.md`](BEST_PRACTICES.md)
