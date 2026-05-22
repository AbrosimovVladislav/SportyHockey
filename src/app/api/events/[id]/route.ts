import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireOrganizer, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventType, effectiveEventStatus } from '@/lib/event-enum';
import { loadAttendance } from '@/lib/event-attendance';
import { asMemberRole } from '@/lib/role';
import { notifyEventCancelled, notifyEventUpdated } from '@/lib/notify';
import type { TablesUpdate } from '@/types/db';
import { asLineSlot } from '@/lib/event-lines';
import type {
  EventAttendee,
  EventDetailDto,
  EventLineEntry,
  EventPaymentSummary,
  EventVenue,
  EventVote,
  PlayerPosition,
  TeamSide,
} from '@/types/api';

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

function asPosition(value: string | null | undefined): PlayerPosition | null {
  if (value === 'forward' || value === 'defender' || value === 'goalie') return value;
  return null;
}

function asTeamSide(value: string | null | undefined): TeamSide | null {
  if (value === 'light' || value === 'dark') return value;
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
  opponent_name: z.string().trim().max(100).nullable().optional(),
  status: z.enum(['scheduled', 'cancelled']).optional(),
  cancelled_reason: z.string().trim().max(200).nullable().optional(),
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
        'id, team_id, type, title, starts_at, ends_at, cost_per_player, arena_cost, opponent_name, status, created_by, cancelled_reason, venue:venues(id, name, address)',
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
      .select(
        'user_id, role, jersey_number, position, users(first_name, last_name, username, photo_url)',
      )
      .eq('team_id', event.team_id);
    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }
    const { data: attRows, error: attErr } = await sb
      .from('event_attendances')
      .select('user_id, vote, showed_up, payment_claim')
      .eq('event_id', event.id);
    if (attErr) {
      return NextResponse.json({ error: attErr.message }, { status: 500 });
    }
    const attByUser = new Map<
      string,
      { vote: EventVote | null; showed_up: boolean | null; payment_claim: boolean }
    >();
    for (const v of attRows ?? []) {
      attByUser.set(v.user_id, {
        vote: asVote(v.vote),
        showed_up: v.showed_up ?? null,
        payment_claim: v.payment_claim ?? false,
      });
    }

    const { data: payRows, error: payErr } = await sb
      .from('finance_transactions')
      .select('user_id, amount')
      .eq('event_id', event.id)
      .eq('type', 'player_payment');
    if (payErr) {
      return NextResponse.json({ error: payErr.message }, { status: 500 });
    }
    const paidByUser = new Map<string, number>();
    for (const p of payRows ?? []) {
      if (p.user_id) paidByUser.set(p.user_id, Number(p.amount));
    }

    const { data: lineupRows, error: lineupErr } = await sb
      .from('event_lineups')
      .select('user_id, team_side')
      .eq('event_id', event.id);
    if (lineupErr) {
      return NextResponse.json({ error: lineupErr.message }, { status: 500 });
    }
    const lineupByUser = new Map<string, TeamSide>();
    for (const r of lineupRows ?? []) {
      const side = asTeamSide(r.team_side);
      if (side) lineupByUser.set(r.user_id, side);
    }

    const { data: lineRows, error: lineErr } = await sb
      .from('event_lines')
      .select('team_side, slot, user_id')
      .eq('event_id', event.id);
    if (lineErr) {
      return NextResponse.json({ error: lineErr.message }, { status: 500 });
    }

    const { count: mediaCount, error: mediaErr } = await sb
      .from('media_items')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id);
    if (mediaErr) {
      return NextResponse.json({ error: mediaErr.message }, { status: 500 });
    }
    const lines: EventLineEntry[] = [];
    for (const r of lineRows ?? []) {
      const side = asTeamSide(r.team_side);
      const slot = asLineSlot(r.slot);
      if (side && slot) lines.push({ team_side: side, slot, user_id: r.user_id });
    }

    const attendees: EventAttendee[] = (members ?? []).map((m) => {
      const u = Array.isArray(m.users) ? m.users[0] : m.users;
      const att = attByUser.get(m.user_id);
      return {
        user_id: m.user_id,
        first_name: u?.first_name ?? null,
        last_name: u?.last_name ?? null,
        username: u?.username ?? null,
        photo_url: u?.photo_url ?? null,
        role: asMemberRole(m.role),
        vote: att?.vote ?? null,
        jersey_number: m.jersey_number ?? null,
        position: asPosition(m.position),
        showed_up: att?.showed_up ?? null,
        paid_amount: paidByUser.get(m.user_id) ?? null,
        payment_claim: att?.payment_claim ?? false,
        team_side: lineupByUser.get(m.user_id) ?? null,
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

    const costPerPlayer =
      event.cost_per_player != null ? Number(event.cost_per_player) : null;
    const arenaCost = event.arena_cost != null ? Number(event.arena_cost) : null;
    // В «финансовый ростер» попадают: голосовавшие going, реально пришедшие (showed_up=true),
    // а также все, кто внёс деньги — даже если не записывался.
    const roster = attendees.filter(
      (a) => a.vote === 'going' || a.showed_up === true || (a.paid_amount ?? 0) > 0,
    );
    let paid_count = 0;
    let partial_count = 0;
    let debt_count = 0;
    let collected = 0;
    for (const a of roster) {
      const amount = a.paid_amount ?? 0;
      collected += amount;
      if (costPerPlayer == null || costPerPlayer === 0) {
        if (amount > 0) paid_count += 1;
        else debt_count += 1;
      } else if (amount >= costPerPlayer) {
        paid_count += 1;
      } else if (amount > 0) {
        partial_count += 1;
      } else {
        debt_count += 1;
      }
    }
    const target = arenaCost ?? 0;
    const payments: EventPaymentSummary = {
      paid_count,
      partial_count,
      debt_count,
      collected,
      target,
    };

    const dto: EventDetailDto = {
      id: event.id,
      team_id: event.team_id,
      type: asEventType(event.type),
      title: event.title,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      venue: pickVenue(event.venue as VenueRow | VenueRow[] | null),
      cost_per_player: event.cost_per_player != null ? Number(event.cost_per_player) : null,
      arena_cost: event.arena_cost != null ? Number(event.arena_cost) : null,
      opponent_name: event.opponent_name ?? null,
      status: effectiveEventStatus(event.status, event.ends_at),
      created_by: event.created_by,
      attendance: attendanceMap.get(event.id) ?? { going: 0, maybe: 0, not_going: 0 },
      team_size: attendees.length,
      attendees,
      payments,
      lines,
      media_count: mediaCount ?? 0,
      cancelled_reason: event.cancelled_reason ?? null,
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
    if (d.opponent_name !== undefined) {
      patch.opponent_name = d.opponent_name && d.opponent_name.length > 0 ? d.opponent_name : null;
    }
    if (d.status !== undefined) {
      patch.status = d.status;
      // Возврат в scheduled очищает причину отмены.
      if (d.status === 'scheduled') patch.cancelled_reason = null;
    }
    if (d.status === 'cancelled' && d.cancelled_reason !== undefined) {
      patch.cancelled_reason =
        d.cancelled_reason && d.cancelled_reason.length > 0 ? d.cancelled_reason : null;
    }

    if (d.venue_id !== undefined) {
      const { data: venue } = await sb
        .from('venues')
        .select('id')
        .eq('id', d.venue_id)
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
