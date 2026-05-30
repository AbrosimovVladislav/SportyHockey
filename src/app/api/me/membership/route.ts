import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import type { TablesUpdate } from '@/types/db';
import type { UpdateMyMembershipResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Игрок редактирует свои командные поля в активной команде. Параметры —
// те же, что в PATCH /api/teams/me/members/[user_id] для организатора, но
// только командно-связанные. Контакты/имя/аватар — в PATCH /api/me.
const Body = z.object({
  jersey_number: z.number().int().min(0).max(99).nullable().optional(),
  position: z.enum(['forward', 'defender', 'goalie']).nullable().optional(),
  slot_role: z.enum(['lw', 'c', 'rw', 'ld', 'rd', 'g']).nullable().optional(),
  captaincy: z.enum(['none', 'assistant', 'captain']).optional(),
  tier: z.enum(['main', 'reserve']).optional(),
});

export async function PATCH(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const teamId = await getUserTeamId(user.id, req);
    if (!teamId) {
      return NextResponse.json({ error: 'Активная команда не найдена' }, { status: 400 });
    }

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }
    const d = parsed.data;

    const update: TablesUpdate<'team_memberships'> = {};
    if (d.jersey_number !== undefined) update.jersey_number = d.jersey_number;
    if (d.position !== undefined) update.position = d.position;
    if (d.slot_role !== undefined) update.slot_role = d.slot_role;
    if (d.captaincy !== undefined) update.captaincy = d.captaincy;
    if (d.tier !== undefined) update.tier = d.tier;

    if (Object.keys(update).length > 0) {
      const { error } = await sb
        .from('team_memberships')
        .update(update)
        .eq('team_id', teamId)
        .eq('user_id', user.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const body: UpdateMyMembershipResponse = { ok: true };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
