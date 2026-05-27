import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import type { TeamDefaultSideEntry, TeamSidesResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const teamId = await getUserTeamId(user.id, req);
    if (!teamId) {
      return NextResponse.json({ error: 'Команды нет' }, { status: 404 });
    }

    const { data, error } = await sb
      .from('team_default_sides')
      .select('user_id, team_side')
      .eq('team_id', teamId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const sides: TeamDefaultSideEntry[] = (data ?? []).map((r) => ({
      user_id: r.user_id,
      team_side: r.team_side === 'dark' ? 'dark' : 'light',
    }));

    const body: TeamSidesResponse = { sides };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

const Body = z.object({
  user_id: z.string().uuid(),
  team_side: z.enum(['light', 'dark']).nullable(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    // Распределение Светлые/Тёмные двигает только организатор.
    const ctx = await requireOrganizer(req);
    const teamId = ctx.team_id;

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные стороны' }, { status: 400 });
    }

    const sb = supabaseServer();

    const { data: mem } = await sb
      .from('team_memberships')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', parsed.data.user_id)
      .maybeSingle();
    if (!mem) {
      return NextResponse.json({ error: 'Игрок не в команде' }, { status: 404 });
    }

    if (parsed.data.team_side === null) {
      const { error } = await sb
        .from('team_default_sides')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', parsed.data.user_id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    const { error: upErr } = await sb.from('team_default_sides').upsert(
      {
        team_id: teamId,
        user_id: parsed.data.user_id,
        team_side: parsed.data.team_side,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'team_id,user_id' },
    );
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
