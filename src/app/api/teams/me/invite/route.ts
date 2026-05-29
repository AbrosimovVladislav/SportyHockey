import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { buildTeamJoinLink } from '@/lib/team-link';
import type { TeamInviteDto } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Итерация 41 — постоянный токен команды для приглашения игроков.
// Один токен на команду (UNIQUE индекс по team_id). Если записи ещё нет —
// создаём её лениво при первом запросе.

// nanoid с алфавитом из латиницы и цифр, без визуально похожих символов.
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

export async function GET(req: Request): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();

    const { data: existing, error: selErr } = await sb
      .from('team_invites')
      .select('token')
      .eq('team_id', org.team_id)
      .maybeSingle();
    if (selErr) {
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }

    let token = existing?.token;
    if (!token) {
      const candidate = newToken();
      const { data: inserted, error: insErr } = await sb
        .from('team_invites')
        .insert({ team_id: org.team_id, token: candidate, created_by: org.id })
        .select('token')
        .single();
      if (insErr || !inserted) {
        return NextResponse.json(
          { error: insErr?.message ?? 'Не удалось создать инвайт' },
          { status: 500 },
        );
      }
      token = inserted.token;
    }

    const body: TeamInviteDto = { token, url: buildTeamJoinLink(token) };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
