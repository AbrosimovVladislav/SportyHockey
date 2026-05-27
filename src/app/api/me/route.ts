import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { buildInviteLink } from '@/lib/team-link';
import { asMemberRole } from '@/lib/role';
import { asShoots } from '@/lib/team-member';
import type { MeMembership, MeResponse, PendingJoinRequest } from '@/types/api';

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
      .select('avatar_url, birth_date, bio, shoots, onboarded')
      .eq('id', user.id)
      .maybeSingle();
    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // Активная заявка на вступление (для экрана ожидания, пока нет членства).
    let pending_join_request: PendingJoinRequest | null = null;
    if (memberships.length === 0) {
      const { data: pending, error: pendingErr } = await sb
        .from('team_join_requests')
        .select('team_id, teams(name)')
        .eq('user_id', user.id)
        .eq('kind', 'request')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pendingErr) {
        return NextResponse.json({ error: pendingErr.message }, { status: 500 });
      }
      if (pending) {
        const tn = Array.isArray(pending.teams)
          ? pending.teams[0]?.name ?? ''
          : pending.teams?.name ?? '';
        pending_join_request = { team_id: pending.team_id, team_name: tn };
      }
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
        shoots: asShoots(profile?.shoots),
        onboarded: profile?.onboarded ?? false,
      },
      memberships,
      invite_link,
      pending_join_request,
    };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

function extractTeamName(teams: TeamRef): string {
  if (!teams) return '';
  if (Array.isArray(teams)) return teams[0]?.name ?? '';
  return teams.name;
}
