# Handoff: Экран «Расписание»

## Overview
Главный экран приложения Sporty Hockey — список предстоящих событий (тренировки, игры, турниры) с фильтрацией и переключением список/календарь.

## About the Design Files
Файлы в этом пакете — **дизайн-референсы в HTML**. Не копируйте код напрямую. Задача — воссоздать дизайн в целевом окружении (React Native / SwiftUI / Flutter), используя паттерны проекта.

## Fidelity
**High-fidelity** — пиксельно-точный макет с финальными цветами, типографикой, отступами.

---

## Screen Structure

Экран состоит из 4 вертикальных зон (сверху вниз):

```
┌─────────────────────────┐
│   DARK HEADER (#233F30) │  fixed, не скроллится
│   [Menu]    [Bell 🟢]   │
│   Капитан               │
│   Расписание            │
├─────────────────────────┤
│ ╭ WHITE BOTTOM SHEET ╮  │  border-radius: 24 24 0 0
│ │ Список | Календарь │  │  margin-top: -12 (наезжает)
│ │ [Все] [Тренировки]  │  │
│ │ [Игры] [Турниры]    │  │
│ │                     │  │
│ │ Сегодня    24 мая   │  │  scrollable
│ │ ┌─EventCard──────┐  │  │
│ │ │ 19:30  🕐 Трен. │  │  │
│ │ └────────────────┘  │  │
│ │ ┌─EventCard──────┐  │  │
│ │ │ 21:15  🏆 Игра  │  │  │
│ │ └────────────────┘  │  │
│ │ ...                 │  │
│ ╰─────────────────────╯  │
├─────────────────────────┤
│  BOTTOM NAV (5 tabs)    │  fixed
│  🏠  📅  ₽  👥  •••    │
└─────────────────────────┘
         [FAB +]              absolute, bottom-right
```

---

## 1. Dark Header

| Property | Value |
|----------|-------|
| Background | `#233F30` |
| Padding | top: 58px (incl. status bar), bottom: 28px, horizontal: 20px |

### Menu Button
- Size: 48×48, border-radius: 24 (circle)
- Background: `rgba(255,255,255,0.12)`
- Icon: hamburger (3 lines), white, stroke 1.8

### Bell
- Icon: outline bell, white, stroke 1.7
- Green dot: 11×11, `#34C759`, border 2.5px `#233F30`, position absolute top-right

### Role Label
- Text: «Капитан»
- Font: 14px / weight 400, `rgba(255,255,255,0.55)`, letter-spacing 0.1

### Title
- Text: «Расписание»
- Font: 34px / weight 800, white, letter-spacing -0.3

---

## 2. White Bottom Sheet

| Property | Value |
|----------|-------|
| Background | `#FFFFFF` |
| Border-radius | 24px 24px 0 0 |
| Margin-top | -12px (overlaps header) |
| Z-index | above header |
| Layout | flex column, flex: 1, overflow hidden |

### Content Tabs
| Property | Value |
|----------|-------|
| Layout | flex row, 2 equal tabs |
| Active tab | 16px/600, color `#1A1A1A` |
| Inactive tab | 16px/400, color `#8A8C8C` |
| Indicator | height 3px, radius 2px, `#1A6B3C`, left 28% right 28% |
| Border-bottom | 1px solid `#EBEBEB` |
| Padding | 16px top, 13px bottom |

### Filter Chips
| Property | Value |
|----------|-------|
| Layout | flex row, centered, gap 8px |
| Padding | 18px 16px 4px |
| Chip size | padding 8px 16px, border-radius 20px |
| Font | 15px / weight 500 |
| Active | bg `#233F30`, color white, no border |
| Inactive | bg white, color `#1A1A1A`, border 1.5px `#D0D0D0` |
| Options | «Все», «Тренировки», «Игры», «Турниры» |

### Section Header
| Property | Value |
|----------|-------|
| Layout | flex row, space-between, baseline |
| Padding | 22px top, 12px bottom, 20px horizontal |
| Title | 20px/700, `#1A1A1A` |
| Subtitle | 14px/400, `#8A8C8C` (e.g. «24 мая, сб») |

---

## 3. Event Card

Горизонтальная карточка, используется для всех типов событий.

| Property | Value |
|----------|-------|
| Layout | flex row, align center, gap 10px |
| Background | `#F3F4F3` |
| Border-radius | 16px |
| Padding | 16px 12px |
| Gap between cards | 12px |
| Container padding | 0 16px |

### Time Column (today mode)
| Property | Value |
|----------|-------|
| Min-width | 40px |
| Time | 17px/600, `#1A1A1A` |
| End time | 13px/400, `#8A8C8C`, marginTop 2px |

### Time Column (week mode)
| Property | Value |
|----------|-------|
| Min-width | 44px |
| Date number | 22px/700, `#1A1A1A` |
| Day abbreviation | 13px/400, `#8A8C8C`, same line as number, gap 2px |
| Time below | 14px/400, `#8A8C8C`, marginTop 2px |

### Icon Box
| Property | Value |
|----------|-------|
| Size | 44×44 |
| Border-radius | 12px |
| Training | bg `#D6E4DB`, icon clock `#3A7A50` 20px |
| Game | bg `#D6E4DB`, icon trophy `#3A7A50` 20px |
| Tournament | bg `#EDE3C5`, icon trophy `#C09A38` 20px |

### Info
| Property | Value |
|----------|-------|
| Title | 15px/600, `#1A1A1A` |
| Venue | 13px/400, `#8A8C8C`, marginTop 2px |

### Counter + Chevron
| Property | Value |
|----------|-------|
| Font | 15px |
| Count | `#1A6B3C` / weight 700 |
| Separator + total | `#8A8C8C` / weight 400 |
| Chevron | 7×12, stroke `#C4C4C4`, width 1.8 |
| Gap | 8px between counter and chevron |

---

## 4. Bottom Navigation

| Property | Value |
|----------|-------|
| Layout | flex row, 5 equal tabs |
| Background | white |
| Border-top | 1px solid `#EBEBEB` |
| Padding | 8px top, 30px bottom (safe area) |
| Active color | `#1A6B3C`, weight 600 |
| Inactive color | `#ABABAB`, weight 400 |
| Icons | 24×24, outline, stroke 1.7 |
| Labels | 10px |
| Gap icon→label | 3px |

**Tabs:**
1. Команда (home icon)
2. События (calendar icon) — **active on this screen**
3. Деньги (₽ in circle)
4. Состав (people)
5. Ещё (3 dots)

---

## 5. FAB

| Property | Value |
|----------|-------|
| Size | 56×56, border-radius 28 |
| Background | `#233F30` |
| Shadow | `0 4px 14px rgba(0,0,0,0.25)` |
| Icon | white «+», stroke 2.5 |
| Position | absolute, bottom 78px, right 18px |

---

## Data Model

```typescript
interface ScheduleEvent {
  id: string;
  type: 'training' | 'game' | 'tournament';
  title: string;           // «Тренировка», «Игра vs Северные Волки»
  venue: string;           // «Большая арена»
  startTime: string;       // «19:30»
  endTime: string;         // «21:00»
  date: Date;
  attendeeCount: number;   // confirmed
  attendeeTotal: number;   // invited
}
```

### Sample Data
| Time | Type | Title | Venue | Count |
|------|------|-------|-------|-------|
| 19:30–21:00 | training | Тренировка | Большая арена | 12/16 |
| 21:15–23:00 | game | Игра vs Северные Волки | Арена Петровка | 15/18 |
| 23:30–01:00 | tournament | Турнир «Кубок Льда» | Арена Север | 10/16 |
| 26 пн 19:30 | training | Тренировка | Малая арена | 8/14 |
| 27 вт 21:15 | game | Игра vs Медведи | Арена Петровка | 16/18 |

---

## Interactions

1. **Filter Chips** — tap переключает активный фильтр, список обновляется
2. **Content Tabs** — переключение между списком и календарём (layout TBD)
3. **Event Card** — tap → навигация на экран деталей события
4. **FAB** — tap → экран создания нового события
5. **Bottom Nav** — навигация между главными разделами

---

## Files
| File | Description |
|------|-------------|
| `Schedule Screen.html` | Интерактивный прототип (открыть в браузере) |
| `schedule-app.jsx` | React-компоненты экрана |
| `ios-frame.jsx` | Device frame (только для прототипа, не нужен в продакшн) |
