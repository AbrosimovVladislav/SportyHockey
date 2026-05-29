import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type { JoinAcceptResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Итерация 41 — приём токена-инвайта. Любой пользователь, открывший Mini App,
// может присоединиться к команде по валидному токену. Если он уже в команде —
// возвращаем already=true (это успех для клиента, редирект на /squad).

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();
    const { token } = await ctx.params;

    const { data: invite, error: invErr } = await sb
      .from('team_invites')
      .select('team_id')
      .eq('token', token)
      .maybeSingle();
    if (invErr) {
      return NextResponse.json({ error: invErr.message }, { status: 500 });
    }
    if (!invite) {
      return NextResponse.json({ error: 'Приглашение не найдено' }, { status: 404 });
    }

    const teamId = invite.team_id;

    const { data: existing } = await sb
      .from('team_memberships')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing) {
      const body: JoinAcceptResponse = { ok: true, team_id: teamId, already: true };
      return NextResponse.json(body);
    }

    const { error: insErr } = await sb.from('team_memberships').insert({
      team_id: teamId,
      user_id: user.id,
      role: 'player',
    });
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    const body: JoinAcceptResponse = { ok: true, team_id: teamId, already: false };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
