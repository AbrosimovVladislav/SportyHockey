import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type { LeaveTeamResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Итерация 41 — организатор покидает команду. Игроки сюда не ходят (поэтому
// endpoint защищён requireOrganizer): выход игрока в этой итерации не реализован,
// игрока выводит организатор через DELETE /members/[user_id]. Если организатор
// единственный — возвращаем 409 с подсказкой назначить другого.

export async function POST(req: Request): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();

    const { count, error: cntErr } = await sb
      .from('team_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', org.team_id)
      .eq('role', 'organizer');
    if (cntErr) {
      return NextResponse.json({ error: cntErr.message }, { status: 500 });
    }
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'Назначьте другого организатора, прежде чем покинуть команду' },
        { status: 409 },
      );
    }

    // Чистим командные расстановки покидающего, чтобы не висели «призраки».
    await sb
      .from('team_default_lines')
      .delete()
      .eq('team_id', org.team_id)
      .eq('user_id', org.id);
    await sb
      .from('team_default_sides')
      .delete()
      .eq('team_id', org.team_id)
      .eq('user_id', org.id);

    const { error: delErr } = await sb
      .from('team_memberships')
      .delete()
      .eq('team_id', org.team_id)
      .eq('user_id', org.id);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    const body: LeaveTeamResponse = { ok: true };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
