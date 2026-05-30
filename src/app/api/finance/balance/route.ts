import { NextResponse } from 'next/server';
import { requireUser, resolveActiveTeamId } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { computeTeamBalance } from '@/lib/team-finance';
import type { TeamBalanceResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/finance/balance — баланс активной команды в разложении
// «На руках / Будущие аренды / Переплаты / Долги». Используется на хабе.
export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const teamId = await resolveActiveTeamId(req, user.id);
    if (!teamId) {
      return NextResponse.json({ error: 'Активная команда не выбрана' }, { status: 400 });
    }
    const sb = supabaseServer();
    const balance = await computeTeamBalance(sb, teamId);
    const body: TeamBalanceResponse = { total: balance.total, breakdown: balance.breakdown };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
