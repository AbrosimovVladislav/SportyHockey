import { NextResponse } from 'next/server';
import { AuthError, requireOrganizer } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import type { DeletePenaltyResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; penaltyId: string }> };

export async function DELETE(req: Request, { params }: Params): Promise<Response> {
  try {
    const ctx = await requireOrganizer(req);
    const { id, penaltyId } = await params;
    const sb = supabaseServer();

    const { data: ev } = await sb
      .from('events')
      .select('id, team_id')
      .eq('id', id)
      .maybeSingle();
    if (!ev || ev.team_id !== ctx.team_id) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    const { error } = await sb
      .from('event_penalties')
      .delete()
      .eq('id', penaltyId)
      .eq('event_id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true } satisfies DeletePenaltyResponse);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
