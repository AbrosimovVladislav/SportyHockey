# SportyHockey — Architecture

Обновлено: 2026-05-21.

## Стек

- **Next.js 16** (App Router) + **React 19** + TypeScript strict — фронт и API в одном проекте на Vercel.
- **Supabase Postgres 17** — данные. **Supabase Storage** (bucket `team-media`) — фото.
- **TanStack Query v5** — серверный стейт. **Zustand** — UI-стейт.
- **grammy** — Telegram-бот webhook в `/api/bot`.
- **Auth:** Telegram `initData` + HMAC на каждом запросе. Без JWT, cookies, сессий.

## Поток авторизации

1. Mini App открывается → TG SDK даёт `initData`.
2. Каждый fetch на `/api/*` несёт `Authorization: tma <initData>`.
3. `requireUser(req)` валидирует HMAC через `BOT_TOKEN`, upsert'ит в `users`, возвращает `user`.
4. Мутации организатора: `requireOrganizer(req)` → возвращает `user + team_id` (первая `organizer`-membership). API дополнительно сверяет `event.team_id === ctx.team_id`.

## Структура проекта

```
src/
├── app/
│   ├── (tabs)/              # 5 Mini App страниц + nested под /events/[id]
│   ├── onboarding/          # создание команды
│   ├── api/                 # все endpoints (см. ниже)
│   └── providers.tsx        # TG SDK + TanStack Query
├── components/              # UI-кит
├── hooks/                   # query/mutation хуки
├── lib/                     # auth, bot, supabase-server, утилиты
├── theme/                   # colors / spacing / typography / radius
├── types/                   # db.ts (сгенерён) + api.ts
└── i18n/ru.ts               # плоский dict ключ → строка
supabase/migrations/         # SQL миграции
```

## Экраны → хуки

| Экран                           | Основные хуки                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `/events` расписание            | `useEvents`, `useMe`                                                          |
| `/events/new`                   | `useVenues`, `useMe` + POST `/api/events`                                     |
| `/events/[id]` детали           | `useEvent`, `useEventResult` (для игр), `useVoteEvent`                        |
| `/events/[id]/attendees`        | `useEvent`, `useSetAttendance`, `useSetPayment`, `usePaymentClaim`            |
| `/events/[id]/lineup`           | `useEvent`, `useSetLineup`, `useSetLine`                                      |
| `/events/[id]/media`            | `useEvent`, `useEventMedia`, `useUploadMedia`, `useDeleteMedia`               |
| `/events/[id]/reschedule`       | `useEvent`, `useUpdateEvent`, `useVenues`                                     |
| `/events/[id]/cancel`           | `useEvent`, `useUpdateEvent`                                                  |
| `/events/[id]/result`           | `useEvent`, `useEventResult`, `use{Add,Update,Delete}{Goal,Penalty}`          |
| `/squad`                        | `useTeamMembers`                                                              |
| `/profile`, `/onboarding`       | `useMe`                                                                       |

## API endpoints

Все требуют `requireUser`. Где organizer — отмечено **org**.

**Профиль и команды:** `GET /api/me`, `POST /api/teams`, `GET /api/teams/me/members`, `GET /api/venues`.

**События:**
- `GET /api/events` — список команды + счётчики явки
- `POST /api/events` **org** — создать
- `GET /api/events/[id]` — детали + участники + lineup + lines + оплаты + media-счётчик
- `PATCH /api/events/[id]` **org** — редактировать (статус, время, площадка, цены)
- `POST /api/events/[id]/attendance` **org** — отметить явку (showed_up)
- `POST /api/attendance/vote` — голос игрока (going/not_going/null)

**Платежи:** `POST /api/events/[id]/payment` **org**, `POST /api/events/[id]/payment-claim`.

**Состав/линии:** `POST /api/events/[id]/lineup` **org** (сторона), `POST /api/events/[id]/line` **org** (звено).

**Результат:** `GET /api/events/[id]/result`, `POST|PATCH|DELETE /api/events/[id]/goals[/goalId]` **org**, `POST|PATCH|DELETE /api/events/[id]/penalties[/penaltyId]` **org**, `GET /api/events/[id]/share-image` (OG-картинка 1200×630).

**Медиа:** `GET /api/events/[id]/media`, `POST /api/events/[id]/media/sign` (signed upload URL), `POST /api/events/[id]/media`, `DELETE /api/events/[id]/media/[mediaId]`.

**Бот:** `POST /api/bot` — grammy webhook (защищён `X-Telegram-Bot-Api-Secret-Token`).

## Хуки

**Query:** `useMe`, `useEvents`, `useEvent`, `useEventResult`, `useEventMedia`, `useTeamMembers`, `useVenues` — все обёртка над [`api-client.ts`](../src/lib/api-client.ts) с дефолтным `staleTime: 30s`. `useEvent` дополнительно делает `refetchInterval: 10s` для живой явки.

**Mutation** (POST/PATCH/DELETE + invalidate): `useVoteEvent`, `useSetAttendance`, `useSetPayment`, `usePaymentClaim`, `useSetLineup`, `useSetLine`, `useUpdateEvent`, `useUploadMedia`, `useDeleteMedia`, `use{Add,Update,Delete}{Goal,Penalty}`.

**Утилитарные:** `use-t` (i18n), `use-tg-header`, `use-tg-swipes`, `use-back-button`.

## Таблицы БД (13)

`users`, `teams`, `team_memberships`, `venues`, `events`, `event_attendances`, `event_lineups` (сторона: light/dark или own/opponent), `event_lines` (звенья + позиции), `event_goals`, `event_goal_assists`, `event_penalties`, `finance_transactions`, `media_items`.

RLS выключен на всех таблицах. Service-role доступ только через server-side API.

Точная схема и FK — в [`src/types/db.ts`](../src/types/db.ts) (сгенерён через `supabase gen types typescript --linked`).

## Принципы

1. **Один цикл планирования:** план → ревью → ok/fix → имплементация.
2. **Все данные — через `/api/*`.** Никогда не вызывать Supabase из React-компонента.
3. **Auth-гард в каждом route**: `requireUser` или `requireOrganizer`.
4. **Service-role ключ** — только в [`supabase-server.ts`](../src/lib/supabase-server.ts) (`import 'server-only'`).
5. **Стейт:** server → TanStack Query, UI → Zustand, локальный → useState.
6. **Стиль:** цвета/отступы/типографика только из `src/theme/`. Тексты — через i18n.

## Запреты

- Не пушить в `main` без явного указания.
- Не использовать `any` без `// FIXME:type` и причины.
- Не коммитить секреты.
- Не делать `git`-операции (`reset --hard`, `push --force`, удаление веток) без подтверждения.
- Не вызывать Supabase из клиентских компонентов.
- Не предлагать JWT/cookie-сессии.

## Безопасность

`requireUser` валидирует HMAC `initData` через `BOT_TOKEN`. `requireOrganizer` дополнительно проверяет роль. Service-role — только server-side. Webhook бота — секретный токен в заголовке. Storage — приватный bucket, signed/public URLs из API.

## Где искать детали

- **Эпики:** [`docs/features/`](features/)
- **Версии:** [`ROADMAP.md`](ROADMAP.md) + `roadmap/v0.X.md`
- **Дизайн:** [`DESIGN.md`](DESIGN.md)
- **Практики работы с Claude Code:** [`BEST_PRACTICES.md`](BEST_PRACTICES.md)
