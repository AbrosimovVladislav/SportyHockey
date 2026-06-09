import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type { AttendanceLast5Item, AttendanceStatus, PlayerOverview } from '@/types/api';
import { asEventType } from '@/lib/event-enum';
import { computePlayerBalance } from '@/lib/player-balance';

type SB = SupabaseClient<Database>;

/**
 * Агрегаты публичного профиля игрока: посещаемость (+ последние 5), баланс, статистика.
 *
 * Считаем оптимально: счётчики (знаменатель/числитель посещаемости) считает сам Postgres
 * через `count` — ни одной лишней строки в память сервера. В Node приезжает только личный
 * след игрока (его посещённые события, оплаты, голы, ассисты) — он ограничен активностью
 * самого игрока, а не размером истории команды. Арифметика (деление, вычитание) — здесь.
 *
 * «Прошедшее событие» = `starts_at < now()` и не отменено (упрощение coalesce(ends_at,starts_at):
 * расходится только для события, идущего прямо в момент просмотра).
 */
export async function computePlayerOverview(
  sb: SB,
  teamId: string,
  userId: string,
): Promise<PlayerOverview> {
  const nowIso = new Date().toISOString();

  const { data: mem } = await sb
    .from('team_memberships')
    .select('joined_at')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle();
  const joinedIso = mem?.joined_at ?? new Date(0).toISOString();

  const [denomRes, numRes, attendedRes, balance, goalsRes, assistsRes, last5Res] = await Promise.all([
    // Знаменатель посещаемости: прошедшие не-отменённые события команды после вступления.
    sb
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .neq('status', 'cancelled')
      .lt('starts_at', nowIso)
      .gte('starts_at', joinedIso),
    // Числитель: те из них, где игрок отметился пришедшим (showed_up).
    sb
      .from('events')
      .select('id, event_attendances!inner(showed_up)', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .neq('status', 'cancelled')
      .lt('starts_at', nowIso)
      .gte('starts_at', joinedIso)
      .eq('event_attendances.user_id', userId)
      .eq('event_attendances.showed_up', true),
    // Посещённые прошедшие события игрока (тип + взнос) → начисления и «сыграно» по типу.
    sb
      .from('event_attendances')
      .select('events!inner(type, cost_per_player)')
      .eq('user_id', userId)
      .eq('showed_up', true)
      .eq('events.team_id', teamId)
      .neq('events.status', 'cancelled')
      .lt('events.starts_at', nowIso),
    // Баланс игрока — единый расчёт ([player-balance.ts]), общий с
    // /money/players и вкладкой «Финансы» в профиле.
    computePlayerBalance(sb, teamId, userId),
    // Голы игрока в событиях команды (по типу).
    sb
      .from('result_points')
      .select('events!inner(type)')
      .eq('type', 'goal')
      .eq('user_id', userId)
      .eq('events.team_id', teamId),
    // Ассисты игрока в событиях команды (по типу).
    sb
      .from('result_points')
      .select('events!inner(type)')
      .eq('type', 'assist')
      .eq('user_id', userId)
      .eq('events.team_id', teamId),
    // Последние 5 событий из знаменателя (по дате убыванию) — для строки «Последние 5».
    sb
      .from('events')
      .select('id')
      .eq('team_id', teamId)
      .neq('status', 'cancelled')
      .lt('starts_at', nowIso)
      .gte('starts_at', joinedIso)
      .order('starts_at', { ascending: false })
      .limit(5),
  ]);

  const denom = denomRes.count ?? 0;
  const num = numRes.count ?? 0;
  const rate = denom === 0 ? null : Math.round((num / denom) * 100);

  const stats = {
    games: { played: 0, goals: 0, assists: 0 },
    trainings: { played: 0, goals: 0, assists: 0 },
  };

  for (const r of attendedRes.data ?? []) {
    const ev = r.events;
    if (!ev) continue;
    if (asEventType(ev.type) === 'game') stats.games.played += 1;
    else stats.trainings.played += 1;
  }

  for (const r of goalsRes.data ?? []) {
    if (asEventType(r.events?.type ?? null) === 'game') stats.games.goals += 1;
    else stats.trainings.goals += 1;
  }
  for (const r of assistsRes.data ?? []) {
    if (asEventType(r.events?.type ?? null) === 'game') stats.games.assists += 1;
    else stats.trainings.assists += 1;
  }

  // Последние 5: статус (был / не был / неизвестно) — добираем посещаемость только по этим 5.
  const last5Ids = (last5Res.data ?? []).map((e) => e.id);
  const showedByEvent = new Map<string, boolean | null>();
  if (last5Ids.length > 0) {
    const { data: atts } = await sb
      .from('event_attendances')
      .select('event_id, showed_up')
      .eq('user_id', userId)
      .in('event_id', last5Ids);
    for (const a of atts ?? []) showedByEvent.set(a.event_id, a.showed_up);
  }
  const last5: AttendanceLast5Item[] = (last5Res.data ?? []).map((e) => {
    const su = showedByEvent.get(e.id);
    const status: AttendanceStatus = su === true ? 'showed' : su === false ? 'missed' : 'unknown';
    return { event_id: e.id, status };
  });

  return {
    attendance: { rate, last5 },
    finance: { balance: balance.balance },
    stats,
  };
}
