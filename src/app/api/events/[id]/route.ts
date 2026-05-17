import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireOrganizer, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventStatus, asEventType } from '@/lib/event-enum';
import { loadAttendance } from '@/lib/event-attendance';
import { notifyEventCancelled, notifyEventUpdated } from '@/lib/notify';
import type { TablesUpdate } from '@/types/db';
import type { EventDetailDto } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UpdateBody = z.object({
  type: z.enum(['training', 'game']).optional(),
  starts_at: z.string().datetime({ offset: true }).optional(),
  title: z.string().trim().min(1).max(100).optional(),
  ends_at: z.string().datetime({ offset: true }).nullable().optional(),
  venue_text: z.string().trim().min(1).max(200).optional(),
  cost_per_player: z.number().nonnegative().optional(),
  description: z.string().trim().max(2000).optional(),
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
        'id, team_id, type, title, starts_at, ends_at, venue_text, cost_per_player, status, description, created_by',
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

    const dto: EventDetailDto = {
      id: event.id,
      team_id: event.team_id,
      type: asEventType(event.type),
      title: event.title,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      venue_text: event.venue_text,
      cost_per_player: event.cost_per_player != null ? Number(event.cost_per_player) : null,
      status: asEventStatus(event.status),
      description: event.description,
      created_by: event.created_by,
      attendance: attendanceMap.get(event.id) ?? { going: 0, maybe: 0, not_going: 0 },
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
      .select('id, team_id, status')
      .eq('id', id)
      .maybeSingle();
    if (existingErr) {
      return NextResponse.json({ error: existingErr.message }, { status: 500 });
    }
    if (!existing || existing.team_id !== ctx.team_id) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    const patch: TablesUpdate<'events'> = {};
    const d = parsed.data;
    if (d.type !== undefined) patch.type = d.type;
    if (d.starts_at !== undefined) patch.starts_at = d.starts_at;
    if (d.title !== undefined) patch.title = d.title;
    if (d.ends_at !== undefined) patch.ends_at = d.ends_at;
    if (d.venue_text !== undefined) patch.venue_text = d.venue_text;
    if (d.cost_per_player !== undefined) patch.cost_per_player = d.cost_per_player;
    if (d.description !== undefined) patch.description = d.description;
    if (d.status !== undefined) patch.status = d.status;

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
