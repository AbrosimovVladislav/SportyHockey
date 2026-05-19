# Эпик: Состав на конкретное событие

## Цель
Оперативная работа организатора непосредственно на событии: кто пришёл, кто оплатил, как разделить команды, статы по матчу. На v0.1 разнесено на три отдельных экрана (один на функцию) — без табов.

## Фичи

### v0.1 — три экрана-секции

- **`/events/[id]/attendees` — «Состав тренировки / игры: явка и оплата» (итерация 13).**
  - Шапка `LightHeader` (back + центрированный title + subtitle с датой и площадкой).
  - Finance Card: «Взнос с игрока», «Собрано / из X», `RingProgress` с %, разделитель, три `StatChip` (Оплатили / Частично / Должники). Target = `going_count × cost_per_player`.
  - Группы: «Записались» (`vote=going`), «Не ответили» (`vote=null`), «Не идут» (`vote=not_going`). Сортировка внутри — по имени.
  - PlayerRow: Avatar, имя, «#номер · амплуа» (если оба заданы). Справа — два `ActionTile`:
    - **«Был»** (toggle `event_attendances.showed_up`) — отдельный от голоса флаг, организатор отмечает факт прихода.
    - **«Сдал»** (3 состояния от `event_attendances.paid_amount`) — клик открывает `PaymentSheet` (поверх `BottomSheet`).
  - Только organizer может править. Player видит read-only; если у него `paid_amount` пусто/частично — ссылка «Я уже оплатил → напомнить оргу» (idempotent, 24ч локальный лок).
- **`/events/[id]/lineup` — Деление пятёрок / команд (итерация 14).** Для `event.type='training'` — две кнопки «Светлые / Тёмные» рядом с каждым `showed_up=true`, сводка количества. Для `event.type='game'` — заглушка «Будет позже».
- **`/events/[id]/stats` — Статистика события (итерация 15).** Минимум: поля «Голы» / «Передачи» для каждого `showed_up=true`. Полноценно — v0.5 ([stats.md](stats.md)).

### Поток финансов
При клике «Сохранить» в `PaymentSheet`:
1. Upsert `event_attendances.paid_amount`.
2. Удаляем все прежние `finance_transactions(type='player_payment', event_id, user_id)` и вставляем одну новую с актуальной суммой (или ничего, если сумма = 0).

Таким образом по транзакциям всегда корректно считается баланс игрока и команды — экран финансов (итерация 16) не делает специальных правил, просто аггрегирует.

### v0.2+
- Drag-and-drop деления игроков по командам
- Авто-баланс по рейтингу
- Расширенные статы (буллиты, минуты на льду)
- Подтверждение оплаты игроком через бот (одна кнопка «Оплатил» → orgу прилетает подтверждение, статус меняется автоматически)

## Связанные файлы
- `src/app/(tabs)/events/[id]/attendees/page.tsx` (итерация 13)
- `src/app/(tabs)/events/[id]/lineup/page.tsx` (итерация 14)
- `src/app/(tabs)/events/[id]/stats/page.tsx` (итерация 15)
- `src/app/api/events/[id]/payment/route.ts`, `src/app/api/events/[id]/attendance/route.ts`, `src/app/api/events/[id]/payment-claim/route.ts`
- `src/hooks/use-set-payment.ts`, `src/hooks/use-set-attendance.ts`, `src/hooks/use-payment-claim.ts`
- `src/components/payment-sheet.tsx`, `ring-progress.tsx`, `stat-chip.tsx`, `action-tile.tsx`, `light-header.tsx`
