import { NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import { asMemberRole } from '@/lib/role';
import { asCaptaincy, asPosition, asShoots, asSlotRole, asTier } from '@/lib/team-member';
import { computeAttendanceRates } from '@/lib/attendance-rate';
import type { TeamMember, TeamMembersResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UserRow = {
  telegram_id: number | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  bio: string | null;
  shoots: string | null;
};

export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

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

    const { data: memberships, error: memErr } = await sb
      .from('team_memberships')
      .select(
        'user_id, role, captaincy, jersey_number, position, slot_role, tier, note, contact_phone, contact_email',
      )
      .eq('team_id', team.id);
    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }

    const userIds = (memberships ?? []).map((m) => m.user_id);
    let userMap = new Map<string, UserRow>();
    if (userIds.length > 0) {
      const { data: users, error: usersErr } = await sb
        .from('users')
        .select('id, telegram_id, first_name, last_name, username, photo_url, avatar_url, birth_date, bio, shoots')
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
            avatar_url: u.avatar_url,
            birth_date: u.birth_date,
            bio: u.bio,
            shoots: u.shoots,
          },
        ]),
      );
    }

    const rates = await computeAttendanceRates(sb, team.id, userIds);

    const members: TeamMember[] = (memberships ?? []).map((m) => {
      const u = userMap.get(m.user_id);
      return {
        user_id: m.user_id,
        telegram_id: u?.telegram_id ?? null,
        first_name: u?.first_name ?? null,
        last_name: u?.last_name ?? null,
        username: u?.username ?? null,
        photo_url: u?.photo_url ?? null,
        avatar_url: u?.avatar_url ?? null,
        birth_date: u?.birth_date ?? null,
        bio: u?.bio ?? null,
        shoots: asShoots(u?.shoots),
        role: asMemberRole(m.role),
        captaincy: asCaptaincy(m.captaincy),
        jersey_number: m.jersey_number ?? null,
        position: asPosition(m.position),
        slot_role: asSlotRole(m.slot_role),
        tier: asTier(m.tier),
        note: m.note ?? null,
        contact_phone: m.contact_phone ?? null,
        contact_email: m.contact_email ?? null,
        is_placeholder: u?.telegram_id == null,
        attendance_rate: rates.get(m.user_id) ?? null,
      };
    });

    const body: TeamMembersResponse = {
      team: { id: team.id, name: team.name },
      members,
    };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
