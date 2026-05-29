import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrganizer, requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventStatus, asEventType } from '@/lib/event-enum';
import { finalizeRows } from '@/lib/event-finalize';
import { loadAttendance } from '@/lib/event-attendance';
import { getUserTeamId } from '@/lib/user-team';
import { notifyEventCreated } from '@/lib/notify';
import { buildEventTitle } from '@/lib/event-title';
import { applyDefaultLineup } from '@/lib/apply-default-lineup';
import type {
  CreateEventResponse,
  EventDto,
  EventVenue,
  EventsListResponse,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateBody = z.object({
  type: z.enum(['training', 'game']),
  starts_at: z.string().datetime({ offset: true }),
  duration_minutes: z.number().int().positive().max(720),
  venue_id: z.string().uuid(),
  details: z.string().trim().min(1).max(1000).optional(),
  cost_per_player: z.number().nonnegative().optional(),
  arena_cost: z.number().nonnegative().optional(),
  opponent_name: z.string().trim().min(1).max(100).optional(),
});

type VenueRow = Pick<EventVenue, 'id' | 'name' | 'address' | 'photo_url'>;

function pickVenue(raw: VenueRow | VenueRow[] | null | undefined): EventVenue | null {
  if (!raw) return null;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  return { id: v.id, name: v.name, address: v.address ?? null, photo_url: v.photo_url ?? null };
}

export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const teamId = await getUserTeamId(user.id, req);
    if (!teamId) {
      const empty: EventsListResponse = { team_size: 0, events: [] };
      return NextResponse.json(empty);
    }

    const sb = supabaseServer();
    const [{ data: rows, error }, { count: teamSize, error: countError }] = await Promise.all([
      sb
        .from('events')
        .select(
          'id, type, title, starts_at, ends_at, cost_per_player, arena_cost, opponent_name, status, venue:venues(id, name, address, photo_url)',
        )
        .eq('team_id', teamId)
        .neq('status', 'cancelled')
        .order('starts_at', { ascending: true }),
      sb
        .from('team_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId),
    ]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Доводим хранимый status до реального состояния: scheduled→completed,
    // если время окончания прошло (и обратно при reschedule в будущее). UPDATE
    // отправляется только при наличии расхождений, холостых запросов нет.
    const finalized = await finalizeRows(sb, rows ?? []);

    const ids = finalized.map((r) => r.id);
    const attendanceMap = await loadAttendance(sb, ids);

    const events: EventDto[] = finalized.map((r) => ({
      id: r.id,
      type: asEventType(r.type),
      title: r.title,
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      venue: pickVenue(r.venue as VenueRow | VenueRow[] | null),
      cost_per_player: r.cost_per_player != null ? Number(r.cost_per_player) : null,
      arena_cost: r.arena_cost != null ? Number(r.arena_cost) : null,
      opponent_name: r.opponent_name ?? null,
      status: asEventStatus(r.status),
      attendance: attendanceMap.get(r.id) ?? { going: 0, not_going: 0 },
    }));

    const body: EventsListResponse = { team_size: teamSize ?? 0, events };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const ctx = await requireOrganizer(req);
    const json = await req.json().catch(() => null);
    const parsed = CreateBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные события' }, { status: 400 });
    }

    const sb = supabaseServer();

    const { data: venue, error: venueErr } = await sb
      .from('venues')
      .select('id, default_cost_per_player, cost_per_arena')
      .eq('id', parsed.data.venue_id)
      .maybeSingle();
    if (venueErr) {
      return NextResponse.json({ error: venueErr.message }, { status: 500 });
    }
    if (!venue) {
      return NextResponse.json({ error: 'Площадка не найдена' }, { status: 404 });
    }

    // Название игры строится из имени команды + соперника; для тренировки имя не нужно.
    let teamName = '';
    if (parsed.data.type === 'game') {
      const { data: team, error: teamErr } = await sb
        .from('teams')
        .select('name')
        .eq('id', ctx.team_id)
        .maybeSingle();
      if (teamErr) {
        return NextResponse.json({ error: teamErr.message }, { status: 500 });
      }
      teamName = team?.name ?? '';
    }
    const opponentName =
      parsed.data.type === 'game' ? parsed.data.opponent_name ?? null : null;

    const startsAt = new Date(parsed.data.starts_at);
    const endsAt = new Date(startsAt.getTime() + parsed.data.duration_minutes * 60_000);
    const cost =
      parsed.data.cost_per_player !== undefined
        ? parsed.data.cost_per_player
        : venue.default_cost_per_player != null
          ? Number(venue.default_cost_per_player)
          : null;
    const arenaCost =
      parsed.data.arena_cost !== undefined
        ? parsed.data.arena_cost
        : venue.cost_per_arena != null
          ? Number(venue.cost_per_arena)
          : null;

    const { data, error } = await sb
      .from('events')
      .insert({
        team_id: ctx.team_id,
        created_by: ctx.id,
        type: parsed.data.type,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        venue_id: venue.id,
        title: buildEventTitle(parsed.data.type, teamName, opponentName),
        details: parsed.data.details ?? null,
        cost_per_player: cost,
        arena_cost: arenaCost,
        opponent_name: opponentName,
      })
      .select('id')
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Не удалось создать событие' },
        { status: 500 },
      );
    }

    // Прокидываем дефолтную раскидку команды (звенья + стороны для тренировки).
    await applyDefaultLineup(data.id, parsed.data.type, ctx.team_id);

    await notifyEventCreated(data.id);

    const body: CreateEventResponse = { id: data.id };
    return NextResponse.json(body, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
