import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import { asEventType } from '@/lib/event-enum';
import type { HomeNextEventResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ближайшее предстоящее событие активной команды — для главного экрана `/`
// (v0.6, итерация 62). Узкий endpoint: ровно одна строка (или null), плюс
// counts «N из M идут» и сведения о команде (логотип/имя) для шапки.
//
// «Ближайшее» = первый `events.starts_at > now()` (без `ends_at`-логики:
// для уже идущих событий показ ушёл бы вниз страницы, а здесь нам нужно
// именно «что дальше»). Отменённые исключаются.
export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const teamId = await getUserTeamId(user.id, req);
    if (!teamId) {
      const empty: HomeNextEventResponse = { event: null, team: null };
      return NextResponse.json(empty);
    }

    const sb = supabaseServer();
    const nowIso = new Date().toISOString();

    const [teamRes, eventRes, sizeRes] = await Promise.all([
      sb.from('teams').select('id, name, logo_url').eq('id', teamId).maybeSingle(),
      sb
        .from('events')
        .select(
          'id, type, title, starts_at, opponent_name, cost_per_player, venue:venues(id, name)',
        )
        .eq('team_id', teamId)
        .neq('status', 'cancelled')
        .gt('starts_at', nowIso)
        .order('starts_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
      sb
        .from('team_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId),
    ]);

    if (teamRes.error) {
      return NextResponse.json({ error: teamRes.error.message }, { status: 500 });
    }
    if (eventRes.error) {
      return NextResponse.json({ error: eventRes.error.message }, { status: 500 });
    }
    if (sizeRes.error) {
      return NextResponse.json({ error: sizeRes.error.message }, { status: 500 });
    }

    const team = teamRes.data
      ? { id: teamRes.data.id, name: teamRes.data.name, logo_url: teamRes.data.logo_url }
      : null;

    const ev = eventRes.data;
    if (!ev) {
      const body: HomeNextEventResponse = { event: null, team };
      return NextResponse.json(body);
    }

    let going = 0;
    {
      const { count } = await sb
        .from('event_attendances')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', ev.id)
        .eq('vote', 'going');
      going = count ?? 0;
    }
    const teamSize = sizeRes.count ?? 0;
    // «Места» — количество членов команды, ещё не сказавших «иду».
    // На скрине дизайна: «12 из 16 идут · 4 места».
    const seatsLeft = Math.max(0, teamSize - going);

    const venueRaw = ev.venue as { id: string; name: string } | { id: string; name: string }[] | null;
    const venue = Array.isArray(venueRaw) ? (venueRaw[0] ?? null) : venueRaw;

    const body: HomeNextEventResponse = {
      team,
      event: {
        id: ev.id,
        type: asEventType(ev.type),
        title: ev.title,
        opponent_name: ev.opponent_name ?? null,
        starts_at: ev.starts_at,
        venue: venue ? { id: venue.id, name: venue.name } : null,
        cost_per_player: ev.cost_per_player != null ? Number(ev.cost_per_player) : null,
        going_count: going,
        team_size: teamSize,
        seats_left: seatsLeft,
      },
    };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
