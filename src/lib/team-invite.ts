import 'server-only';
import { supabaseServer } from '@/lib/supabase-server';

// Постоянный токен-инвайт команды (итерация 41). Один токен на команду
// (UNIQUE индекс по team_id), создаётся лениво при первом обращении.
// Используется в ссылке-приглашении и в кнопке «Записаться» под анонсом в канале.

// Алфавит из латиницы и цифр, без визуально похожих символов.
// 12 знаков ≈ 71 бит энтропии — достаточно для невгадываемого токена.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let s = '';
  for (let i = 0; i < bytes.length; i += 1) {
    s += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return s;
}

export async function ensureTeamInviteToken(teamId: string, createdBy: string): Promise<string> {
  const sb = supabaseServer();

  const { data: existing, error: selErr } = await sb
    .from('team_invites')
    .select('token')
    .eq('team_id', teamId)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);
  if (existing?.token) return existing.token;

  const { data: inserted, error: insErr } = await sb
    .from('team_invites')
    .insert({ team_id: teamId, token: newToken(), created_by: createdBy })
    .select('token')
    .single();
  if (!insErr && inserted) return inserted.token;

  // Гонка двух первых запросов: токен уже создал параллельный запрос — читаем его.
  const { data: again } = await sb
    .from('team_invites')
    .select('token')
    .eq('team_id', teamId)
    .maybeSingle();
  if (again?.token) return again.token;
  throw new Error(insErr?.message ?? 'Не удалось создать инвайт');
}
