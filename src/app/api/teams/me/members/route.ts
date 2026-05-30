import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import { asMemberRole } from '@/lib/role';
import { asCaptaincy, asPosition, asShoots, asSlotRole, asTier } from '@/lib/team-member';
import { computeAttendanceRates } from '@/lib/attendance-rate';
import { normStr, normTelegramUsername } from '@/lib/normalize-contact';
import { buildMemberInviteLink } from '@/lib/team-link';
import type { TablesInsert } from '@/types/db';
import type { CreateMemberResponse, TeamMember, TeamMembersResponse } from '@/types/api';

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
  contact_phone: string | null;
  contact_whatsapp: string | null;
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
        'user_id, role, captaincy, jersey_number, position, slot_role, tier, note',
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
        .select(
          'id, telegram_id, first_name, last_name, username, photo_url, avatar_url, birth_date, bio, shoots, contact_phone, contact_whatsapp',
        )
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
            contact_phone: u.contact_phone,
            contact_whatsapp: u.contact_whatsapp,
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
        contact_phone: u?.contact_phone ?? null,
        contact_whatsapp: u?.contact_whatsapp ?? null,
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
    return handleRouteError(e);
  }
}

const CreateBody = z.object({
  first_name: z.string().max(100).nullable().optional(),
  last_name: z.string().max(100).nullable().optional(),
  birth_date: z.string().max(20).nullable().optional(),
  shoots: z.enum(['left', 'right']).nullable().optional(),
  username: z.string().max(100).nullable().optional(),
  contact_phone: z.string().max(50).nullable().optional(),
  contact_whatsapp: z.string().max(50).nullable().optional(),
  jersey_number: z.number().int().min(0).max(999).nullable().optional(),
  position: z.enum(['forward', 'defender', 'goalie']).nullable().optional(),
  slot_role: z.enum(['lw', 'c', 'rw', 'ld', 'rd', 'g']).nullable().optional(),
  captaincy: z.enum(['none', 'assistant', 'captain']).optional(),
  tier: z.enum(['main', 'reserve']).optional(),
  invite: z.boolean().optional(),
});

// Создание игрока организатором (flow 2). Игрок без аккаунта: telegram_id NULL.
// Фото грузится отдельным шагом (signed-upload требует уже созданного user_id).
export async function POST(req: Request): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();

    const json = await req.json().catch(() => null);
    const parsed = CreateBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные игрока' }, { status: 400 });
    }
    const d = parsed.data;
    const username = normTelegramUsername(d.username);

    // Если игрок с таким ником уже есть в системе — не создаём дубль, а привязываем
    // существующего к команде новым membership. Ник в users остаётся уникальным.
    let resolved: { id: string; telegram_id: number | null } | null = null;
    if (username) {
      const likePattern = username.replace(/([\\%_])/g, '\\$1'); // ник может содержать _
      const { data: existing, error: exErr } = await sb
        .from('users')
        .select('id, telegram_id')
        .ilike('username', likePattern)
        .maybeSingle();
      if (exErr) {
        return NextResponse.json({ error: exErr.message }, { status: 500 });
      }
      if (existing) {
        const { data: dupMember, error: dmErr } = await sb
          .from('team_memberships')
          .select('id')
          .eq('team_id', org.team_id)
          .eq('user_id', existing.id)
          .maybeSingle();
        if (dmErr) {
          return NextResponse.json({ error: dmErr.message }, { status: 500 });
        }
        if (dupMember) {
          return NextResponse.json({ error: 'Этот игрок уже в твоей команде' }, { status: 409 });
        }
        resolved = { id: existing.id, telegram_id: existing.telegram_id };
      }
    }

    // Ника нет или игрок не найден → заводим новую карточку (плейсхолдер без telegram_id).
    let createdNew = false;
    if (!resolved) {
      const userInsert: TablesInsert<'users'> = {
        first_name: normStr(d.first_name),
        last_name: normStr(d.last_name),
        username,
        birth_date: normStr(d.birth_date),
        shoots: d.shoots ?? null,
        // Контакты — на пользователе, общие для всех команд.
        contact_phone: normStr(d.contact_phone),
        contact_whatsapp: normStr(d.contact_whatsapp),
        onboarded: false,
      };
      const { data: createdUser, error: userErr } = await sb
        .from('users')
        .insert(userInsert)
        .select('id')
        .single();
      if (userErr || !createdUser) {
        return NextResponse.json(
          { error: userErr?.message ?? 'Не удалось создать игрока' },
          { status: 500 },
        );
      }
      resolved = { id: createdUser.id, telegram_id: null };
      createdNew = true;
    }

    // Если игрок уже существовал в users (привязка по нику), а организатор
    // в форме указал контакты — переносим их в users (общая точка истины).
    if (!createdNew && (d.contact_phone !== undefined || d.contact_whatsapp !== undefined)) {
      const contactUpdate: TablesInsert<'users'> = { id: resolved.id };
      if (d.contact_phone !== undefined) contactUpdate.contact_phone = normStr(d.contact_phone);
      if (d.contact_whatsapp !== undefined) contactUpdate.contact_whatsapp = normStr(d.contact_whatsapp);
      const { error: cuErr } = await sb
        .from('users')
        .update(contactUpdate)
        .eq('id', resolved.id);
      if (cuErr) {
        return NextResponse.json({ error: cuErr.message }, { status: 500 });
      }
    }

    const memberInsert: TablesInsert<'team_memberships'> = {
      team_id: org.team_id,
      user_id: resolved.id,
      role: 'player',
      jersey_number: d.jersey_number ?? null,
      position: d.position ?? null,
      slot_role: d.position === 'goalie' ? 'g' : d.slot_role ?? null,
      captaincy: d.captaincy ?? 'none',
      tier: d.tier ?? 'main',
    };
    const { error: memErr2 } = await sb.from('team_memberships').insert(memberInsert);
    if (memErr2) {
      // Откатываем только что созданную строку users, чтобы не плодить «ничьих» игроков.
      if (createdNew) await sb.from('users').delete().eq('id', resolved.id);
      return NextResponse.json({ error: memErr2.message }, { status: 500 });
    }

    // Приглашение есть смысл слать только тем, у кого ещё нет аккаунта (плейсхолдер/новый).
    let inviteLink: string | null = null;
    if (d.invite && resolved.telegram_id === null) {
      const { error: reqErr } = await sb.from('team_join_requests').insert({
        team_id: org.team_id,
        user_id: resolved.id,
        kind: 'invite',
        created_by: org.id,
      });
      if (reqErr) {
        return NextResponse.json({ error: reqErr.message }, { status: 500 });
      }
      inviteLink = buildMemberInviteLink(resolved.id);
    }

    const body: CreateMemberResponse = { user_id: resolved.id, invite_link: inviteLink };
    return NextResponse.json(body, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
