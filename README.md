# SportyHockey

Telegram Mini App + бот для организаторов любительских хоккейных команд. Одна Next.js-кодбаза (фронт + API в `/api/*`), Supabase для БД и Storage.

Документация: [CLAUDE.md](CLAUDE.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/ROADMAP.md](docs/ROADMAP.md).

## Стек

- Next.js 16 (App Router) + React 19 + TypeScript strict
- Supabase Postgres + Storage (доступ только через server-side API с service-role)
- grammy для Telegram-бота (webhook в `/api/bot`)
- Auth через Telegram `initData` (HMAC на сервере, без JWT/cookies)
- Zustand (UI state) + TanStack Query (server state)
- Vercel (hosting + Cron)

## Локальный запуск

Требования: Node 22+, pnpm 10+.

```bash
cp .env.example .env.local
# заполнить значения (см. блок «Env-переменные» ниже)

pnpm install
pnpm dev
# → http://localhost:3000
```

## Скрипты

| Команда | Что делает |
| --- | --- |
| `pnpm dev` | dev-сервер с hot reload |
| `pnpm build` | production-сборка |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm set-webhook <public-url>` | привязка Telegram webhook к `<public-url>/api/bot` |

## Env-переменные

Все — серверные, в `.env.local` (gitignored).

| Переменная | Назначение |
| --- | --- |
| `SUPABASE_URL` | URL проекта Supabase (`https://<ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role ключ (мимо RLS) — только в `lib/supabase-server.ts` |
| `BOT_TOKEN` | токен бота из @BotFather |
| `BOT_WEBHOOK_SECRET` | random hex (32+ байт), проверяется в `/api/bot` через заголовок `X-Telegram-Bot-Api-Secret-Token` |
| `BOT_USERNAME` | username бота без `@` (например, `sporty_hockey_bot`) — нужен для invite-ссылок `t.me/<bot>?start=team_<uuid>` |
| `MINI_APP_URL` | публичный URL Mini App (например, `https://sporty-hockey.vercel.app`) — нужен боту для inline-кнопки «Открыть Mini App» |

## Деплой

Vercel авто-деплоит `main` (production) и каждый PR (preview). Те же переменные нужно прописать в Vercel Project Settings → Environment Variables (production + preview).

После первого деплоя:

1. В @BotFather → `/myapps` → выбрать бота → Edit URL → указать `https://<your-vercel-domain>`.
2. Локально: `pnpm set-webhook https://<your-vercel-domain>` — установит webhook на `/api/bot` с secret-token.
