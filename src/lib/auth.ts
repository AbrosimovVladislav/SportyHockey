import 'server-only';
import { supabaseServer } from '@/lib/supabase-server';
import { verifyInitData, type TelegramUser } from '@/lib/telegram-verify';

export type AuthedUser = {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

export type OrganizerContext = AuthedUser & { team_id: string };

export class AuthError extends Error {
  status: 401 | 403;
  constructor(message: string, status: 401 | 403 = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export async function requireUser(req: Request): Promise<AuthedUser> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('tma ')) {
    throw new AuthError('Authorization: tma <initData> требуется');
  }
  const initData = header.slice(4);

  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new AuthError('BOT_TOKEN не задан');
  }

  const verified = verifyInitData(initData, token);
  return upsertUser(verified.user);
}

async function upsertUser(tgUser: TelegramUser): Promise<AuthedUser> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('users')
    .upsert(
      {
        telegram_id: tgUser.id,
        username: tgUser.username ?? null,
        first_name: tgUser.first_name ?? null,
        last_name: tgUser.last_name ?? null,
        photo_url: tgUser.photo_url ?? null,
      },
      { onConflict: 'telegram_id' },
    )
    .select('id, telegram_id, username, first_name, last_name, photo_url')
    .single();

  if (error || !data) {
    throw new AuthError(`users upsert failed: ${error?.message ?? 'unknown'}`);
  }
  return data;
}

export async function requireOrganizer(req: Request): Promise<OrganizerContext> {
  const user = await requireUser(req);
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('team_memberships')
    .select('team_id')
    .eq('user_id', user.id)
    .eq('role', 'organizer')
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`organizer check failed: ${error.message}`);
  }
  if (!data) {
    throw new AuthError('Только организатор команды', 403);
  }
  return { ...user, team_id: data.team_id };
}

export async function assertTeamMember(userId: string, teamId: string): Promise<void> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('team_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .maybeSingle();
  if (error) {
    throw new Error(`team member check failed: ${error.message}`);
  }
  if (!data) {
    throw new AuthError('Событие не найдено', 403);
  }
}
