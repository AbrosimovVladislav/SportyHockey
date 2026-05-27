import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  user_id: z.string().uuid(),
  team_side: z.enum(['light', 'dark']).nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params): Promise<Response> {
  try {
    const ctx = await requireOrganizer(req);
    const { id: eventId } = await params;
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные состава' }, { status: 400 });
    }

    const sb = supabaseServer();

    const { data: event, error: evErr } = await sb
      .from('events')
      .select('id, team_id')
      .eq('id', eventId)
      .maybeSingle();
    if (evErr) {
      return NextResponse.json({ error: evErr.message }, { status: 500 });
    }
    if (!event || event.team_id !== ctx.team_id) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    const { data: mem } = await sb
      .from('team_memberships')
      .select('id')
      .eq('user_id', parsed.data.user_id)
      .eq('team_id', event.team_id)
      .maybeSingle();
    if (!mem) {
      return NextResponse.json({ error: 'Игрок не в команде' }, { status: 404 });
    }

    const { data: prev } = await sb
      .from('event_lineups')
      .select('team_side')
      .eq('event_id', event.id)
      .eq('user_id', parsed.data.user_id)
      .maybeSingle();
    const previousSide = prev?.team_side ?? null;

    if (parsed.data.team_side === null) {
      const { error: delErr } = await sb
        .from('event_lineups')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', parsed.data.user_id);
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
      const { error: delLinesErr } = await sb
        .from('event_lines')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', parsed.data.user_id);
      if (delLinesErr) {
        return NextResponse.json({ error: delLinesErr.message }, { status: 500 });
      }
    } else {
      const { error: upErr } = await sb
        .from('event_lineups')
        .upsert(
          {
            event_id: event.id,
            user_id: parsed.data.user_id,
            team_side: parsed.data.team_side,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'event_id,user_id' },
        );
      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
      if (previousSide && previousSide !== parsed.data.team_side) {
        const { error: delLinesErr } = await sb
          .from('event_lines')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', parsed.data.user_id)
          .eq('team_side', previousSide);
        if (delLinesErr) {
          return NextResponse.json({ error: delLinesErr.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
