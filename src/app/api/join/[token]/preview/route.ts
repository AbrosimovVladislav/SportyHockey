import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type { JoinPreviewDto } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Итерация 41 — превью команды по токену для страницы /join/[token].
// Возвращаем имя и логотип команды, а также флаг already=true, если
// пользователь уже в этой команде — UI поменяет кнопку «Присоединиться»
// на «Открыть команду».

export async function GET(
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

    const { data: team, error: teamErr } = await sb
      .from('teams')
      .select('id, name, logo_url')
      .eq('id', invite.team_id)
      .single();
    if (teamErr || !team) {
      return NextResponse.json(
        { error: teamErr?.message ?? 'Команда не найдена' },
        { status: 500 },
      );
    }

    const { data: mem } = await sb
      .from('team_memberships')
      .select('id')
      .eq('team_id', team.id)
      .eq('user_id', user.id)
      .maybeSingle();

    const body: JoinPreviewDto = {
      team: { id: team.id, name: team.name, logo_url: team.logo_url },
      already: Boolean(mem),
    };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
