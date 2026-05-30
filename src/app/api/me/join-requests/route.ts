import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type { ApplyToTeamResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ team_id: z.string().uuid() });

// Игрок подаёт заявку (kind='request') на вступление в команду.
// Если уже в этой команде — 409. Если уже есть pending-заявка — идемпотентно
// возвращаем тот же ok=true с already=true, без двойной записи.
export async function POST(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }
    const { team_id } = parsed.data;

    const { data: team, error: teamErr } = await sb
      .from('teams')
      .select('id, archived_at')
      .eq('id', team_id)
      .maybeSingle();
    if (teamErr) {
      return NextResponse.json({ error: teamErr.message }, { status: 500 });
    }
    if (!team || team.archived_at != null) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 });
    }

    const { data: membership } = await sb
      .from('team_memberships')
      .select('id')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (membership) {
      return NextResponse.json({ error: 'Вы уже в этой команде' }, { status: 409 });
    }

    const { data: existing } = await sb
      .from('team_join_requests')
      .select('id')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .eq('kind', 'request')
      .eq('status', 'pending')
      .maybeSingle();
    if (existing) {
      const body: ApplyToTeamResponse = { ok: true, status: 'pending', already: true };
      return NextResponse.json(body);
    }

    const { error: insErr } = await sb.from('team_join_requests').insert({
      team_id,
      user_id: user.id,
      kind: 'request',
      created_by: user.id,
    });
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    const body: ApplyToTeamResponse = { ok: true, status: 'pending' };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
