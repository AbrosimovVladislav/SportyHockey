import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import type { TeamPublicDto } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Базовые публичные поля команды, нужные на хабе /squad и в шапках.
// Доступны любому участнику команды (не только организатору).

export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const teamId = await getUserTeamId(user.id, req);
    if (!teamId) {
      return NextResponse.json({ error: 'Команды нет' }, { status: 404 });
    }

    const { data: team, error } = await sb
      .from('teams')
      .select('id, name, logo_url, photo_url, archived_at')
      .eq('id', teamId)
      .single();
    if (error || !team) {
      return NextResponse.json(
        { error: error?.message ?? 'Команда не найдена' },
        { status: 500 },
      );
    }

    const body: TeamPublicDto = {
      id: team.id,
      name: team.name,
      logo_url: team.logo_url,
      photo_url: team.photo_url,
      archived_at: team.archived_at,
    };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
