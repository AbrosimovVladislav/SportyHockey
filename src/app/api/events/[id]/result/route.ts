import { NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventType } from '@/lib/event-enum';
import {
  asResultSide,
  isOwnSideForStats,
  sidesForEventType,
} from '@/lib/event-result';
import type {
  EventResultDto,
  GoalDto,
  GoalParticipant,
  PenaltyDto,
  PlayerPosition,
  PlayerResultStats,
  ResultSide,
} from '@/types/api';

function asPosition(value: string | null | undefined): PlayerPosition | null {
  if (value === 'forward' || value === 'defender' || value === 'goalie') return value;
  return null;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

type ParticipantMap = Map<string, GoalParticipant>;

export async function GET(req: Request, { params }: Params): Promise<Response> {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const sb = supabaseServer();

    const { data: event, error } = await sb
      .from('events')
      .select('id, team_id, type, opponent_name, team:teams(id, name)')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!event) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    const { data: mem } = await sb
      .from('team_memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('team_id', event.team_id)
      .maybeSingle();
    if (!mem) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    const isGame = asEventType(event.type) === 'game';

    const { data: members, error: memErr } = await sb
      .from('team_memberships')
      .select(
        'user_id, jersey_number, position, users(first_name, last_name, username, photo_url, avatar_url)',
      )
      .eq('team_id', event.team_id);
    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }
    const participants: ParticipantMap = new Map();
    for (const m of members ?? []) {
      const u = Array.isArray(m.users) ? m.users[0] : m.users;
      participants.set(m.user_id, {
        user_id: m.user_id,
        first_name: u?.first_name ?? null,
        last_name: u?.last_name ?? null,
        username: u?.username ?? null,
        photo_url: u?.avatar_url ?? u?.photo_url ?? null,
        jersey_number: m.jersey_number ?? null,
        position: asPosition(m.position),
      });
    }

    const { data: goalRows, error: goalErr } = await sb
      .from('result_points')
      .select('id, team_side, user_id, time_seconds, created_at')
      .eq('event_id', event.id)
      .eq('type', 'goal')
      .order('created_at', { ascending: true });
    if (goalErr) {
      return NextResponse.json({ error: goalErr.message }, { status: 500 });
    }

    const goalIds = (goalRows ?? []).map((g) => g.id);
    const assistsByGoal = new Map<string, { user_id: string; assist_order: number }[]>();
    if (goalIds.length > 0) {
      const { data: linkRows, error: linkErr } = await sb
        .from('result_point_links')
        .select('goal_point_id, assist_point_id, assist_order')
        .in('goal_point_id', goalIds);
      if (linkErr) {
        return NextResponse.json({ error: linkErr.message }, { status: 500 });
      }
      const assistPointIds = (linkRows ?? []).map((l) => l.assist_point_id);
      const userByPoint = new Map<string, string | null>();
      if (assistPointIds.length > 0) {
        const { data: assistPoints, error: apErr } = await sb
          .from('result_points')
          .select('id, user_id')
          .in('id', assistPointIds);
        if (apErr) {
          return NextResponse.json({ error: apErr.message }, { status: 500 });
        }
        for (const ap of assistPoints ?? []) userByPoint.set(ap.id, ap.user_id);
      }
      for (const l of linkRows ?? []) {
        const uid = userByPoint.get(l.assist_point_id);
        if (!uid) continue;
        const list = assistsByGoal.get(l.goal_point_id) ?? [];
        list.push({ user_id: uid, assist_order: l.assist_order });
        assistsByGoal.set(l.goal_point_id, list);
      }
    }

    const { data: penaltyRows, error: penaltyErr } = await sb
      .from('event_penalties')
      .select('id, team_side, player_user_id, minutes, time_seconds, created_at')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true });
    if (penaltyErr) {
      return NextResponse.json({ error: penaltyErr.message }, { status: 500 });
    }

    const goals: GoalDto[] = [];
    let scoreA = 0;
    let scoreB = 0;
    const { side_a, side_b } = sidesForEventType(isGame);

    const playerStats = new Map<string, { goals: number; assists: number; pim: number }>();
    const ensure = (uid: string) => {
      if (!playerStats.has(uid)) playerStats.set(uid, { goals: 0, assists: 0, pim: 0 });
      return playerStats.get(uid)!;
    };

    for (const g of goalRows ?? []) {
      const side = asResultSide(g.team_side);
      if (!side) continue;
      if (side === side_a) scoreA += 1;
      else if (side === side_b) scoreB += 1;

      const assistsRaw = (assistsByGoal.get(g.id) ?? []).sort(
        (x, y) => x.assist_order - y.assist_order,
      );
      const assists: GoalParticipant[] = [];
      for (const a of assistsRaw) {
        const p = participants.get(a.user_id);
        if (p) assists.push(p);
      }

      const scorer = g.user_id ? (participants.get(g.user_id) ?? null) : null;
      goals.push({
        id: g.id,
        team_side: side,
        scorer,
        assists,
        time_seconds: g.time_seconds ?? null,
        created_at: g.created_at,
      });

      if (isOwnSideForStats(side, isGame)) {
        if (g.user_id && participants.has(g.user_id)) {
          ensure(g.user_id).goals += 1;
        }
        for (const a of assistsRaw) {
          if (participants.has(a.user_id)) {
            ensure(a.user_id).assists += 1;
          }
        }
      }
    }

    const penalties: PenaltyDto[] = [];
    for (const p of penaltyRows ?? []) {
      const side = asResultSide(p.team_side);
      if (!side) continue;
      const player = p.player_user_id ? (participants.get(p.player_user_id) ?? null) : null;
      penalties.push({
        id: p.id,
        team_side: side,
        player,
        minutes: p.minutes,
        time_seconds: p.time_seconds ?? null,
        created_at: p.created_at,
      });
      if (
        isOwnSideForStats(side, isGame) &&
        p.player_user_id &&
        participants.has(p.player_user_id)
      ) {
        ensure(p.player_user_id).pim += p.minutes;
      }
    }

    const stats: PlayerResultStats[] = [];
    for (const [uid, s] of playerStats) {
      const user = participants.get(uid);
      if (!user) continue;
      const points = s.goals + s.assists;
      if (points === 0 && s.pim === 0) continue;
      stats.push({
        user,
        goals: s.goals,
        assists: s.assists,
        points,
        penalty_minutes: s.pim,
      });
    }
    stats.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goals !== b.goals) return b.goals - a.goals;
      if (a.penalty_minutes !== b.penalty_minutes) return b.penalty_minutes - a.penalty_minutes;
      const an = `${a.user.first_name ?? ''} ${a.user.last_name ?? ''}`.trim();
      const bn = `${b.user.first_name ?? ''} ${b.user.last_name ?? ''}`.trim();
      return an.localeCompare(bn, 'ru');
    });

    const ownTeam = Array.isArray(event.team) ? event.team[0] : event.team;
    const dto: EventResultDto = {
      event_id: event.id,
      is_game: isGame,
      own_team_name: ownTeam?.name ?? '',
      opponent_name: event.opponent_name ?? null,
      score: { side_a, side_b, score_a: scoreA, score_b: scoreB },
      goals,
      penalties,
      stats,
    };
    return NextResponse.json(dto satisfies EventResultDto & { score: { side_a: ResultSide } });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
