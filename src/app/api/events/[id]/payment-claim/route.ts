import { NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { notifyPaymentClaim } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params): Promise<Response> {
  try {
    const user = await requireUser(req);
    const { id: eventId } = await params;
    const sb = supabaseServer();

    const { data: event, error: evErr } = await sb
      .from('events')
      .select('id, team_id')
      .eq('id', eventId)
      .maybeSingle();
    if (evErr) {
      return NextResponse.json({ error: evErr.message }, { status: 500 });
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

    const { data: existing } = await sb
      .from('event_attendances')
      .select('id, payment_claim')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing?.payment_claim) {
      return NextResponse.json({ ok: true });
    }

    const { error: upErr } = await sb
      .from('event_attendances')
      .upsert(
        {
          event_id: event.id,
          user_id: user.id,
          payment_claim: true,
        },
        { onConflict: 'event_id,user_id' },
      );
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    await notifyPaymentClaim({
      team_id: event.team_id,
      event_id: event.id,
      claimant_user_id: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
