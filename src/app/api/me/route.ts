import { NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { buildInviteLink } from '@/lib/team-link';
import type { MeMembership, MeResponse, MemberRole } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const { data: memRows, error: memErr } = await sb
      .from('team_memberships')
      .select('team_id, role')
      .eq('user_id', user.id);
    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }

    const teamIds = (memRows ?? []).map((m) => m.team_id);
    let teamMap = new Map<string, string>();
    if (teamIds.length > 0) {
      const { data: teams, error: teamErr } = await sb
        .from('teams')
        .select('id, name')
        .in('id', teamIds);
      if (teamErr) {
        return NextResponse.json({ error: teamErr.message }, { status: 500 });
      }
      teamMap = new Map((teams ?? []).map((t) => [t.id, t.name]));
    }

    const memberships: MeMembership[] = (memRows ?? []).map((m) => ({
      team_id: m.team_id,
      team_name: teamMap.get(m.team_id) ?? '',
      role: m.role as MemberRole,
    }));

    const organizer = memberships.find((m) => m.role === 'organizer');
    const invite_link = organizer ? buildInviteLink(organizer.team_id) : null;

    const body: MeResponse = {
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo_url: user.photo_url,
      },
      memberships,
      invite_link,
    };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
