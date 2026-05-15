# SportyHockey — Architecture

## Стек


| Слой               | Технология                                | Назначение                                                          |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------------- |
| Frontend + Backend | Next.js (App Router, latest) + React + TS | Mini App страницы + API routes в одном проекте                      |
| TMA SDK            | `@telegram-apps/sdk-react`                | `initData`, theme, кнопки `BackButton` / `MainButton`               |
| UI state           | Zustand                                   | Локальный UI-стейт                                                  |
| Server state       | TanStack Query                            | Кеш fetch к `/api/*`, инвалидация                                   |
| DB                 | Supabase Postgres                         | Реляционные сущности, миграции                                      |
| Storage            | Supabase Storage                          | Медиа (фото/видео)                                                  |
| Bot                | grammy в `/api/bot/route.ts`              | Webhook от Telegram: команды, callback-кнопки голосования, пуши     |
| Auth               | Telegram `initData` (HMAC на сервере)     | Каждый `/api/*` запрос несёт `initData`; никаких JWT/cookies/сессий |
| Hosting            | Vercel (временно)                         | Next.js + Vercel Cron                                               |


## Что такое бот в нашем контексте

Это тот же `@sporty_hockey_bot`, к которому привязан Mini App в @BotFather. Он делает три вещи:

1. Принимает сообщения (`/start`, `/events`).
2. Принимает нажатия inline-кнопок (callback queries) — голоса.
3. Шлёт сообщения пользователям через Telegram Bot API.

Технически: Telegram POST'ит апдейты на `/api/bot`. Мы парсим и отвечаем. **grammy** — лёгкая библиотека (5 КБ), помогает с типами, роутингом команд и сборкой inline-клавиатур. Альтернатива — голый Bot API через fetch, но возни больше.

## Обновление данных

Свежесть там, где важна (страница события с явкой) — TanStack Query `refetchInterval: 10000`: каждые 10 секунд фоновое обновление, пока страница открыта. Остальное — обычный fetch при заходе на экран и инвалидация после мутаций.

## Поток авторизации (короче нельзя)

1. Mini App открывается → TG SDK даёт `window.Telegram.WebApp.initData` (подписан серверами Telegram).
2. Фронт прикладывает `Authorization: tma <initData>` к каждому fetch'у на `/api/`*.
3. Сервер в `requireUser()` валидирует HMAC через `BOT_TOKEN`, парсит `user`, upsert'ит в `users`, возвращает `user_id`.

Всё. `initData` — это и есть сессия.

## Структура проекта

```
SportyHockey/
├── src/
│   ├── app/
│   │   ├── (tabs)/                       # 5 Mini App страниц под общим layout с TabBar
│   │   │   ├── layout.tsx                # TabBar + контейнер
│   │   │   ├── page.tsx                  # /  главная
│   │   │   ├── events/page.tsx
│   │   │   ├── events/[id]/page.tsx
│   │   │   ├── events/[id]/roster/page.tsx
│   │   │   ├── money/page.tsx
│   │   │   ├── squad/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── onboarding/page.tsx           # без TabBar
│   │   ├── api/
│   │   │   ├── bot/route.ts              # Telegram webhook (grammy)
│   │   │   ├── me/route.ts               # GET — user + memberships + invite_link
│   │   │   ├── teams/route.ts            # POST — создать команду + organizer-membership
│   │   │   ├── teams/me/members/route.ts # GET — список членов команды текущего user
│   │   │   ├── events/route.ts
│   │   │   ├── events/[id]/route.ts
│   │   │   ├── attendance/route.ts
│   │   │   ├── finance/route.ts
│   │   │   └── media/route.ts
│   │   ├── layout.tsx                    # root + lang=ru + viewport
│   │   ├── providers.tsx                 # TG SDK init + TanStack Query Provider
│   │   └── globals.css
│   ├── components/                       # UI-кит (Button, Input, Card, Screen, Chip, Avatar, EmptyState, TabBar)
│   ├── features/                         # Фичевые композиции
│   ├── hooks/                            # use-t.ts и далее
│   ├── lib/
│   │   ├── supabase-server.ts            # service-role клиент (server-only)
│   │   ├── telegram-verify.ts            # HMAC validate initData
│   │   ├── auth.ts                       # requireUser(request) → AuthedUser
│   │   ├── bot.ts                        # ленивый grammy Bot + handlers (deeplink /start team_<uuid>)
│   │   ├── team-link.ts                  # buildInviteLink(teamId) → t.me/<bot>?start=team_<uuid>
│   │   └── api-client.ts                 # типизированный fetch с Authorization header
│   ├── store/                            # Zustand-сторы
│   ├── theme/                            # colors / spacing / typography / radius
│   ├── types/                            # db.ts (сгенерённые) + локальные типы
│   └── i18n/                             # ru.ts (плоский dict)
├── public/
├── scripts/
│   └── set-webhook.mjs                   # pnpm set-webhook <url>
├── supabase/
│   └── migrations/
├── docs/
├── .claude/
├── _archive/
├── next.config.ts
├── package.json
├── tsconfig.json
└── AGENTS.md                             # Next.js 16 warning для AI-агентов
```

## Принципы

1. Один цикл планирования: план → ревью → ok/fix → имплементация. Не итерируем многократно.
2. Все данные — через `/api/*`. Никогда не вызывать Supabase из React-компонента.
3. Каждый `/api/*` route начинается с `requireUser(request)` — валидирует `initData`, возвращает `user_id`.
4. Service-role ключ — только в `lib/supabase-server.ts`, server-only.
5. Типы из БД генерим: `supabase gen types typescript --linked > src/types/db.ts`. Тела API — runtime-валидация через `zod`.

## Модель данных (v0.1)

```sql
-- Users (1:1 с Telegram-юзером)
create table users (
  id           uuid primary key default gen_random_uuid(),
  telegram_id  bigint unique not null,
  username     text,
  first_name   text,
  last_name    text,
  photo_url    text,
  created_at   timestamptz default now()
);

create table teams (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  logo_url     text,
  created_at   timestamptz default now()
);

create table team_memberships (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references teams(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  role         text not null check (role in ('organizer', 'player')),
  joined_at    timestamptz default now(),
  unique (team_id, user_id)
);

create table venues (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references teams(id) on delete cascade,
  name         text not null,
  address      text,
  notes        text,
  created_at   timestamptz default now()
);

create table events (
  id               uuid primary key default gen_random_uuid(),
  team_id          uuid not null references teams(id) on delete cascade,
  type             text not null check (type in ('training', 'game')),
  title            text,
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  venue_id         uuid references venues(id) on delete set null,
  venue_text       text,
  description      text,
  visibility       text default 'private' check (visibility in ('private','public')),
  cost_per_player  numeric(10,2),
  status           text default 'scheduled' check (status in ('scheduled','cancelled','completed')),
  created_by       uuid references users(id),
  created_at       timestamptz default now()
);
create index on events (team_id, starts_at);

create table event_attendances (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  vote         text check (vote in ('going','maybe','not_going')),
  showed_up    boolean,
  team_color   text check (team_color in ('white','dark')),
  paid_amount  numeric(10,2) default 0,
  goals        integer default 0,
  assists      integer default 0,
  notes        text,
  voted_at     timestamptz,
  unique (event_id, user_id)
);

create table finance_transactions (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references teams(id) on delete cascade,
  user_id      uuid references users(id) on delete cascade,
  event_id     uuid references events(id) on delete set null,
  type         text not null check (type in ('income','expense','player_payment','player_debt')),
  amount       numeric(10,2) not null,
  description  text,
  created_by   uuid references users(id),
  created_at   timestamptz default now()
);
create index on finance_transactions (team_id, created_at desc);

create table media_items (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references teams(id) on delete cascade,
  event_id     uuid references events(id) on delete set null,
  uploaded_by  uuid references users(id),
  storage_path text not null,
  type         text check (type in ('photo','video')),
  width        integer,
  height       integer,
  created_at   timestamptz default now()
);
```

**Не покрыто на v0.1:** lineups (звенья), leagues, social_posts. player_stats — производная, считается из `event_attendances`, отдельная таблица не нужна.

## Безопасность

`requireUser()` на каждом API route валидирует `initData` через HMAC. Service-role ключ — только server-side. Webhook бота защищён заголовком `X-Telegram-Bot-Api-Secret-Token`. Storage отдаётся через signed URLs из API.

## RLS

На PoC выключен на всех таблицах. Весь доступ — через server-side API с service-role. Включим выборочно, если/когда появится прямой доступ к Supabase с клиента.

## Где искать детали

- Эпики: `docs/features/`
- Версии: `docs/ROADMAP.md` + `docs/roadmap/v0.X.md`
- Дизайн: `docs/DESIGN.md`

