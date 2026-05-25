import { NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import { computePlayerStats } from '@/lib/player-stats';
import type { PlayerStatsResponse } from '@/types/api';

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

    const body: PlayerStatsResponse = await computePlayerStats(sb, teamId, memberUserId);
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
