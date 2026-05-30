import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { buildInviteLink } from '@/lib/team-link';
import { asMemberRole } from '@/lib/role';
import { asShoots } from '@/lib/team-member';
import { normStr, normTelegramUsername } from '@/lib/normalize-contact';
import type { TablesUpdate } from '@/types/db';
import type {
  MeMembership,
  MeResponse,
  PendingJoinRequest,
  UpdateMeResponse,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MEDIA_BUCKET = 'team-media';

type TeamRef =
  | { id: string; name: string; logo_url: string | null }
  | { id: string; name: string; logo_url: string | null }[]
  | null;

export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const body = await buildMeResponse(user.id);
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

// PATCH /api/me — игрок редактирует собственные поля в users (v0.4).
// Командные поля (номер, амплуа, шейп слота, капитанство, tier) — в
// PATCH /api/me/membership (итерация 44).
const PatchBody = z.object({
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  shoots: z.enum(['left', 'right']).nullable().optional(),
  bio: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  contact_whatsapp: z.string().nullable().optional(),
  avatar_path: z.string().nullable().optional(),
});

export async function PATCH(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const json = await req.json().catch(() => null);
    const parsed = PatchBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные профиля' }, { status: 400 });
    }
    const d = parsed.data;

    const update: TablesUpdate<'users'> = {};
    if (d.first_name !== undefined) update.first_name = normStr(d.first_name);
    if (d.last_name !== undefined) update.last_name = normStr(d.last_name);
    if (d.birth_date !== undefined) update.birth_date = normStr(d.birth_date);
    if (d.shoots !== undefined) update.shoots = d.shoots;
    if (d.bio !== undefined) update.bio = normStr(d.bio);
    if (d.username !== undefined) update.username = normTelegramUsername(d.username);
    if (d.contact_phone !== undefined) update.contact_phone = normStr(d.contact_phone);
    if (d.contact_whatsapp !== undefined) update.contact_whatsapp = normStr(d.contact_whatsapp);
    if (d.avatar_path) {
      update.avatar_url = sb.storage
        .from(MEDIA_BUCKET)
        .getPublicUrl(d.avatar_path).data.publicUrl;
    }

    if (Object.keys(update).length > 0) {
      const { error } = await sb.from('users').update(update).eq('id', user.id);
      if (error) {
        if (error.code === '23505') {
          return NextResponse.json(
            { error: 'Этот Telegram-ник уже занят другим игроком' },
            { status: 409 },
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const body: UpdateMeResponse = await buildMeResponse(user.id);
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

// Полная пересборка MeResponse для GET и для ответа на PATCH.
// Вынесена в общий хелпер, чтобы оба endpoint'а отдавали одинаковую форму.
async function buildMeResponse(userId: string): Promise<MeResponse> {
  const sb = supabaseServer();

  const { data, error } = await sb
    .from('team_memberships')
    .select('team_id, role, teams(id, name, logo_url)')
    .eq('user_id', userId);
  if (error) {
    throw new Error(error.message);
  }

  const memberships: MeMembership[] = (data ?? []).map((m) => {
    const team = pickTeam(m.teams as TeamRef);
    return {
      team_id: m.team_id,
      team_name: team?.name ?? '',
      team_logo_url: team?.logo_url ?? null,
      role: asMemberRole(m.role),
    };
  });

  const organizer = memberships.find((m) => m.role === 'organizer');
  const invite_link = organizer ? buildInviteLink(organizer.team_id) : null;

  const { data: profile, error: profileErr } = await sb
    .from('users')
    .select(
      'telegram_id, first_name, last_name, username, photo_url, avatar_url, birth_date, bio, shoots, contact_phone, contact_whatsapp, onboarded',
    )
    .eq('id', userId)
    .maybeSingle();
  if (profileErr) {
    throw new Error(profileErr.message);
  }

  // Активная заявка на вступление (для экрана ожидания, пока нет членства).
  let pending_join_request: PendingJoinRequest | null = null;
  if (memberships.length === 0) {
    const { data: pending, error: pendingErr } = await sb
      .from('team_join_requests')
      .select('team_id, teams(name)')
      .eq('user_id', userId)
      .eq('kind', 'request')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pendingErr) {
      throw new Error(pendingErr.message);
    }
    if (pending) {
      const tn = Array.isArray(pending.teams)
        ? pending.teams[0]?.name ?? ''
        : pending.teams?.name ?? '';
      pending_join_request = { team_id: pending.team_id, team_name: tn };
    }
  }

  return {
    user: {
      id: userId,
      telegram_id: profile?.telegram_id ?? 0,
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      username: profile?.username ?? null,
      photo_url: profile?.photo_url ?? null,
      avatar_url: profile?.avatar_url ?? null,
      birth_date: profile?.birth_date ?? null,
      bio: profile?.bio ?? null,
      shoots: asShoots(profile?.shoots),
      contact_phone: profile?.contact_phone ?? null,
      contact_whatsapp: profile?.contact_whatsapp ?? null,
      onboarded: profile?.onboarded ?? false,
    },
    memberships,
    invite_link,
    pending_join_request,
  };
}

function pickTeam(teams: TeamRef): { id: string; name: string; logo_url: string | null } | null {
  if (!teams) return null;
  return Array.isArray(teams) ? teams[0] ?? null : teams;
}
