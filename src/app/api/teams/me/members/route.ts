import { NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import type { MemberRole, TeamMember, TeamMembersResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const { data: myMem, error: myMemErr } = await sb
      .from('team_memberships')
      .select('team_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (myMemErr) {
      return NextResponse.json({ error: myMemErr.message }, { status: 500 });
    }
    if (!myMem) {
      return NextResponse.json({ error: 'Команды нет' }, { status: 404 });
    }

    const { data: team, error: teamErr } = await sb
      .from('teams')
      .select('id, name')
      .eq('id', myMem.team_id)
      .single();
    if (teamErr || !team) {
      return NextResponse.json(
        { error: teamErr?.message ?? 'Команда не найдена' },
        { status: 500 },
      );
    }

    const { data: memberships, error: memErr } = await sb
      .from('team_memberships')
      .select('user_id, role')
      .eq('team_id', team.id);
    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }

    const userIds = (memberships ?? []).map((m) => m.user_id);
    let userMap = new Map<
      string,
      { telegram_id: number; first_name: string | null; last_name: string | null; username: string | null; photo_url: string | null }
    >();
    if (userIds.length > 0) {
      const { data: users, error: usersErr } = await sb
        .from('users')
        .select('id, telegram_id, first_name, last_name, username, photo_url')
        .in('id', userIds);
      if (usersErr) {
        return NextResponse.json({ error: usersErr.message }, { status: 500 });
      }
      userMap = new Map(
        (users ?? []).map((u) => [
          u.id,
          {
            telegram_id: u.telegram_id,
            first_name: u.first_name,
            last_name: u.last_name,
            username: u.username,
            photo_url: u.photo_url,
          },
        ]),
      );
    }

    const members: TeamMember[] = (memberships ?? []).map((m) => {
      const u = userMap.get(m.user_id);
      return {
        user_id: m.user_id,
        telegram_id: u?.telegram_id ?? 0,
        first_name: u?.first_name ?? null,
        last_name: u?.last_name ?? null,
        username: u?.username ?? null,
        photo_url: u?.photo_url ?? null,
        role: m.role as MemberRole,
      };
    });

    const body: TeamMembersResponse = {
      team: { id: team.id, name: team.name },
      members,
    };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
