# Эпик: Состав на конкретное событие

## Цель
Оперативная работа организатора непосредственно на событии: кто пришёл, кто оплатил, как разделить команды, статы по матчу. На v0.1 разнесено на три отдельных экрана (один на функцию) — без табов.

## Фичи

### v0.1 — три экрана-секции

- **`/events/[id]/attendees` — «Состав тренировки / игры: явка и оплата» (итерация 13).**
  - Шапка `LightHeader` (back + центрированный title + subtitle с датой и площадкой).
  - Finance Card: «Взнос с игрока», «Собрано / из X», `RingProgress` с %, разделитель, три `StatChip` (Оплатили / Частично / Должники). `target = arena_cost ?? 0` (что должны арене), `collected` = сумма оплат. Ростер для счётчиков = `vote='going' OR showed_up=true OR paid_amount>0`.
  - Группы: «Записались» (`vote=going`), «Не ответили» (`vote=null`), «Не идут» (`vote=not_going`). Сортировка внутри — по имени.
  - PlayerRow: Avatar, имя, «#номер · амплуа» (если оба заданы). Справа — два `ActionTile`:
    - **«Был»** (toggle `event_attendances.showed_up`) — отдельный от голоса флаг, организатор отмечает факт прихода.
    - **«Сдал»** (3 состояния от `event_attendances.paid_amount`) — клик открывает `PaymentSheet` (поверх `BottomSheet`).
  - Action-Tile показываются во всех трёх группах (итерация 13.5) — не-going игрок, который пришёл или сдал, доступен для отметки. Только organizer может править. Player видит read-only; если у него `paid_amount` пусто/частично — ссылка «Я уже оплатил → напомнить оргу» (idempotent, 24ч локальный лок).
- **`/events/[id]/lineup` — Состав: команды Светлые / Тёмные (итерация 14).** Drag-and-drop через `@dnd-kit/core`. Две зоны бок о бок (`light` / `dark`), снизу пул с делением «Записались» / «Не записаны». Хранение в отдельной таблице `event_lineups (event_id, user_id, team_side)`. Звенья по позициям ушли в post-MVP — см. [lineup.md](lineup.md).
- **`/events/[id]/stats` — Статистика события (итерация 15).** Минимум: поля «Голы» / «Передачи» для каждого `showed_up=true`. Полноценно — v0.5 ([stats.md](stats.md)).

### Поток финансов
При клике «Сохранить» в `PaymentSheet`:
1. Upsert в `finance_transactions(type='player_payment')` — естественный ключ `(event_id, user_id, type='player_payment')` через partial UNIQUE INDEX. Поле `event_attendances.paid_amount` больше не используется (legacy).
2. `event_attendances.payment_claim = false` (сбрасываем пинг «я уже оплатил»).

Сумма «оплачено» вычисляется JOIN'ом к `finance_transactions` в `GET /api/events/[id]`. Экран финансов (итерация 16) просто аггрегирует — никаких спецправил.

### v0.2+
- Авто-баланс команд по рейтингу
- Расширенные статы (буллиты, минуты на льду)
- Подтверждение оплаты игроком через бот (одна кнопка «Оплатил» → orgу прилетает подтверждение, статус меняется автоматически)

## Связанные файлы
- `src/app/(tabs)/events/[id]/attendees/page.tsx` (итерация 13)
- `src/app/(tabs)/events/[id]/lineup/page.tsx` (итерация 14)
- `src/app/(tabs)/events/[id]/stats/page.tsx` (итерация 15)
- `src/app/api/events/[id]/payment/route.ts`, `src/app/api/events/[id]/attendance/route.ts`, `src/app/api/events/[id]/payment-claim/route.ts`, `src/app/api/events/[id]/lineup/route.ts`
- `src/hooks/use-set-payment.ts`, `src/hooks/use-set-attendance.ts`, `src/hooks/use-payment-claim.ts`, `src/hooks/use-set-lineup.ts`
- `src/components/payment-sheet.tsx`, `ring-progress.tsx`, `stat-chip.tsx`, `action-tile.tsx`, `light-header.tsx`, `lineup-chip.tsx`, `lineup-zone.tsx`
