import { NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { buildInviteLink } from '@/lib/team-link';
import { asMemberRole } from '@/lib/role';
import type { MeMembership, MeResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TeamRef = { id: string; name: string } | { id: string; name: string }[] | null;

export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const { data, error } = await sb
      .from('team_memberships')
      .select('team_id, role, teams(id, name)')
      .eq('user_id', user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const memberships: MeMembership[] = (data ?? []).map((m) => ({
      team_id: m.team_id,
      team_name: extractTeamName(m.teams),
      role: asMemberRole(m.role),
    }));

    const organizer = memberships.find((m) => m.role === 'organizer');
    const invite_link = organizer ? buildInviteLink(organizer.team_id) : null;

    const { data: profile, error: profileErr } = await sb
      .from('users')
      .select('avatar_url, birth_date, bio')
      .eq('id', user.id)
      .maybeSingle();
    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    const body: MeResponse = {
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo_url: user.photo_url,
        avatar_url: profile?.avatar_url ?? null,
        birth_date: profile?.birth_date ?? null,
        bio: profile?.bio ?? null,
      },
      memberships,
      invite_link,
    };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

function extractTeamName(teams: TeamRef): string {
  if (!teams) return '';
  if (Array.isArray(teams)) return teams[0]?.name ?? '';
  return teams.name;
}
