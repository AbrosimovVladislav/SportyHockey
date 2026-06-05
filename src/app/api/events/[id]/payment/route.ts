import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  user_id: z.string().uuid(),
  amount: z.number().nonnegative().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params): Promise<Response> {
  try {
    const ctx = await requireOrganizer(req);
    const { id: eventId } = await params;
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные оплаты' }, { status: 400 });
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

    // Удаляем существующую оплату игрока за это событие. В ledger это
    // transfer user→team с этим event_id и from_id=user.
    const { error: delErr } = await sb
      .from('finance_transactions')
      .delete()
      .eq('event_id', event.id)
      .eq('from_kind', 'user')
      .eq('to_kind', 'team')
      .eq('from_id', parsed.data.user_id);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    if (parsed.data.amount !== null && parsed.data.amount > 0) {
      const { error: insErr } = await sb.from('finance_transactions').insert({
        team_id: event.team_id,
        event_id: event.id,
        amount: parsed.data.amount,
        created_by: ctx.id,
        kind: 'transfer',
        from_kind: 'user',
        from_id: parsed.data.user_id,
        to_kind: 'team',
        to_id: event.team_id,
      });
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
    }

    const { error: upErr } = await sb
      .from('event_attendances')
      .upsert(
        {
          event_id: event.id,
          user_id: parsed.data.user_id,
          payment_claim: false,
        },
        { onConflict: 'event_id,user_id' },
      );
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
