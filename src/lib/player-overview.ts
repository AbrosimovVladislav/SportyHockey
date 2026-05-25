import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type { AttendanceLast5Item, PlayerOverview } from '@/types/api';
import { asEventType } from '@/lib/event-enum';
import { isPastEvent } from '@/lib/attendance-rate';

type SB = SupabaseClient<Database>;

/**
 * Агрегаты публичного профиля игрока: посещаемость (+ последние 5), баланс, статистика.
 * Всё считается из реальных данных: event_attendances, finance_transactions,
 * event_goals / event_goal_assists. Без отдельной таблицы статистики.
 */
export async function computePlayerOverview(
  sb: SB,
  teamId: string,
  userId: string,
): Promise<PlayerOverview> {
  const now = Date.now();

  const { data: events } = await sb
    .from('events')
    .select('id, type, status, starts_at, ends_at, cost_per_player')
    .eq('team_id', teamId);

  const evById = new Map<string, { type: string; startsTs: number; cost: number | null }>();
  const pastEvents: { id: string; type: string; startsTs: number; cost: number | null }[] = [];
  for (const e of events ?? []) {
    const startsTs = new Date(e.starts_at).getTime();
    const cost = e.cost_per_player != null ? Number(e.cost_per_player) : null;
    evById.set(e.id, { type: e.type, startsTs, cost });
    if (isPastEvent(e.status, e.ends_at, e.starts_at, now)) {
      pastEvents.push({ id: e.id, type: e.type, startsTs, cost });
    }
  }

  const { data: mem } = await sb
    .from('team_memberships')
    .select('joined_at')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle();
  const joinedTs = mem?.joined_at ? new Date(mem.joined_at).getTime() : 0;
  const joined = Number.isNaN(joinedTs) ? 0 : joinedTs;

  const { data: atts } = await sb
    .from('event_attendances')
    .select('event_id, showed_up')
    .eq('user_id', userId);
  const showedByEvent = new Map<string, boolean | null>();
  for (const a of atts ?? []) showedByEvent.set(a.event_id, a.showed_up);

  // Посещаемость + последние 5 (события после вступления, по дате убыванию).
  const eligible = pastEvents
    .filter((e) => e.startsTs >= joined)
    .sort((a, b) => b.startsTs - a.startsTs);
  let showedCount = 0;
  for (const e of eligible) if (showedByEvent.get(e.id) === true) showedCount += 1;
  const rate = eligible.length === 0 ? null : Math.round((showedCount / eligible.length) * 100);
  const last5: AttendanceLast5Item[] = eligible.slice(0, 5).map((e) => {
    const su = showedByEvent.get(e.id);
    const status = su === true ? 'showed' : su === false ? 'missed' : 'unknown';
    return { event_id: e.id, status };
  });

  // Финансы: начислено за посещённые события − оплачено игроком.
  let charge = 0;
  for (const e of pastEvents) {
    if (showedByEvent.get(e.id) === true && e.cost != null) charge += e.cost;
  }
  const { data: pays } = await sb
    .from('finance_transactions')
    .select('amount')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('type', 'player_payment');
  const paid = (pays ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const balance = charge - paid;

  // Статистика: сыграно (showed_up), голы (scorer), передачи (assists) — раздельно игры/тренировки.
  const stats = {
    games: { played: 0, goals: 0, assists: 0 },
    trainings: { played: 0, goals: 0, assists: 0 },
  };
  for (const e of pastEvents) {
    if (showedByEvent.get(e.id) !== true) continue;
    if (asEventType(e.type) === 'game') stats.games.played += 1;
    else stats.trainings.played += 1;
  }

  const { data: scorerGoals } = await sb
    .from('event_goals')
    .select('event_id')
    .eq('scorer_user_id', userId);
  for (const g of scorerGoals ?? []) {
    const ev = evById.get(g.event_id);
    if (!ev) continue;
    if (asEventType(ev.type) === 'game') stats.games.goals += 1;
    else stats.trainings.goals += 1;
  }

  const { data: assistRows } = await sb
    .from('event_goal_assists')
    .select('goal_id')
    .eq('user_id', userId);
  const goalIds = (assistRows ?? []).map((a) => a.goal_id);
  if (goalIds.length > 0) {
    const { data: assistGoals } = await sb
      .from('event_goals')
      .select('event_id')
      .in('id', goalIds);
    for (const g of assistGoals ?? []) {
      const ev = evById.get(g.event_id);
      if (!ev) continue;
      if (asEventType(ev.type) === 'game') stats.games.assists += 1;
      else stats.trainings.assists += 1;
    }
  }

  return {
    attendance: { rate, last5 },
    finance: { balance },
    stats,
  };
}
