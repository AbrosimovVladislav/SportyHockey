import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type { CreateTeamResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  name: z.string().trim().min(2).max(50),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректное название команды' }, { status: 400 });
    }

    const sb = supabaseServer();

    const { data: existing } = await sb
      .from('team_memberships')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Ты уже состоишь в команде' }, { status: 409 });
    }

    const { data: team, error: teamErr } = await sb
      .from('teams')
      .insert({ name: parsed.data.name })
      .select('id, name')
      .single();
    if (teamErr || !team) {
      return NextResponse.json(
        { error: teamErr?.message ?? 'Не удалось создать команду' },
        { status: 500 },
      );
    }

    const { error: memErr } = await sb
      .from('team_memberships')
      .insert({ team_id: team.id, user_id: user.id, role: 'organizer' });
    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }

    // Создание команды завершает онбординг организатора.
    await sb.from('users').update({ onboarded: true }).eq('id', user.id);

    const body: CreateTeamResponse = {
      team: { id: team.id, name: team.name },
      membership: { role: 'organizer' },
    };
    return NextResponse.json(body, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
