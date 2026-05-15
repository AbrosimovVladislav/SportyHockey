# Эпик: Команда и игроки

## Цель
Базовое управление командой и её составом. На PoC — минимум, дальше — расширение.

## Фичи

### v0.1
- **Profile-экран.** Карточка user (avatar, имя, @username, chip роли) + карточка команды (название). Лого не показываем — вернёмся в v0.2.
- **Список игроков `/squad`.** Все члены из `team_memberships` через `GET /api/teams/me/members`. Аватарка + имя + @username + chip роли.
- **Invite-ссылка для игроков.** Кнопка «Скопировать ссылку приглашения» на `/profile` — видна только organizer'у. Формат `https://t.me/<BOT_USERNAME>?start=team_<uuid>`. Игрок жмёт → бот обрабатывает deeplink → создаёт `team_membership(role=player)` → отвечает приветствием с inline-кнопкой «Открыть Mini App».

### v0.2
- Лого команды (загрузка в Supabase Storage)
- Редактирование профиля команды (название, лого)
- Промоут игрока до организатора (только организатор → организатор)
- Удаление игрока из команды (kick)
- Площадки команды как раздел профиля (см. [venues.md](venues.md))

### post-MVP
- Описание команды, контакты, ссылки на соцсети
- Coach-роль, тренерская часть

## Связанные файлы
- `src/app/(tabs)/profile/page.tsx`
- `src/app/(tabs)/squad/page.tsx`
- `src/app/api/me/route.ts`
- `src/app/api/teams/route.ts`
- `src/app/api/teams/me/members/route.ts`
- `src/lib/team-link.ts` — построение invite-ссылки
- `src/lib/bot.ts` — handler deeplink
