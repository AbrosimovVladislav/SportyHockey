import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import { computePlayerOverview } from '@/lib/player-overview';
import type { PlayerOverviewResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  ctx: { params: Promise<{ user_id: string }> },
): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();
    const { user_id: memberUserId } = await ctx.params;

    const teamId = await getUserTeamId(user.id, req);
    if (!teamId) {
      return NextResponse.json({ error: 'Команды нет' }, { status: 404 });
    }

    const { data: membership } = await sb
      .from('team_memberships')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', memberUserId)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: 'Игрок не найден в команде' }, { status: 404 });
    }

    // Баланс чужого игрока — только организатору. Остальным зануляем, чтобы данные
    // не утекали в JSON (на фронте плашка финансов и так скрыта, см. roadmap 32.3).
    const { data: caller } = await sb
      .from('team_memberships')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle();
    const isOrganizer = caller?.role === 'organizer';

    const overview = await computePlayerOverview(sb, teamId, memberUserId);
    const body: PlayerOverviewResponse = isOrganizer
      ? overview
      : { ...overview, finance: { balance: 0 } };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
