import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import { computeTeamBalance } from '@/lib/team-finance';
import type {
  DashboardLastGame,
  DashboardStatsResponse,
  DashboardTeamSummary,
  DashboardTopPlayer,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Блок «Ключевая статистика» на главной (v0.6, итерация 64). Один эндпоинт
// отдаёт три набора данных под три таба:
//   • `top_players` — топ-5 по очкам (Г + П) только в играх;
//   • `last_game`   — счёт + ассисты + минуты удаления последней игры;
//   • `team_summary` — матчи / тренировки / победы / шайбы / пропущено + баланс.
//
// Голы и ассисты считаются по `result_points.team_side='own'/'opponent'`
// и `type='goal'/'assist'`. Удаления — суммой `event_penalties.minutes` по
// `team_side`. Баланс — `computeTeamBalance(team).total`.

type ResultPointRow = {
  user_id: string | null;
  type: string;
  team_side: string;
  event_id: string;
};

type EventLite = {
  id: string;
  type: string;
  status: string | null;
  starts_at: string;
  opponent_name: string | null;
  outcome: string | null;
};

export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const teamId = await getUserTeamId(user.id, req);
    if (!teamId) {
      const empty: DashboardStatsResponse = {
        top_players: [],
        last_game: null,
        team_summary: {
          games_played: 0,
          trainings_played: 0,
          wins: 0,
          goals_for: 0,
          goals_against: 0,
          balance: 0,
        },
      };
      return NextResponse.json(empty);
    }

    const sb = supabaseServer();
    const nowIso = new Date().toISOString();

    // Все события команды (для разбивки по type / прошедшее / отменённое).
    // На амат. команде это сотни строк — без пагинации норм. Если когда-то
    // упрёмся — переедем на агрегаты в SQL.
    const [eventsRes, pointsRes, balance] = await Promise.all([
      sb
        .from('events')
        .select('id, type, status, starts_at, opponent_name, outcome')
        .eq('team_id', teamId)
        .neq('status', 'cancelled'),
      // Все result_points всех игр команды (для top-5 и goals_for/against).
      // Тренировочные `light/dark` нас не интересуют — фильтруем в коде.
      sb
        .from('result_points')
        .select('user_id, type, team_side, event_id, events!inner(team_id, type, status)')
        .eq('events.team_id', teamId)
        .eq('events.type', 'game')
        .neq('events.status', 'cancelled'),
      computeTeamBalance(sb, teamId),
    ]);

    if (eventsRes.error) {
      return NextResponse.json({ error: eventsRes.error.message }, { status: 500 });
    }
    if (pointsRes.error) {
      return NextResponse.json({ error: pointsRes.error.message }, { status: 500 });
    }

    const events = (eventsRes.data ?? []) as EventLite[];
    const points = (pointsRes.data ?? []) as ResultPointRow[];

    // Команда — для логотипа в last_game.
    const teamRes = await sb
      .from('teams')
      .select('id, name, logo_url')
      .eq('id', teamId)
      .maybeSingle();
    if (teamRes.error) {
      return NextResponse.json({ error: teamRes.error.message }, { status: 500 });
    }
    const ourTeam = teamRes.data
      ? { name: teamRes.data.name, logo_url: teamRes.data.logo_url ?? null }
      : { name: '', logo_url: null as string | null };

    // ───────────────── team_summary ─────────────────
    const summary = computeTeamSummary(events, points, nowIso, balance.total);

    // ───────────────── top_players ─────────────────
    const top_players = await computeTopPlayers(sb, teamId, points);

    // ───────────────── last_game ─────────────────
    const last_game = await computeLastGame(sb, events, points, nowIso, ourTeam);

    const body: DashboardStatsResponse = {
      top_players,
      last_game,
      team_summary: summary,
    };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

function computeTeamSummary(
  events: EventLite[],
  points: ResultPointRow[],
  nowIso: string,
  balance: number,
): DashboardTeamSummary {
  let gamesPlayed = 0;
  let trainingsPlayed = 0;
  let wins = 0;
  for (const ev of events) {
    if (ev.starts_at >= nowIso) continue; // только сыгранные
    if (ev.type === 'game') gamesPlayed += 1;
    else if (ev.type === 'training') trainingsPlayed += 1;
    if (ev.outcome === 'win') wins += 1;
  }
  let goalsFor = 0;
  let goalsAgainst = 0;
  for (const p of points) {
    if (p.type !== 'goal') continue;
    if (p.team_side === 'own') goalsFor += 1;
    else if (p.team_side === 'opponent') goalsAgainst += 1;
  }
  return {
    games_played: gamesPlayed,
    trainings_played: trainingsPlayed,
    wins,
    goals_for: goalsFor,
    goals_against: goalsAgainst,
    balance,
  };
}

async function computeTopPlayers(
  sb: ReturnType<typeof supabaseServer>,
  teamId: string,
  points: ResultPointRow[],
): Promise<DashboardTopPlayer[]> {
  // Свод по user_id для своих игроков (team_side='own', user_id != null).
  const stats = new Map<string, { goals: number; assists: number }>();
  for (const p of points) {
    if (p.team_side !== 'own') continue;
    if (!p.user_id) continue;
    const s = stats.get(p.user_id) ?? { goals: 0, assists: 0 };
    if (p.type === 'goal') s.goals += 1;
    else if (p.type === 'assist') s.assists += 1;
    stats.set(p.user_id, s);
  }
  if (stats.size === 0) return [];

  // Топ-5 по points = goals + assists.
  const top = [...stats.entries()]
    .map(([user_id, s]) => ({ user_id, goals: s.goals, assists: s.assists, points: s.goals + s.assists }))
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points || b.goals - a.goals)
    .slice(0, 5);
  if (top.length === 0) return [];

  // Подтянем профили + jersey_number из текущего членства в команде.
  const ids = top.map((r) => r.user_id);
  const [usersRes, memRes] = await Promise.all([
    sb.from('users').select('id, first_name, last_name, avatar_url, photo_url').in('id', ids),
    sb
      .from('team_memberships')
      .select('user_id, jersey_number')
      .eq('team_id', teamId)
      .in('user_id', ids),
  ]);
  if (usersRes.error || memRes.error) {
    return [];
  }
  const byUser = new Map(
    (usersRes.data ?? []).map((u) => [
      u.id,
      {
        first_name: u.first_name ?? null,
        last_name: u.last_name ?? null,
        avatar_url: u.avatar_url ?? null,
        photo_url: u.photo_url ?? null,
      },
    ]),
  );
  const byJersey = new Map(
    (memRes.data ?? []).map((m) => [m.user_id, m.jersey_number ?? null]),
  );

  return top.map((r) => {
    const u = byUser.get(r.user_id);
    return {
      user_id: r.user_id,
      first_name: u?.first_name ?? null,
      last_name: u?.last_name ?? null,
      avatar_url: u?.avatar_url ?? null,
      photo_url: u?.photo_url ?? null,
      jersey_number: byJersey.get(r.user_id) ?? null,
      goals: r.goals,
      assists: r.assists,
      points: r.points,
    };
  });
}

async function computeLastGame(
  sb: ReturnType<typeof supabaseServer>,
  events: EventLite[],
  points: ResultPointRow[],
  nowIso: string,
  ourTeam: { name: string; logo_url: string | null },
): Promise<DashboardLastGame | null> {
  // Последняя сыгранная игра (даже если outcome=null — без забитых голов).
  const games = events
    .filter((e) => e.type === 'game' && e.starts_at < nowIso)
    .sort((a, b) => (a.starts_at < b.starts_at ? 1 : a.starts_at > b.starts_at ? -1 : 0));
  const last = games[0];
  if (!last) return null;

  // Голы и ассисты по сторонам.
  let ourScore = 0;
  let oppScore = 0;
  let ourAssists = 0;
  let oppAssists = 0;
  for (const p of points) {
    if (p.event_id !== last.id) continue;
    if (p.type === 'goal') {
      if (p.team_side === 'own') ourScore += 1;
      else if (p.team_side === 'opponent') oppScore += 1;
    } else if (p.type === 'assist') {
      if (p.team_side === 'own') ourAssists += 1;
      else if (p.team_side === 'opponent') oppAssists += 1;
    }
  }

  // Минуты удалений.
  const penRes = await sb
    .from('event_penalties')
    .select('team_side, minutes')
    .eq('event_id', last.id);
  let ourPenalty = 0;
  let oppPenalty = 0;
  for (const r of penRes.data ?? []) {
    if (r.team_side === 'own') ourPenalty += Number(r.minutes ?? 0);
    else if (r.team_side === 'opponent') oppPenalty += Number(r.minutes ?? 0);
  }

  return {
    event_id: last.id,
    played_on: last.starts_at,
    opponent_name: last.opponent_name ?? null,
    our_name: ourTeam.name,
    our_logo_url: ourTeam.logo_url,
    our_score: ourScore,
    opp_score: oppScore,
    our_assists: ourAssists,
    opp_assists: oppAssists,
    our_penalty_minutes: ourPenalty,
    opp_penalty_minutes: oppPenalty,
  };
}
