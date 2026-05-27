import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { computePlayerFinance } from '@/lib/player-finance';
import type { PlayerFinanceResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Финансы чужого игрока видит только организатор (см. roadmap 32.3).
export async function GET(
  req: Request,
  ctx: { params: Promise<{ user_id: string }> },
): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();
    const { user_id: memberUserId } = await ctx.params;
    const teamId = org.team_id;

    const { data: membership } = await sb
      .from('team_memberships')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', memberUserId)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: 'Игрок не найден в команде' }, { status: 404 });
    }

    const body: PlayerFinanceResponse = await computePlayerFinance(sb, teamId, memberUserId);
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
