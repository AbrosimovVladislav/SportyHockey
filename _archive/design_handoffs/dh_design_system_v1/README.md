# Handoff: Sporty Hockey — Design System v3

## Overview
Дизайн-система для мобильного приложения Sporty Hockey — управление любительскими хоккейными командами. Содержит все дизайн-токены, компоненты и паттерны, извлечённые из двух ключевых экранов: «Состав и финансы» (v2) и «Расписание» (v3).

## About the Design Files
Файлы в этом пакете — **дизайн-референсы, созданные в HTML**. Это прототипы, показывающие финальный внешний вид и поведение. **Не копируйте HTML напрямую.** Задача — воссоздать эти дизайны в целевом окружении (React Native, SwiftUI, Flutter и т.д.) используя устоявшиеся паттерны проекта.

## Fidelity
**High-fidelity (hifi)** — пиксельно-точные макеты с финальными цветами, типографикой, отступами и интерактивностью. Воссоздавайте UI точно, используя библиотеки и паттерны вашего проекта.

---

## Design Tokens

### Colors

#### Primary
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#1A5C35` | Кнопки, активные табы v2, акценты |
| `primary-dark` | `#14472A` | Hover/pressed primary |
| `primary-light` | `#E8F5EC` | Фон success-бейджей, иконок |

#### Header (v3 — Schedule)
| Token | Value | Usage |
|-------|-------|-------|
| `header-bg` | `#233F30` | Фон тёмного хедера, FAB, активные чипы |
| `header-accent` | `#1A6B3C` | Подиндикаторы табов, счётчики участников, активный таб bottom nav |
| `header-muted` | `rgba(255,255,255,0.55)` | Приглушённый текст на тёмном фоне (роль «Капитан») |
| `header-glass` | `rgba(255,255,255,0.12)` | Стеклянные кнопки на тёмном фоне |

#### Neutrals
| Token | Value | Usage |
|-------|-------|-------|
| `white` | `#FFFFFF` | Основной фон |
| `bg-warm` | `#F7F5F0` | Фон секций (attendance, payment) |
| `bg-muted` | `#F5F5F5` | Фон иконок, pill кнопок |
| `card-schedule` | `#F3F4F3` | Фон карточек событий |
| `icon-bg` | `#D6E4DB` | Фон иконки тренировки |
| `icon-fg` | `#3A7A50` | Цвет иконки тренировки |
| `divider` | `#E8E8E8` | Разделители |
| `border` | `#E0E0E0` | Бордеры |
| `chip-border` | `#D0D0D0` | Бордер неактивного чипа |
| `line` | `#EBEBEB` | Линия под табами |

#### Text
| Token | Value | Usage |
|-------|-------|-------|
| `text-primary` | `#1C1C1E` | Основной текст |
| `text-secondary` | `#6B7280` | Вторичный текст |
| `text-tertiary` | `#AEAEB2` | Третичный текст |
| `tab-inactive` | `#8A8C8C` | Неактивные табы, venue, время |
| `nav-inactive` | `#ABABAB` | Неактивные иконки bottom nav |

#### Semantic
| Token | Value | Usage |
|-------|-------|-------|
| `success` | `#34C759` | Успех, уведомления |
| `warning` | `#FF9500` | Предупреждение |
| `error` | `#D32F2F` | Ошибка, деструктивное |
| `gold` | `#C09A38` | Турнирные иконки |
| `gold-bg` | `#EDE3C5` | Фон турнирных элементов |

### Typography

**Шрифт:** Manrope (web) / SF Pro (iOS) / system (Android)

| Style | Size | Weight | Line-height | Usage |
|-------|------|--------|-------------|-------|
| Display | 34px | 800 | 1.2 | Заголовок тёмного хедера |
| H1 | 28px | 700 | 1.25 | Заголовки hero-секций |
| H2 | 20px | 700 | 1.3 | Section headers («Сегодня») |
| H3 | 17px | 600–800 | 1.35 | Навбар title, время события |
| Body | 15px | 400–600 | 1.47 | Названия событий, имена |
| Small | 13px | 400–600 | 1.38 | Venue, подписи, табы |
| Caption | 12px | 500 | 1.33 | Позиция игрока, подписи |
| Label | 10px | 400–600 | — | Лейблы bottom nav |
| Score | 48px | 800 | 1 | Счёт матча |
| Stat | 24px | 700 | 1.2 | Финансовые числа |

**Табулярные цифры:** всегда `font-variant-numeric: tabular-nums` для времени, счётчиков, денег.

### Spacing
| Token | Value |
|-------|-------|
| `space-4` | 4px |
| `space-8` | 8px |
| `space-12` | 12px |
| `space-16` | 16px (базовый отступ страницы и карточек) |
| `space-20` | 20px |
| `space-24` | 24px (между секциями) |
| `space-32` | 32px |

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Swatches |
| `radius-md` | 12px | Иконки событий, поля ввода, action tiles |
| `radius-lg` | 16px | Карточки |
| `radius-xl` | 20px | Чипы/пилюли |
| `radius-pill` | 9999px | Полные пилюли |
| `radius-full` | 50% | Аватары, FAB |
| `radius-sheet` | 24px | Bottom sheet (top-left, top-right only) |

### Shadows
| Token | Value | Usage |
|-------|-------|-------|
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)` | Карточки |
| `shadow-fab` | `0 4px 14px rgba(0,0,0,0.25)` | FAB |
| `shadow-elevated` | `0 4px 16px rgba(0,0,0,0.08)` | Модалки |

---

## Components

### 1. Dark Header
- **Фон:** `#233F30`, полная ширина
- **Кнопка меню:** 48×48, круг, `rgba(255,255,255,0.12)`, иконка гамбургер белая (stroke 1.8)
- **Колокольчик:** outline иконка белая, зелёная точка (#34C759) 11×11 с бордером 2.5px цвета фона
- **Роль:** 14px/400, `rgba(255,255,255,0.55)`, letter-spacing 0.1
- **Заголовок:** 34px/800, белый, letter-spacing -0.3
- **Padding:** top 58 (включает status bar), bottom 28, horizontal 20

### 2. Bottom Sheet
- **Фон:** белый
- **border-radius:** 24px 24px 0 0
- **margin-top:** -12px (наезжает на хедер)
- **z-index:** выше хедера

### 3. Content Tabs (Список / Календарь)
- **Layout:** flex, 2 равных таба
- **Активный:** 16px/600, цвет text-primary, подиндикатор — полоска 3px высотой, radius 2, цвет `#1A6B3C`, ширина ~44% (left 28%, right 28%)
- **Неактивный:** 16px/400, цвет `#8A8C8C`
- **Разделитель снизу:** 1px solid `#EBEBEB`
- **Padding:** 16px top, 13px bottom

### 4. Filter Chips
- **Layout:** flex, centered, gap 8px, padding 18px 16px 4px
- **Активный:** bg `#233F30`, white text, без бордера
- **Неактивный:** bg белый, text `#1A1A1A`, border 1.5px solid `#D0D0D0`
- **Размер:** padding 8px 16px, border-radius 20px, font 15px/500

### 5. Section Header
- **Layout:** flex, space-between, align baseline
- **Заголовок:** 20px/700, text-primary
- **Subtitle:** 14px/400, `#8A8C8C` (дата: «24 мая, сб»)
- **Padding:** 22px top, 12px bottom, 20px horizontal

### 6. Event Card
- **Layout:** flex row, align center, gap 10px
- **Фон:** `#F3F4F3`, border-radius 16px, padding 16px 12px
- **Колонка времени:** min-width 40px
  - Время: 17px/600 + sub 13px/400 `#8A8C8C`
  - Неделя: дата 22px/700 + день 13px `#8A8C8C`, time внизу 14px
- **Иконка:** 44×44, border-radius 12px
  - Тренировка: bg `#D6E4DB`, icon `#3A7A50` (часы)
  - Игра: bg `#D6E4DB`, icon `#3A7A50` (кубок)
  - Турнир: bg `#EDE3C5`, icon `#C09A38` (кубок)
- **Текст:** title 15px/600, venue 13px `#8A8C8C`
- **Счётчик:** count `#1A6B3C`/700, «/» + total `#8A8C8C`/400, font 15px
- **Chevron:** 7×12, stroke `#C4C4C4`, width 1.8

### 7. Bottom Navigation
- **Layout:** flex row, 5 равных табов, border-top 1px `#EBEBEB`
- **Padding:** 8px top, 30px bottom (safe area)
- **Активный:** иконка + текст `#1A6B3C`, font-weight 600
- **Неактивный:** иконка + текст `#ABABAB`, font-weight 400
- **Иконки:** 24×24, outline, stroke-width 1.7
- **Лейблы:** 10px
- **Табы:** Команда (дом), События (календарь), Деньги (₽ в круге), Состав (люди), Ещё (три точки)

### 8. FAB
- **Размер:** 56×56, border-radius 28 (круг)
- **Фон:** `#233F30`
- **Тень:** `0 4px 14px rgba(0,0,0,0.25)`
- **Иконка:** белый «+», stroke-width 2.5
- **Позиция:** absolute, bottom 78px, right 18px

### 9. Avatar (v2)
- **Круг:** gradient 135deg, 6 цветовых пар
- **Инициалы:** белые, font-weight 700, размер 34% от size
- **Размеры:** 28 (S), 36 (M), 46 (L), 56 (XL)

### 10. Action Tiles (v2)
- **Размер:** 50×50, border-radius 12
- **Неактивный:** bg белый, border 1.5px `#E4E2DC`, иконка `#C8C7C2`
- **Активный (attendance):** bg `#1A7A3D`, иконка белая
- **Активный (payment):** bg `#1A7A3D` (полная) или `#FF9500` (частичная)
- **Лейбл:** 10px/700

### 11. Donut / Progress Ring (v2)
- **Track:** `#EFEDE7`, stroke 9
- **Fill:** `#1A7A3D`, strokeLinecap round
- **Center text:** percent, fontSize ~20% от size, weight 800, color primary

### 12. Player Row (v2)
- **Layout:** flex row, avatar + info + action tiles
- **Divider:** 1px, indent от 74px слева
- **Name:** 15px/700
- **Position:** 12px/500, tertiary color

---

## Content Rules
- **Язык:** русский
- **Тон:** деловой, дружелюбный
- **Обращение:** на «вы»
- **Emoji:** НЕ используются
- **Числа:** табулярные (12/16, 19:30)
- **Деньги:** `1 300 ₽` (пробел-разделитель тысяч)
- **Даты:** «24 мая, сб»
- **Время:** 24ч формат (19:30–21:00)

---

## Iconography
- **Стиль:** outline, stroke-width 1.5–2px
- **Размеры:** 20–24px стандарт, 28px для navigation bar
- **Рекомендуемый набор:** Lucide Icons
- **Используемые:** часы, календарь, локация, кубок, колокольчик, чат, игроки, деньги (₽), стрелка назад, три точки, плюс, галочка, крестик, меню (гамбургер), дом

---

## Files in this Package
| File | Description |
|------|-------------|
| `README.md` | Этот файл |
| `colors_and_type.css` | CSS-переменные: цвета, типографика, spacing, радиусы, тени |
| `ds-components-v2.jsx` | React-компоненты v2: Avatar, ActionTile, Donut, StatChip, TabBar, GroupHeader, NavBar, PlayerRow |
| `ds-components-v3.jsx` | React-компоненты v3: DarkHeader, ContentTabs, FilterChips, SectionHeader, EventCard, BottomNav, FAB, GlassButton |
| `Design System v3.html` | Интерактивный каталог всех компонентов (открыть в браузере для визуального референса) |
| `SKILL.md` | Инструкции для AI-агента |
