import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type { PlayerEventStat, PlayerStats } from '@/types/api';
import { asEventType } from '@/lib/event-enum';
import { eventLabel } from '@/lib/event-label';

type SB = SupabaseClient<Database>;

/**
 * Статистика игрока для вкладки «Статистика»: сводка по играм/тренировкам + история по событиям.
 *
 * База — посещённые прошедшие события игрока (showed_up). Голы/передачи — из result_points,
 * штрафы — из event_penalties; всё агрегируется по event_id в коде. Сводка = сумма по истории.
 */
export async function computePlayerStats(
  sb: SB,
  teamId: string,
  userId: string,
): Promise<PlayerStats> {
  const nowIso = new Date().toISOString();

  const [attendedRes, goalsRes, assistsRes, penaltiesRes] = await Promise.all([
    sb
      .from('event_attendances')
      .select('events!inner(id, type, title, opponent_name, starts_at)')
      .eq('user_id', userId)
      .eq('showed_up', true)
      .eq('events.team_id', teamId)
      .neq('events.status', 'cancelled')
      .lt('events.starts_at', nowIso),
    sb
      .from('result_points')
      .select('event_id, events!inner(team_id)')
      .eq('type', 'goal')
      .eq('user_id', userId)
      .eq('events.team_id', teamId),
    sb
      .from('result_points')
      .select('event_id, events!inner(team_id)')
      .eq('type', 'assist')
      .eq('user_id', userId)
      .eq('events.team_id', teamId),
    sb
      .from('event_penalties')
      .select('event_id, minutes, events!inner(team_id)')
      .eq('player_user_id', userId)
      .eq('events.team_id', teamId),
  ]);

  const goalsByEvent = new Map<string, number>();
  for (const r of goalsRes.data ?? []) goalsByEvent.set(r.event_id, (goalsByEvent.get(r.event_id) ?? 0) + 1);
  const assistsByEvent = new Map<string, number>();
  for (const r of assistsRes.data ?? []) assistsByEvent.set(r.event_id, (assistsByEvent.get(r.event_id) ?? 0) + 1);
  const pimByEvent = new Map<string, number>();
  for (const r of penaltiesRes.data ?? [])
    pimByEvent.set(r.event_id, (pimByEvent.get(r.event_id) ?? 0) + Number(r.minutes));

  const games = { played: 0, goals: 0, assists: 0, penalty_minutes: 0 };
  const trainings = { played: 0, goals: 0, assists: 0 };
  const events: PlayerEventStat[] = [];

  for (const r of attendedRes.data ?? []) {
    const ev = r.events;
    if (!ev) continue;
    const isGame = asEventType(ev.type) === 'game';
    const goals = goalsByEvent.get(ev.id) ?? 0;
    const assists = assistsByEvent.get(ev.id) ?? 0;
    const pim = pimByEvent.get(ev.id) ?? 0;
    events.push({
      event_id: ev.id,
      is_game: isGame,
      title: eventLabel(ev),
      starts_at: ev.starts_at,
      goals,
      assists,
      penalty_minutes: pim,
    });
    if (isGame) {
      games.played += 1;
      games.goals += goals;
      games.assists += assists;
      games.penalty_minutes += pim;
    } else {
      trainings.played += 1;
      trainings.goals += goals;
      trainings.assists += assists;
    }
  }

  events.sort((a, b) => (a.starts_at < b.starts_at ? 1 : a.starts_at > b.starts_at ? -1 : 0));

  return { games, trainings, events };
}
