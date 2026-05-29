import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import { asPosition } from '@/lib/team-member';
import type {
  PlayerPosition,
  TeamStatsAnalytics,
  TeamStatsLeader,
  TeamStatsPlayerRow,
  TeamStatsPointsShare,
  TeamStatsPositionContribution,
  TeamStatsResponse,
  TeamStatsSummary,
  TeamStatsTopCombination,
  TeamStatsType,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Общая командная статистика и аналитика. Один запрос — все агрегаты;
// фильтр type=game|training переключает источник данных (на фронте — сегмент
// «Игры / Тренировки», глобальный для обеих вкладок).
export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const teamId = await getUserTeamId(user.id, req);
    if (!teamId) {
      return NextResponse.json({ error: 'Команды нет' }, { status: 404 });
    }

    const url = new URL(req.url);
    const type: TeamStatsType = url.searchParams.get('type') === 'training' ? 'training' : 'game';

    // 1. События нужного типа: только завершённые. Статистика и аналитика
    // принципиально работают на закрытых событиях, поэтому finalize-«дозревание»
    // тут не нужно — оно отрабатывает на расписании и в детальной карточке.
    // Не закрытые события сюда не попадают, а значит лишнего UPDATE при заходе
    // в /squad/stats нет.
    const { data: eventRows, error: evErr } = await sb
      .from('events')
      .select('id, outcome')
      .eq('team_id', teamId)
      .eq('type', type)
      .eq('status', 'completed');
    if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 });
    const events = eventRows ?? [];
    const eventIds = events.map((e) => e.id);

    // 2. Состав команды + профили.
    const { data: memberRows, error: memErr } = await sb
      .from('team_memberships')
      .select('user_id, jersey_number, position')
      .eq('team_id', teamId);
    if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });
    const members = memberRows ?? [];
    const memberIds = members.map((m) => m.user_id);
    const memberMap = new Map(members.map((m) => [m.user_id, m]));

    const { data: userRows, error: userErr } = memberIds.length
      ? await sb
          .from('users')
          .select('id, first_name, last_name, photo_url, avatar_url')
          .in('id', memberIds)
      : { data: [] as Array<{
          id: string;
          first_name: string | null;
          last_name: string | null;
          photo_url: string | null;
          avatar_url: string | null;
        }>, error: null };
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });
    const userMap = new Map((userRows ?? []).map((u) => [u.id, u]));

    // 3. Result points для этих событий + связи передача→гол.
    const { data: pointRows, error: ptsErr } = eventIds.length
      ? await sb
          .from('result_points')
          .select('id, event_id, user_id, type, team_side')
          .in('event_id', eventIds)
      : { data: [], error: null };
    if (ptsErr) return NextResponse.json({ error: ptsErr.message }, { status: 500 });
    const points = pointRows ?? [];

    const pointById = new Map(points.map((p) => [p.id, p]));
    const goalPointIds = points.filter((p) => p.type === 'goal').map((p) => p.id);
    const { data: linkRows, error: linkErr } = goalPointIds.length
      ? await sb
          .from('result_point_links')
          .select('assist_point_id, goal_point_id')
          .in('goal_point_id', goalPointIds)
      : { data: [], error: null };
    if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 });
    const links = linkRows ?? [];

    // 4. Штрафы.
    const { data: penaltyRows, error: penErr } = eventIds.length
      ? await sb
          .from('event_penalties')
          .select('event_id, player_user_id, minutes')
          .in('event_id', eventIds)
      : { data: [], error: null };
    if (penErr) return NextResponse.json({ error: penErr.message }, { status: 500 });
    const penalties = penaltyRows ?? [];

    // 5. Явка по факту — для эффективности (очки/событие).
    const { data: attRows, error: attErr } = eventIds.length
      ? await sb
          .from('event_attendances')
          .select('event_id, user_id, showed_up')
          .in('event_id', eventIds)
          .eq('showed_up', true)
      : { data: [], error: null };
    if (attErr) return NextResponse.json({ error: attErr.message }, { status: 500 });
    const showedCount = new Map<string, number>();
    for (const a of attRows ?? []) {
      showedCount.set(a.user_id, (showedCount.get(a.user_id) ?? 0) + 1);
    }

    const isGame = type === 'game';
    // Для игр командные голы — только наши (team_side='own'); для тренировок учитываем обе стороны.
    const isOurSide = (side: string): boolean => (isGame ? side === 'own' : true);

    // Командные агрегаты.
    let teamGoals = 0;
    let teamAssists = 0;
    for (const p of points) {
      if (!isOurSide(p.team_side)) continue;
      if (p.type === 'goal') teamGoals += 1;
      else if (p.type === 'assist') teamAssists += 1;
    }
    const wins = isGame ? events.filter((e) => e.outcome === 'win').length : null;

    const summary: TeamStatsSummary = {
      events_played: events.length,
      wins,
      goals: teamGoals,
      assists: teamAssists,
    };

    // Подсчёт по игрокам.
    type Tally = { goals: number; assists: number; penalty: number };
    const tallies = new Map<string, Tally>();
    const tallyOf = (uid: string): Tally => {
      let t = tallies.get(uid);
      if (!t) {
        t = { goals: 0, assists: 0, penalty: 0 };
        tallies.set(uid, t);
      }
      return t;
    };
    for (const p of points) {
      if (!p.user_id) continue;
      if (!isOurSide(p.team_side)) continue;
      if (!memberMap.has(p.user_id)) continue;
      if (p.type === 'goal') tallyOf(p.user_id).goals += 1;
      else if (p.type === 'assist') tallyOf(p.user_id).assists += 1;
    }
    for (const p of penalties) {
      if (!p.player_user_id) continue;
      if (!memberMap.has(p.player_user_id)) continue;
      tallyOf(p.player_user_id).penalty += p.minutes;
    }

    const players: TeamStatsPlayerRow[] = members.map((m) => {
      const u = userMap.get(m.user_id);
      const t = tallies.get(m.user_id) ?? { goals: 0, assists: 0, penalty: 0 };
      return {
        user_id: m.user_id,
        first_name: u?.first_name ?? null,
        last_name: u?.last_name ?? null,
        photo_url: u?.photo_url ?? null,
        avatar_url: u?.avatar_url ?? null,
        jersey_number: m.jersey_number ?? null,
        position: asPosition(m.position),
        goals: t.goals,
        assists: t.assists,
        points: t.goals + t.assists,
        penalty_minutes: t.penalty,
        games_played: showedCount.get(m.user_id) ?? 0,
      };
    });

    // Лидер по показателю > 0; равные значения — первый по сортировке.
    const leader = (
      pick: (p: TeamStatsPlayerRow) => number,
    ): TeamStatsLeader | null => {
      let best: TeamStatsPlayerRow | null = null;
      let bestVal = 0;
      for (const p of players) {
        const v = pick(p);
        if (v > bestVal) {
          bestVal = v;
          best = p;
        }
      }
      return best ? leaderFromPlayer(best, bestVal) : null;
    };

    const totalPoints = players.reduce((s, p) => s + p.points, 0);

    const topByPoints = [...players]
      .filter((p) => p.points > 0)
      .sort((a, b) => b.points - a.points);
    const top3Points = topByPoints.slice(0, 3);
    const top3PointsSum = top3Points.reduce((s, p) => s + p.points, 0);
    const points_distribution: TeamStatsPointsShare[] = [
      ...top3Points.map((p) => ({
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        points: p.points,
      })),
      ...(totalPoints - top3PointsSum > 0
        ? [{
            user_id: null,
            first_name: null,
            last_name: null,
            points: totalPoints - top3PointsSum,
          }]
        : []),
    ];

    const top_efficiency: TeamStatsLeader[] = players
      .filter((p) => p.games_played > 0)
      .map((p) => leaderFromPlayer(p, p.points / p.games_played))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    const top_penalties: TeamStatsLeader[] = players
      .filter((p) => p.penalty_minutes > 0)
      .map((p) => leaderFromPlayer(p, p.penalty_minutes))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    const POSITIONS: PlayerPosition[] = ['forward', 'defender', 'goalie'];
    const by_position: TeamStatsPositionContribution[] = POSITIONS.map((pos) => {
      let g = 0;
      let a = 0;
      for (const p of players) {
        if (p.position !== pos) continue;
        g += p.goals;
        a += p.assists;
      }
      return { position: pos, goals: g, assists: a };
    });

    // Топ связок: пара (assist_user → goal_user) с количеством голов в паре.
    const comboCount = new Map<string, number>();
    for (const link of links) {
      const goalPt = pointById.get(link.goal_point_id);
      const assistPt = pointById.get(link.assist_point_id);
      if (!goalPt || !assistPt) continue;
      if (!goalPt.user_id || !assistPt.user_id) continue;
      if (!memberMap.has(goalPt.user_id) || !memberMap.has(assistPt.user_id)) continue;
      const key = `${assistPt.user_id}>${goalPt.user_id}`;
      comboCount.set(key, (comboCount.get(key) ?? 0) + 1);
    }
    const playerById = new Map(players.map((p) => [p.user_id, p]));
    const top_combinations: TeamStatsTopCombination[] = [...comboCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => {
        const [assistId, goalId] = key.split('>');
        const a = playerById.get(assistId)!;
        const g = playerById.get(goalId)!;
        return {
          assist_user: leaderFromPlayer(a, count),
          goal_user: leaderFromPlayer(g, count),
          goals: count,
        };
      });

    const analytics: TeamStatsAnalytics = {
      total_points: totalPoints,
      points_distribution,
      total_goals: teamGoals,
      total_assists: teamAssists,
      top_efficiency,
      leaders: {
        points: leader((p) => p.points),
        goals: leader((p) => p.goals),
        assists: leader((p) => p.assists),
        penalties: leader((p) => p.penalty_minutes),
      },
      by_position,
      top_combinations,
      top_penalties,
    };

    const body: TeamStatsResponse = { type, summary, players, analytics };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

function leaderFromPlayer(p: {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  avatar_url: string | null;
  jersey_number: number | null;
  position: PlayerPosition | null;
}, value: number): TeamStatsLeader {
  return {
    user_id: p.user_id,
    first_name: p.first_name,
    last_name: p.last_name,
    photo_url: p.photo_url,
    avatar_url: p.avatar_url,
    jersey_number: p.jersey_number,
    position: p.position,
    value,
  };
}
