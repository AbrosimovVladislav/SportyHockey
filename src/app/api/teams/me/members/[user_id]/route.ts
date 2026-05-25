import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireUser, requireOrganizer } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import { asMemberRole } from '@/lib/role';
import { asCaptaincy, asPosition, asShoots, asSlotRole, asTier } from '@/lib/team-member';
import { computeAttendanceRates } from '@/lib/attendance-rate';
import type { TablesUpdate } from '@/types/db';
import type {
  DeleteMemberResponse,
  TeamMember,
  TeamMemberDetailResponse,
  UpdateMemberResponse,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MEDIA_BUCKET = 'team-media';

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
        'user_id, role, captaincy, jersey_number, position, slot_role, tier, note, contact_phone, contact_email',
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
      .select('telegram_id, first_name, last_name, username, photo_url, avatar_url, birth_date, bio, shoots')
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
      shoots: asShoots(u?.shoots),
      role: asMemberRole(membership.role),
      captaincy: asCaptaincy(membership.captaincy),
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

const PatchBody = z.object({
  first_name: z.string().max(100).nullable().optional(),
  last_name: z.string().max(100).nullable().optional(),
  birth_date: z.string().max(20).nullable().optional(),
  shoots: z.enum(['left', 'right']).nullable().optional(),
  avatar_path: z.string().max(300).nullable().optional(),
  contact_phone: z.string().max(50).nullable().optional(),
  jersey_number: z.number().int().min(0).max(999).nullable().optional(),
  position: z.enum(['forward', 'defender', 'goalie']).nullable().optional(),
  slot_role: z.enum(['lw', 'c', 'rw', 'ld', 'rd', 'g']).nullable().optional(),
  captaincy: z.enum(['none', 'assistant', 'captain']).optional(),
  tier: z.enum(['main', 'reserve']).optional(),
});

// Пустую строку трактуем как «очищено» → null.
function normStr(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === '' ? null : t;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ user_id: string }> },
): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();
    const { user_id: memberUserId } = await ctx.params;

    const { data: membership, error: memErr } = await sb
      .from('team_memberships')
      .select('id')
      .eq('team_id', org.team_id)
      .eq('user_id', memberUserId)
      .maybeSingle();
    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }
    if (!membership) {
      return NextResponse.json({ error: 'Игрок не найден в команде' }, { status: 404 });
    }

    const json = await req.json().catch(() => null);
    const parsed = PatchBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные профиля' }, { status: 400 });
    }
    const d = parsed.data;

    // Персональные поля → users.
    const userUpdate: TablesUpdate<'users'> = {};
    if (d.first_name !== undefined) userUpdate.first_name = normStr(d.first_name);
    if (d.last_name !== undefined) userUpdate.last_name = normStr(d.last_name);
    if (d.birth_date !== undefined) userUpdate.birth_date = normStr(d.birth_date);
    if (d.shoots !== undefined) userUpdate.shoots = d.shoots;
    if (d.avatar_path) {
      userUpdate.avatar_url = sb.storage.from(MEDIA_BUCKET).getPublicUrl(d.avatar_path).data.publicUrl;
    }

    // Командные поля → team_memberships.
    const memberUpdate: TablesUpdate<'team_memberships'> = {};
    if (d.contact_phone !== undefined) memberUpdate.contact_phone = normStr(d.contact_phone);
    if (d.jersey_number !== undefined) memberUpdate.jersey_number = d.jersey_number;
    if (d.position !== undefined) memberUpdate.position = d.position;
    if (d.slot_role !== undefined) memberUpdate.slot_role = d.slot_role;
    if (d.captaincy !== undefined) memberUpdate.captaincy = d.captaincy;
    if (d.tier !== undefined) memberUpdate.tier = d.tier;

    if (Object.keys(userUpdate).length > 0) {
      const { error } = await sb.from('users').update(userUpdate).eq('id', memberUserId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    if (Object.keys(memberUpdate).length > 0) {
      const { error } = await sb
        .from('team_memberships')
        .update(memberUpdate)
        .eq('team_id', org.team_id)
        .eq('user_id', memberUserId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const body: UpdateMemberResponse = { ok: true };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ user_id: string }> },
): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();
    const { user_id: memberUserId } = await ctx.params;

    const { data: membership, error: memErr } = await sb
      .from('team_memberships')
      .select('id, role')
      .eq('team_id', org.team_id)
      .eq('user_id', memberUserId)
      .maybeSingle();
    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }
    if (!membership) {
      return NextResponse.json({ error: 'Игрок не найден в команде' }, { status: 404 });
    }
    if (membership.role === 'organizer') {
      return NextResponse.json({ error: 'Нельзя удалить организатора' }, { status: 400 });
    }

    // Чистим командные расстановки игрока, чтобы не висели «призраки» в звеньях/распределении.
    await sb
      .from('team_default_lines')
      .delete()
      .eq('team_id', org.team_id)
      .eq('user_id', memberUserId);
    await sb
      .from('team_default_sides')
      .delete()
      .eq('team_id', org.team_id)
      .eq('user_id', memberUserId);

    const { error: delErr } = await sb
      .from('team_memberships')
      .delete()
      .eq('team_id', org.team_id)
      .eq('user_id', memberUserId);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    const body: DeleteMemberResponse = { ok: true };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
