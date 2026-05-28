# Handoff: Экран «Состав и финансы»

## Overview
Экран детализации тренировки в Sporty Hockey — управление явкой игроков и сбором оплат. Отображает финансовую сводку, список игроков с кнопками «Был» и «Сдал», группировку по статусу RSVP.

## About the Design Files
Файлы в этом пакете — **дизайн-референсы в HTML**. Не копируйте код напрямую. Задача — воссоздать дизайн в целевом окружении, используя паттерны проекта.

## Fidelity
**High-fidelity** — пиксельно-точный макет с финальными цветами, типографикой, отступами и интерактивностью (кнопки «Был»/«Сдал» переключаются).

---

## Screen Structure

```
┌───────────────────────────┐
│  [←]  Состав тренировки   │  NavBar
│   сб 24 мая · 19:30–21:00 │
├───────────────────────────┤
│ Явка и оплата | Пятёрки   │  TabBar (3 tabs)
├───────────────────────────┤
│ ┌─Finance Card──────────┐ │
│ │ Взнос: 1 300 ₽        │ │  scrollable
│ │ Собрано: 15 600 ₽     │ │
│ │ из 20 800 ₽    [75%]  │ │  donut ring
│ │─────────────────────── │ │
│ │ ✓10  ●2  ▲2           │ │  stat chips
│ └───────────────────────┘ │
│                           │
│ Записались (12)           │  group header
│ ┌─PlayerRow─────────────┐ │
│ │ [AV] Имя  [Был][Сдал] │ │
│ └───────────────────────┘ │
│ ...                       │
│ Не ответили (5)           │
│ ...                       │
│ Не идут (2)               │
│ ...                       │
└───────────────────────────┘
```

---

## 1. NavBar

| Property | Value |
|----------|-------|
| Padding | top 52px (incl. status bar), horizontal 16px, bottom 8px |
| Layout | flex row, align center, gap 12 |

### Back Button
- Size: 36×36, circle
- Background: `#F0F0F0`
- Icon: chevron left, `#1C1C1E`, stroke 2.4

### Title (centered)
- Title: 17px/800, `#1C1C1E`, letter-spacing -0.3
- Subtitle: 12px/500, `#8E8E93`, marginTop 3px
- Content: «сб 24 мая · 19:30–21:00 · Ледовая Арена Север»

### Right spacer: 36px width (balances back button)

---

## 2. TabBar

| Property | Value |
|----------|-------|
| Tabs | «Явка и оплата», «Пятёрки / команды», «Статистика» |
| Layout | flex row, equal width, padding 0 16px |
| Active | 13px/600, `#1A7A3D` |
| Inactive | 13px/500, `#8E8E93` |
| Indicator | height 2.5px, radius 3px top, `#1A7A3D`, width ~70% centered |
| Bottom line | 1px solid `#F0F0F0`, full width |

---

## 3. Finance Card

| Property | Value |
|----------|-------|
| Margin | 14px 16px 0 |
| Padding | 16px 18px 4px |
| Background | `#FAFAF8` |
| Border | 1px solid `#F0EDE6` |
| Border-radius | 16px |

### Layout: flex row
- Left column (flex 1):
  - Label «Взнос с игрока»: 12px/500, `#8E8E93`
  - Amount «1 300 ₽»: 24px/800, `#1C1C1E`, tabular-nums, letter-spacing -0.4, marginTop 2
  - Label «Собрано»: 12px/500, `#8E8E93`, marginTop 12
  - Collected «15 600 ₽»: 24px/800, `#1C1C1E`, tabular-nums
  - Total «из 20 800 ₽»: 12px/500, `#AEAEB2`, marginTop 3
- Right: Donut ring 110×110

### Divider
- Height 1px, background `#EBE8E1`, margin 16px 0 0

### Stat Chips Row
- Padding: 14px 0
- 3 chips, flex 1 each, gap 4

#### Stat Chip
- Icon circle: 26×26, rounded
- Label: 12px/500, `#6B7280`
- Value: 16px/800, `#1C1C1E`, tabular-nums

| Chip | Icon bg | Label | 
|------|---------|-------|
| Оплатили | `#1A7A3D` (check icon) | count |
| Частично | `#FF9500` (dot icon) | count |
| Должники | `#D43838` (user icon) | count |

---

## 4. Donut / Progress Ring

| Property | Value |
|----------|-------|
| Size | 110×110 |
| Track | stroke `#EFEDE7`, width 9 |
| Fill | stroke `#1A7A3D`, width 9, linecap round |
| Center text | percent, 22px/800, `#1A7A3D`, tabular-nums |
| Rotation | -90deg (starts from top) |

---

## 5. Group Header

| Property | Value |
|----------|-------|
| Padding | 20px 16px 8px |
| Title | 16px/800, `#1C1C1E` |
| Count pill | min-width 22, height 20, padding 0 7px, radius 10, bg `#F0F0F0`, color `#8E8E93`, 12px/700, tabular-nums |
| Gap | 8px |

---

## 6. Player Row

| Property | Value |
|----------|-------|
| Layout | flex row, align center, gap 12, padding 12px 16px |
| Divider | 1px `#F0F0F0`, margin-left 74px (aligned to text, not avatar) |

### Avatar
- Size: 46×46, circle
- Background: linear-gradient 135deg, 6 color pairs
- Initials: white, 700, size 34% of avatar size

**Color pairs (by index % 6):**
1. `#8E9AAB` → `#5C6B7F`
2. `#B4A78F` → `#7A6E58`
3. `#9CAFA2` → `#5E7269`
4. `#A99B8E` → `#6E5F50`
5. `#8FA0AE` → `#5B6A78`
6. `#9C9890` → `#6B655B`

### Player Info
- Name: 15px/700, `#1C1C1E`, ellipsis on overflow
- Position: 12px/500, `#8E8E93`, format «#17 · Нападающий»

### Action Tiles (2 кнопки)
| Property | Value |
|----------|-------|
| Size | 50×50, border-radius 12 |
| Gap | 8px between tiles |

**«Был» (attendance):**
| State | Background | Border | Icon/Label color |
|-------|-----------|--------|-----------------|
| Inactive | white | 1.5px `#E4E2DC` | `#C8C7C2` |
| Active | `#1A7A3D` | 1.5px `#1A7A3D` | white |

**«Сдал» (payment):**
| State | Background | Border | Label |
|-------|-----------|--------|-------|
| Not paid | white | 1.5px `#E4E2DC` | «Сдал» |
| Paid full | `#1A7A3D` | `#1A7A3D` | «Сдал» |
| Partial | `#FF9500` | `#FF9500` | «700 ₽» (actual amount) |

**Tile icon:** 20×20, label 10px/700

---

## Data Model

```typescript
interface Player {
  id: number;
  name: string;          // «Иван Соколов»
  number: number;        // jersey #17
  position: string;      // «Нападающий»
  rsvp: 'going' | 'none' | 'notGoing';
  attended: boolean;
  paid: number;          // amount in ₽ (0, partial, or full)
  due: number;           // 1300 ₽
}
```

### Sample Data (19 players)
- 12 going (attended, various payment states)
- 5 не ответили
- 2 не идут

---

## Interactions

1. **«Был» toggle** — tap переключает attended true/false
2. **«Сдал» toggle** — 3 состояния по кругу: не оплачено → полная оплата → частичная (54%) → не оплачено
3. **Finance card** — обновляется реактивно при изменении оплат (собранная сумма, процент, stat chips)
4. **Tab switching** — переключение между «Явка и оплата» / «Пятёрки / команды» / «Статистика» (только первый таб реализован)

---

## Files
| File | Description |
|------|-------------|
| `Состав и финансы v2.html` | Интерактивный прототип с toggle-кнопками |
| `ds-components.jsx` | Shared компоненты (если используется) |
| `ds-components-v2.jsx` | Компоненты DS v2 (Avatar, ActionTile, Donut, etc.) |
