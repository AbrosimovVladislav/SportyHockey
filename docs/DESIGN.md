# SportyHockey — Design System v1

Источник: handoff `design_handoffs/dh_v1` (Manrope, брендовая светлая палитра, тёмный хедер, карточки расписания, состав/финансы).

> Это **брендовая светлая тема**. TG-переменные мы больше не используем — мини-апп всегда отрисовывается в собственной палитре, независимо от темы пользователя в Telegram. `Mini App header/background color` принудительно белые в `src/app/providers.tsx`.

## Принципы

1. **Спортивный, динамичный, чистый.** Сильная типографика (Manrope 700–800), плотные карточки, тонкие линии.
2. **Бренд важнее «native-feel» TG.** Мы рисуем своё, но уважаем нативный `BackButton` и тач-таргеты ≥ 44px.
3. **Информация важнее украшений.** Числа — табулярные. Списки игроков и события — без скевоморфизма.
4. **Чёткое разделение ролей.** UI организатора и игрока имеют общий язык, но разное насыщение функциями.

## Шрифт

`Manrope` через `next/font/google` (см. [src/app/layout.tsx](../src/app/layout.tsx)). Используем веса 400/500/600/700/800. Переменная — `var(--font-manrope)`, подключается в `globals.css` как `--font-family`.

Числа (время, счёт, деньги) — всегда `font-variant-numeric: tabular-nums`.

## Токены

Все токены — [src/theme/](../src/theme/). Хардкод hex/px в компонентах **запрещён**.

### Цвета — [src/theme/colors.ts](../src/theme/colors.ts)

| Группа | Токены | Использование |
|--------|--------|---------------|
| Primary | `primary` `#1A5C35`, `primaryDark` `#14472A`, `primaryLight` `#E8F5EC`, `primaryHover` `#165C2E` | CTA, активные табы v2, акценты |
| Header | `headerBg` `#233F30`, `headerAccent` `#1A6B3C`, `headerMuted`, `headerGlass` | Тёмный хедер v3, FAB, активные чипы |
| Surfaces | `bg` `#FFFFFF`, `bgWarm` `#F7F5F0`, `bgMuted` `#F5F5F5`, `cardSchedule` `#F3F4F3`, `iconBg` `#D6E4DB`, `iconFg` `#3A7A50` | Фоны экранов и карточек |
| Lines | `divider` `#E8E8E8`, `border` `#E0E0E0`, `chipBorder` `#D0D0D0`, `line` `#EBEBEB` | Разделители, бордеры |
| Text | `text` `#1C1C1E`, `textSecondary` `#6B7280`, `textTertiary` `#AEAEB2`, `textInverse` `#FFFFFF`, `tabInactive`, `navInactive` | Текст разной иерархии |
| Semantic | `success` `#34C759`, `warning` `#FF9500`, `error` `#D32F2F` (+ `*Bg` / `*Text`) | Голос «+», статусы, ошибки |
| Gold | `gold` `#C09A38`, `goldBg` `#EDE3C5`, `goldText` `#8B6914` | Турнирные элементы |
| Avatars | `avatarTones` — 6 пар градиентов | Аватар-инициалы |

### Spacing — [src/theme/spacing.ts](../src/theme/spacing.ts)

Шкала: `2 / 4 / 6 / 8 / 10 / 12 / 16 / 20 / 24 / 32 / 40 / 48` px.

Базовые отступы: страница — `20`, между карточками — `8–12`, между секциями — `24`.

### Radius — [src/theme/radius.ts](../src/theme/radius.ts)

`xs=4, sm=8, md=12, lg=16, xl=20, pill=9999`. Полный круг — `'50%'` (`RADIUS_FULL`). Bottom-sheet — `24` (`RADIUS_SHEET`).

Кнопки → `md` (или `lg` для size=lg). Карточки → `lg`. Чипы/пилюли → `xl`. Аватары/FAB → `'50%'`.

### Typography — [src/theme/typography.ts](../src/theme/typography.ts)

| Токен | Размер / вес / lh | Назначение |
|-------|-------------------|------------|
| `display` | 32 / 800 / 1.2 | Заголовок тёмного хедера |
| `h1` | 28 / 700 / 1.25 | Заголовки экранов |
| `h2` | 20 / 700 / 1.3 | Section headers |
| `h3` | 17 / 600 / 1.35 | Навбар title, время события |
| `body` | 15 / 400 / 1.47 | Основной текст |
| `bodyBold` | 15 / 600 / 1.47 | Названия событий, имена |
| `sm` / `smBold` | 13 / 400 (600) / 1.38 | Venue, подписи |
| `caption` | 12 / 500 / 1.33 | Позиция игрока |
| `label` | 13 / 600 / 1.38 | Подписи |
| `score` | 48 / 800 / 1 | Счёт матча (tabular) |
| `stat` | 24 / 700 / 1.2 | Финансовые числа (tabular) |

## Компоненты — [src/components/](../src/components/)

### Примитивы
- `Button` — `variant: primary / secondary / ghost / danger`, `size: md / lg`, `fullWidth`. Primary — `colors.primary`. Тач-таргет ≥ 44px (md) / 52px (lg).
- `Input` — `bgMuted`, `radius.md`, флаг `invalid` для ошибки.
- `Card` — `variant: surface / warm / schedule`. `surface` — с лёгкой тенью, `warm` — `bgWarm`, `schedule` — `cardSchedule`.
- `Chip` — `tone: neutral / primary / success / warning / danger / gold / dark`. Pill radius `xl`.
- `Avatar` — градиент 135° из `avatarTones` (6 пар), детерминистский индекс по имени.
- `Screen` — обёртка экрана, padding `20`, фон `bg` (можно переопределить).
- `EmptyState` — заголовок + описание + опциональный action.
- `Icons` — outline-набор (Lucide-стиль): `IconHome`, `IconCalendar`, `IconRuble`, `IconPeople`, `IconMore`, `IconMenu`, `IconBell`, `IconClock`, `IconTrophy`, `IconChevronRight`, `IconPlus`, `IconBack`, `IconCheck`, `IconClose`, `IconPerson`, `IconWallet`, `IconLocation`, `IconChat`. Stroke 1.5–2.5.

### Навигация
- `BottomNav` — 5 табов: **Команда** (`/`), **События** (`/events`), **Деньги** (`/money`), **Состав** (`/squad`), **Ещё** (`/profile`). Иконки + лейблы. Активный — `headerAccent`, неактивный — `navInactive`. `BOTTOM_NAV_HEIGHT = 64`.

### DS-блоки v3 (расписание)
- `DarkHeader` — тёмно-зелёный хедер, опциональные `left`/`right` (например, `GlassButton` и `IconBell`), `role` (подзаголовок), `title` (display 32/800).
- `GlassButton` — круглая стеклянная кнопка на тёмном фоне (`headerGlass`).
- `FAB` — `variant: dark / primary`. Position fixed bottom-78 right-18. Тень `0 4px 14px rgba(0,0,0,0.25)`.
- `ContentTabs` — два таба с подиндикатором (Список/Календарь).
- `FilterChips` — горизонтальная группа чипов (активный — тёмный).
- `SectionHeader` — заголовок секции + опциональный subtitle (дата).
- `EventCard` — карточка события (`training / game / tournament`), режимы `today` (время) и `week` (дата + день недели), счётчик явки `count/total`.

### DS-блоки v2 (состав / финансы)
- `ActionTile` — 50×50 квадратная кнопка с иконкой и лейблом (Был / Сдал и т.п.). Активная — `primary` или `warning` (частично).
- `Donut` — кольцо прогресса с процентами в центре.
- `StatChip` — иконка-круг + лейбл + значение.
- `PlayerRow` — аватар + имя + subtitle + правый action-слот; разделитель отступом 74px.

## Контентные правила

- Язык — русский, обращение — на «вы».
- Без emoji.
- Числа табулярные (12 / 16, 19:30).
- Деньги — `1 300 ₽` (пробел-разделитель тысяч).
- Даты — «24 мая, сб».
- Время — 24ч (19:30–21:00).

## Антипаттерны

- Хардкод hex / px в компонентах — только через токены.
- Свой шрифт в обход `next/font` Manrope.
- Кастомные back-кнопки — используем `useBackButton` (`backButton` SDK Telegram).
- Тач-таргеты < 44px.
- Возврат к `var(--tg-theme-*)` — мы намеренно от них отказались.

## Что появится по мере экранов

- [TODO] Bottom sheet — после первого экрана с модалкой.
- [TODO] Состояния списка: skeleton vs spinner — на v0.1 пока spinner (текст «Загружаем»).
- [TODO] Состояние «нет интернета».
- [TODO] Анимации (длительность, easing) — пока base `100ms ease` через `.pressable`.
