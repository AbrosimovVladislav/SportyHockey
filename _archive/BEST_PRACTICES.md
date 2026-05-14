# Разработка мобильных приложений с Claude Code

Пошаговый гайд. Держи под рукой.

---

## Старт нового проекта

1. Открой Claude Code в пустой папке
2. Скажи: "Прочитай QUESTIONNAIRE.md и проведи опрос"
3. Ответь на вопросы по группам
4. Claude сгенерирует все файлы проекта
5. Проверь сгенерированное, скорректируй
6. Начни с v0.0 (scaffold) — пустое работающее приложение

---

## MCP серверы

Ставь 3-4 максимум:

**Context7** — актуальные доки библиотек:
```bash
claude mcp add context7 --transport http https://mcp.context7.com/mcp
```

**Excalidraw** — визуальная схема архитектуры:
```bash
docker run -d -p 3000:3000 --name mcp-excalidraw-canvas \
  ghcr.io/yctimlin/mcp_excalidraw-canvas:latest
claude mcp add excalidraw --scope user \
  -- docker run -i --rm \
  -e EXPRESS_SERVER_URL=http://host.docker.internal:3000 \
  -e ENABLE_CANVAS_SYNC=true \
  ghcr.io/yctimlin/mcp_excalidraw:latest
```

**Supabase MCP** (если используешь):
```bash
claude mcp add supabase --transport http \
  "https://mcp.supabase.com/mcp?project_ref=YOUR_REF"
```

---

## Workflow: Plan → Implement → Review

**Plan** (обязательно для > 1 файла):
```
Прочитай docs/features/[эпик].md.
Предложи план: какие файлы создать/изменить.
Не пиши код.
```
Проверь план. Скорректируй. Потом разрешай кодить.

**Implement:**
```
Реализуй по плану. Если неоднозначность — спроси.
```

**Review:**
```
Запусти code-reviewer и design-reviewer.
```

---

## Управление контекстом

- `/compact` — между связанными задачами (70% контекста)
- `/clear` — между разными фичами
- `/context` — проверяй загруженность
- `@file.tsx` — указывай путь, не описывай файл словами

---

## Тактики против факапов

**Покажи пример.** "Посмотри как сделан ProfileScreen и сделай аналогично."

**Одна фича = одна сессия.** Не мешай задачи.

**"Prove it works."** После реализации: "докажи что работает — запусти typecheck."

**"Knowing everything you know now..."** Если результат средний — попроси переделать с нуля.

**Не додумывай.** Неоднозначность → вопрос, а не допущение.

---

## Чеклист на каждый день

1. Plan Mode для всего что трогает > 1 файла
2. Читай каждое изменение
3. Субагенты ревьюят после каждой фичи
4. Доки обновляются после каждой фичи
5. `/compact` при 70% контекста
6. Одна фича = одна сессия
