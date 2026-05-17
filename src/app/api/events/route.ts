import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireOrganizer, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventStatus, asEventType } from '@/lib/event-enum';
import { loadAttendance } from '@/lib/event-attendance';
import { getUserTeamId } from '@/lib/user-team';
import { notifyEventCreated } from '@/lib/notify';
import type {
  CreateEventResponse,
  EventDto,
  EventsListResponse,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateBody = z.object({
  type: z.enum(['training', 'game']),
  starts_at: z.string().datetime({ offset: true }),
  title: z.string().trim().min(1).max(100).optional(),
  ends_at: z.string().datetime({ offset: true }).nullable().optional(),
  venue_text: z.string().trim().min(1).max(200).optional(),
  cost_per_player: z.number().nonnegative().optional(),
  description: z.string().trim().max(2000).optional(),
});

export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const teamId = await getUserTeamId(user.id);
    if (!teamId) {
      const empty: EventsListResponse = { team_size: 0, events: [] };
      return NextResponse.json(empty);
    }

    const sb = supabaseServer();
    const [{ data: rows, error }, { count: teamSize, error: countError }] = await Promise.all([
      sb
        .from('events')
        .select('id, type, title, starts_at, ends_at, venue_text, cost_per_player, status')
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

    const ids = (rows ?? []).map((r) => r.id);
    const attendanceMap = await loadAttendance(sb, ids);

    const events: EventDto[] = (rows ?? []).map((r) => ({
      id: r.id,
      type: asEventType(r.type),
      title: r.title,
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      venue_text: r.venue_text,
      cost_per_player: r.cost_per_player != null ? Number(r.cost_per_player) : null,
      status: asEventStatus(r.status),
      attendance: attendanceMap.get(r.id) ?? { going: 0, maybe: 0, not_going: 0 },
    }));

    const body: EventsListResponse = { team_size: teamSize ?? 0, events };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
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
    const { data, error } = await sb
      .from('events')
      .insert({
        team_id: ctx.team_id,
        created_by: ctx.id,
        type: parsed.data.type,
        starts_at: parsed.data.starts_at,
        title: parsed.data.title ?? null,
        ends_at: parsed.data.ends_at ?? null,
        venue_text: parsed.data.venue_text ?? null,
        cost_per_player: parsed.data.cost_per_player ?? null,
        description: parsed.data.description ?? null,
      })
      .select('id')
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'Не удалось создать событие' },
        { status: 500 },
      );
    }

    await notifyEventCreated(data.id);

    const body: CreateEventResponse = { id: data.id };
    return NextResponse.json(body, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
