import 'server-only';
import { supabaseServer } from '@/lib/supabase-server';
import { asLineSlot, slotKind, lineIndexOfSlot } from '@/lib/event-lines';
import type { EventType, LineSlot, TeamSide } from '@/types/api';

type DefaultLine = { user_id: string; slot: LineSlot };
type LineRow = {
  event_id: string;
  team_side: TeamSide;
  slot: LineSlot;
  user_id: string;
  updated_at: string;
};

/**
 * Прокидывает дефолтную раскидку команды в только что созданное (или сбрасываемое) событие.
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
 * Best-effort: ошибки логируются, но не валят создание события (можно сбросить вручную).
 */
export async function applyDefaultLineup(
  eventId: string,
  type: EventType,
  teamId: string,
): Promise<void> {
  try {
    const sb = supabaseServer();
    const now = new Date().toISOString();

    const { data: defLinesRaw, error: linesErr } = await sb
      .from('team_default_lines')
      .select('user_id, slot')
      .eq('team_id', teamId);
    if (linesErr) {
      console.error('[apply-default-lineup] team lines load failed:', linesErr);
      return;
    }
    const lines: DefaultLine[] = [];
    for (const r of defLinesRaw ?? []) {
      const slot = asLineSlot(r.slot);
      if (slot) lines.push({ user_id: r.user_id, slot });
    }

    if (type === 'game') {
      const rows: LineRow[] = lines.map((l) => ({
        event_id: eventId,
        team_side: 'light',
        slot: l.slot === 'g' ? ('g1' as LineSlot) : l.slot,
        user_id: l.user_id,
        updated_at: now,
      }));
      if (rows.length > 0) {
        const { error } = await sb.from('event_lines').insert(rows);
        if (error) console.error('[apply-default-lineup] game lines insert failed:', error);
      }
      return;
    }

    // Тренировка: стороны.
    const { data: defSidesRaw, error: sidesErr } = await sb
      .from('team_default_sides')
      .select('user_id, team_side')
      .eq('team_id', teamId);
    if (sidesErr) {
      console.error('[apply-default-lineup] team sides load failed:', sidesErr);
      return;
    }
    const sideOf = new Map<string, TeamSide>();
    for (const r of defSidesRaw ?? []) {
      if (r.team_side === 'light' || r.team_side === 'dark') sideOf.set(r.user_id, r.team_side);
    }

    if (sideOf.size > 0) {
      const lineupRows = [...sideOf.entries()].map(([user_id, team_side]) => ({
        event_id: eventId,
        user_id,
        team_side,
        updated_at: now,
      }));
      const { error } = await sb.from('event_lineups').insert(lineupRows);
      if (error) console.error('[apply-default-lineup] sides insert failed:', error);
    }

    // Тренировка: звенья по сторонам.
    const lineRows: LineRow[] = [];
    const groups = new Map<string, DefaultLine[]>();
    for (const l of lines) {
      if (slotKind(l.slot) === 'goalie') {
        const side = sideOf.get(l.user_id);
        if (side) {
          lineRows.push({ event_id: eventId, team_side: side, slot: 'g', user_id: l.user_id, updated_at: now });
        }
        continue;
      }
      const key = `${slotKind(l.slot)}${lineIndexOfSlot(l.slot)}`;
      const arr = groups.get(key) ?? [];
      arr.push(l);
      groups.set(key, arr);
    }

    for (const members of groups.values()) {
      for (const side of ['light', 'dark'] as TeamSide[]) {
        const onSide = members.filter((m) => sideOf.get(m.user_id) === side);
        // Ставим звено/пару на сторону, только если на ней ≥2 игрока этой группы.
        // Одиночка (напарника по звену на стороне нет) остаётся в пуле стороны.
        if (onSide.length >= 2) {
          for (const m of onSide) {
            lineRows.push({ event_id: eventId, team_side: side, slot: m.slot, user_id: m.user_id, updated_at: now });
          }
        }
      }
    }

    if (lineRows.length > 0) {
      const { error } = await sb.from('event_lines').insert(lineRows);
      if (error) console.error('[apply-default-lineup] training lines insert failed:', error);
    }
  } catch (e) {
    console.error('[apply-default-lineup] unexpected error:', e);
  }
}
