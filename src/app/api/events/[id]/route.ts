import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireOrganizer, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventStatus, asEventType } from '@/lib/event-enum';
import { loadAttendance } from '@/lib/event-attendance';
import { asMemberRole } from '@/lib/role';
import { notifyEventCancelled, notifyEventUpdated } from '@/lib/notify';
import type { TablesUpdate } from '@/types/db';
import type { EventAttendee, EventDetailDto, EventVenue, EventVote } from '@/types/api';

const VOTE_ORDER: Record<string, number> = {
  going: 0,
  maybe: 1,
  not_going: 2,
  null: 3,
};

function asVote(value: string | null | undefined): EventVote | null {
  if (value === 'going' || value === 'maybe' || value === 'not_going') return value;
  return null;
}

type VenueRow = Pick<EventVenue, 'id' | 'name' | 'address'>;

function pickVenue(raw: VenueRow | VenueRow[] | null | undefined): EventVenue | null {
  if (!raw) return null;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  return { id: v.id, name: v.name, address: v.address ?? null };
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UpdateBody = z.object({
  type: z.enum(['training', 'game']).optional(),
  starts_at: z.string().datetime({ offset: true }).optional(),
  duration_minutes: z.number().int().positive().max(720).optional(),
  venue_id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(100).nullable().optional(),
  cost_per_player: z.number().nonnegative().nullable().optional(),
  arena_cost: z.number().nonnegative().nullable().optional(),
  status: z.enum(['scheduled', 'cancelled']).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params): Promise<Response> {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const sb = supabaseServer();

    const { data: event, error } = await sb
      .from('events')
      .select(
        'id, team_id, type, title, starts_at, ends_at, venue_text, cost_per_player, arena_cost, status, description, created_by, venue:venues(id, name, address)',
      )
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

    const attendanceMap = await loadAttendance(sb, [event.id]);

    const { data: members, error: memErr } = await sb
      .from('team_memberships')
      .select('user_id, role, users(first_name, last_name, username, photo_url)')
      .eq('team_id', event.team_id);
    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }
    const { data: votes, error: voteErr } = await sb
      .from('event_attendances')
      .select('user_id, vote')
      .eq('event_id', event.id);
    if (voteErr) {
      return NextResponse.json({ error: voteErr.message }, { status: 500 });
    }
    const voteByUser = new Map<string, EventVote | null>();
    for (const v of votes ?? []) voteByUser.set(v.user_id, asVote(v.vote));

    const attendees: EventAttendee[] = (members ?? []).map((m) => {
      const u = Array.isArray(m.users) ? m.users[0] : m.users;
      return {
        user_id: m.user_id,
        first_name: u?.first_name ?? null,
        last_name: u?.last_name ?? null,
        username: u?.username ?? null,
        photo_url: u?.photo_url ?? null,
        role: asMemberRole(m.role),
        vote: voteByUser.get(m.user_id) ?? null,
      };
    });
    attendees.sort((a, b) => {
      const av = VOTE_ORDER[a.vote ?? 'null'];
      const bv = VOTE_ORDER[b.vote ?? 'null'];
      if (av !== bv) return av - bv;
      const an = `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim();
      const bn = `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim();
      return an.localeCompare(bn, 'ru');
    });

    const dto: EventDetailDto = {
      id: event.id,
      team_id: event.team_id,
      type: asEventType(event.type),
      title: event.title,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      venue: pickVenue(event.venue as VenueRow | VenueRow[] | null),
      venue_text: event.venue_text,
      cost_per_player: event.cost_per_player != null ? Number(event.cost_per_player) : null,
      arena_cost: event.arena_cost != null ? Number(event.arena_cost) : null,
      status: asEventStatus(event.status),
      description: event.description,
      created_by: event.created_by,
      attendance: attendanceMap.get(event.id) ?? { going: 0, maybe: 0, not_going: 0 },
      team_size: attendees.length,
      attendees,
    };
    return NextResponse.json(dto);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  try {
    const ctx = await requireOrganizer(req);
    const { id } = await params;
    const json = await req.json().catch(() => null);
    const parsed = UpdateBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные события' }, { status: 400 });
    }

    const sb = supabaseServer();
    const { data: existing, error: existingErr } = await sb
      .from('events')
      .select('id, team_id, status, starts_at')
      .eq('id', id)
      .maybeSingle();
    if (existingErr) {
      return NextResponse.json({ error: existingErr.message }, { status: 500 });
    }
    if (!existing || existing.team_id !== ctx.team_id) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    const d = parsed.data;
    const patch: TablesUpdate<'events'> = {};

    if (d.type !== undefined) patch.type = d.type;
    if (d.title !== undefined) patch.title = d.title;
    if (d.cost_per_player !== undefined) patch.cost_per_player = d.cost_per_player;
    if (d.arena_cost !== undefined) patch.arena_cost = d.arena_cost;
    if (d.status !== undefined) patch.status = d.status;

    if (d.venue_id !== undefined) {
      const { data: venue } = await sb
        .from('venues')
        .select('id')
        .eq('id', d.venue_id)
        .eq('team_id', ctx.team_id)
        .maybeSingle();
      if (!venue) {
        return NextResponse.json({ error: 'Площадка не найдена' }, { status: 404 });
      }
      patch.venue_id = venue.id;
    }

    if (d.starts_at !== undefined || d.duration_minutes !== undefined) {
      const startsIso = d.starts_at ?? existing.starts_at;
      patch.starts_at = startsIso;
      if (d.duration_minutes !== undefined) {
        const startsDate = new Date(startsIso);
        const endsDate = new Date(startsDate.getTime() + d.duration_minutes * 60_000);
        patch.ends_at = endsDate.toISOString();
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: true });
    }

    const { error: updErr } = await sb
      .from('events')
      .update(patch)
      .eq('id', id)
      .eq('team_id', ctx.team_id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    const becameCancelled = d.status === 'cancelled' && existing.status !== 'cancelled';
    const stillCancelled = d.status === 'cancelled' && existing.status === 'cancelled';
    if (becameCancelled) {
      await notifyEventCancelled(id);
    } else if (!stillCancelled) {
      await notifyEventUpdated(id);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
