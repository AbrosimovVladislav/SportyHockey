import 'server-only';
import { supabaseServer } from '@/lib/supabase-server';
import {
  asLineSlot,
  slotKind,
  lineIndexOfSlot,
  forwardSlot,
  defenseSlot,
} from '@/lib/event-lines';
import type {
  DefenseRole,
  EventType,
  ForwardRole,
  LineIndex,
  LineSlot,
  TeamSide,
} from '@/types/api';

type DefaultLine = { user_id: string; slot: LineSlot };
type LineRow = {
  event_id: string;
  team_side: TeamSide;
  slot: LineSlot;
  user_id: string;
  updated_at: string;
};
type LineupRow = {
  event_id: string;
  user_id: string;
  team_side: TeamSide;
  updated_at: string;
};

// Строки дефолтной раскидки, готовые к вставке. Стороны (`event_lineups`) только для тренировки.
export type DefaultLineupRows = { lineupRows: LineupRow[]; lineRows: LineRow[] };

/**
 * Собирает строки дефолтной раскидки команды для события, НИЧЕГО не записывая в БД.
 *
 * Игра — один состав (`light`), звенья команды копируются 1:1 (вратарь `g` → слот игры `g1`).
 * Тренировка — стороны из `team_default_sides`, звенья из `team_default_lines` раскладываются
 * по сторонам: игрок встаёт в свой слот на своей стороне, только если в его звене/паре на этой
 * же стороне есть ещё хотя бы один игрок (одиночка остаётся в пуле стороны). Вратарь ставится
 * на свою сторону в слот `g` без правила напарника.
 *
 * Раскидка по звеньям/сторонам не зависит от явки (записался/был) — это вспомогательная
 * раскладка тренера. Применяется ко всем игрокам из дефолта команды.
 *
 * Возвращает `null`, если не удалось прочитать дефолт команды (нельзя доверять результату).
 * Это нужно сбросу: он удаляет текущую раскидку только если новая успешно собрана.
 */
export async function buildDefaultLineupRows(
  eventId: string,
  type: EventType,
  teamId: string,
): Promise<DefaultLineupRows | null> {
  const sb = supabaseServer();
  const now = new Date().toISOString();

  const { data: defLinesRaw, error: linesErr } = await sb
    .from('team_default_lines')
    .select('user_id, slot')
    .eq('team_id', teamId);
  if (linesErr) {
    console.error('[apply-default-lineup] team lines load failed:', linesErr);
    return null;
  }
  const lines: DefaultLine[] = [];
  for (const r of defLinesRaw ?? []) {
    const slot = asLineSlot(r.slot);
    if (slot) lines.push({ user_id: r.user_id, slot });
  }

  if (type === 'game') {
    const lineRows: LineRow[] = lines.map((l) => ({
      event_id: eventId,
      team_side: 'light',
      slot: l.slot === 'g' ? ('g1' as LineSlot) : l.slot,
      user_id: l.user_id,
      updated_at: now,
    }));
    return { lineupRows: [], lineRows };
  }

  // Тренировка: стороны.
  const { data: defSidesRaw, error: sidesErr } = await sb
    .from('team_default_sides')
    .select('user_id, team_side')
    .eq('team_id', teamId);
  if (sidesErr) {
    console.error('[apply-default-lineup] team sides load failed:', sidesErr);
    return null;
  }
  const sideOf = new Map<string, TeamSide>();
  for (const r of defSidesRaw ?? []) {
    if (r.team_side === 'light' || r.team_side === 'dark') sideOf.set(r.user_id, r.team_side);
  }

  const lineupRows: LineupRow[] = [...sideOf.entries()].map(([user_id, team_side]) => ({
    event_id: eventId,
    user_id,
    team_side,
    updated_at: now,
  }));

  // Тренировка: звенья по сторонам.
  const lineRows: LineRow[] = [];

  // Группируем полевых по (вид, исходный индекс звена команды); вратарь — сразу в слот 'g'.
  const groups = new Map<string, DefaultLine[]>();
  for (const l of lines) {
    if (slotKind(l.slot) === 'goalie') {
      const side = sideOf.get(l.user_id);
      if (side) {
        lineRows.push({ event_id: eventId, team_side: side, slot: 'g', user_id: l.user_id, updated_at: now });
      }
      continue;
    }
    const idx = lineIndexOfSlot(l.slot);
    if (idx == null) continue;
    const key = `${slotKind(l.slot)}:${idx}`;
    const arr = groups.get(key) ?? [];
    arr.push(l);
    groups.set(key, arr);
  }

  // Дефолт команды хранит АБСОЛЮТНЫЕ индексы звеньев (f1, f2…). На стороне они должны
  // идти подряд с первого: тёмные «звено 2 команды» становятся «Нападением 1» своей
  // стороны. Поэтому для каждой стороны и вида (нападение/защита) собираем попавшие на
  // сторону звенья (≥2 игрока — иначе одиночка остаётся в пуле), сортируем по исходному
  // индексу и переномеровываем подряд с 1, сохраняя роль игрока в слоте.
  for (const side of ['light', 'dark'] as TeamSide[]) {
    for (const kind of ['forward', 'defense'] as const) {
      const placed: { index: LineIndex; members: DefaultLine[] }[] = [];
      for (const [key, members] of groups) {
        if (!key.startsWith(`${kind}:`)) continue;
        const onSide = members.filter((m) => sideOf.get(m.user_id) === side);
        if (onSide.length < 2) continue;
        const index = lineIndexOfSlot(onSide[0].slot);
        if (index == null) continue;
        placed.push({ index, members: onSide });
      }
      placed.sort((a, b) => a.index - b.index);
      placed.forEach(({ members }, i) => {
        const compactIndex = (i + 1) as LineIndex;
        for (const m of members) {
          const role = m.slot.split('_')[1];
          const slot =
            kind === 'forward'
              ? forwardSlot(compactIndex, role as ForwardRole)
              : defenseSlot(compactIndex, role as DefenseRole);
          lineRows.push({ event_id: eventId, team_side: side, slot, user_id: m.user_id, updated_at: now });
        }
      });
    }
  }

  return { lineupRows, lineRows };
}

// Вставляет собранные строки раскидки. Возвращает false при ошибке вставки.
export async function insertDefaultLineupRows(rows: DefaultLineupRows): Promise<boolean> {
  const sb = supabaseServer();
  if (rows.lineupRows.length > 0) {
    const { error } = await sb.from('event_lineups').insert(rows.lineupRows);
    if (error) {
      console.error('[apply-default-lineup] sides insert failed:', error);
      return false;
    }
  }
  if (rows.lineRows.length > 0) {
    const { error } = await sb.from('event_lines').insert(rows.lineRows);
    if (error) {
      console.error('[apply-default-lineup] lines insert failed:', error);
      return false;
    }
  }
  return true;
}

/**
 * Прокидывает дефолтную раскидку в только что созданное событие. Best-effort:
 * ошибки логируются, но не валят создание события (можно сбросить вручную).
 */
export async function applyDefaultLineup(
  eventId: string,
  type: EventType,
  teamId: string,
): Promise<void> {
  try {
    const rows = await buildDefaultLineupRows(eventId, type, teamId);
    if (rows) await insertDefaultLineupRows(rows);
  } catch (e) {
    console.error('[apply-default-lineup] unexpected error:', e);
  }
}
