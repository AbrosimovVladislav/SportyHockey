import { NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import { asMemberRole } from '@/lib/role';
import { asPosition, asSlotRole, asTier } from '@/lib/team-member';
import { computeAttendanceRates } from '@/lib/attendance-rate';
import type { TeamMember, TeamMemberDetailResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  ctx: { params: Promise<{ user_id: string }> },
): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();
    const { user_id: memberUserId } = await ctx.params;

    const teamId = await getUserTeamId(user.id, req);
    if (!teamId) {
      return NextResponse.json({ error: 'Команды нет' }, { status: 404 });
    }

    const { data: team, error: teamErr } = await sb
      .from('teams')
      .select('id, name')
      .eq('id', teamId)
      .single();
    if (teamErr || !team) {
      return NextResponse.json(
        { error: teamErr?.message ?? 'Команда не найдена' },
        { status: 500 },
      );
    }

    const { data: membership, error: memErr } = await sb
      .from('team_memberships')
      .select(
        'user_id, role, jersey_number, position, slot_role, tier, note, contact_phone, contact_email',
      )
      .eq('team_id', team.id)
      .eq('user_id', memberUserId)
      .maybeSingle();
    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }
    if (!membership) {
      return NextResponse.json({ error: 'Игрок не найден в команде' }, { status: 404 });
    }

    const { data: u, error: usersErr } = await sb
      .from('users')
      .select('telegram_id, first_name, last_name, username, photo_url, avatar_url, birth_date, bio')
      .eq('id', memberUserId)
      .maybeSingle();
    if (usersErr) {
      return NextResponse.json({ error: usersErr.message }, { status: 500 });
    }

    const rates = await computeAttendanceRates(sb, team.id, [memberUserId]);

    const member: TeamMember = {
      user_id: membership.user_id,
      telegram_id: u?.telegram_id ?? null,
      first_name: u?.first_name ?? null,
      last_name: u?.last_name ?? null,
      username: u?.username ?? null,
      photo_url: u?.photo_url ?? null,
      avatar_url: u?.avatar_url ?? null,
      birth_date: u?.birth_date ?? null,
      bio: u?.bio ?? null,
      role: asMemberRole(membership.role),
      jersey_number: membership.jersey_number ?? null,
      position: asPosition(membership.position),
      slot_role: asSlotRole(membership.slot_role),
      tier: asTier(membership.tier),
      note: membership.note ?? null,
      contact_phone: membership.contact_phone ?? null,
      contact_email: membership.contact_email ?? null,
      is_placeholder: u?.telegram_id == null,
      attendance_rate: rates.get(memberUserId) ?? null,
    };

    const body: TeamMemberDetailResponse = {
      team: { id: team.id, name: team.name },
      member,
    };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
