import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type { VoteResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  event_id: z.string().uuid(),
  vote: z.enum(['going', 'not_going']).nullable(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные голоса' }, { status: 400 });
    }

    const sb = supabaseServer();

    // Проверяем что event существует и user — член той же команды
    const { data: event, error: evErr } = await sb
      .from('events')
      .select('id, team_id, status')
      .eq('id', parsed.data.event_id)
      .maybeSingle();
    if (evErr) {
      return NextResponse.json({ error: evErr.message }, { status: 500 });
    }
    if (!event) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }
    if (event.status === 'cancelled') {
      return NextResponse.json({ error: 'Событие отменено' }, { status: 409 });
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

    if (parsed.data.vote === null) {
      const { error: delErr } = await sb
        .from('event_attendances')
        .delete()
        .eq('event_id', parsed.data.event_id)
        .eq('user_id', user.id);
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
    } else {
      const { error: upErr } = await sb
        .from('event_attendances')
        .upsert(
          {
            event_id: parsed.data.event_id,
            user_id: user.id,
            vote: parsed.data.vote,
            voted_at: new Date().toISOString(),
          },
          { onConflict: 'event_id,user_id' },
        );
      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
    }

    const body: VoteResponse = { ok: true };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
