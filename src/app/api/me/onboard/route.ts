import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { normStr, normTelegramUsername } from '@/lib/normalize-contact';
import type { TablesUpdate } from '@/types/db';
import type { OnboardResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MEDIA_BUCKET = 'team-media';

const Body = z.object({
  first_name: z.string().max(100).nullable().optional(),
  last_name: z.string().max(100).nullable().optional(),
  birth_date: z.string().max(20).nullable().optional(),
  shoots: z.enum(['left', 'right']).nullable().optional(),
  avatar_path: z.string().max(300).nullable().optional(),
  username: z.string().max(100).nullable().optional(),
  join_team_id: z.string().uuid().nullable().optional(),
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Завершение онбординга. Flow 1 (игрок сам): обновляет профиль + создаёт заявку в join_team_id.
// Flow 2 (приглашённый): просто подтверждает профиль (членство уже есть).
export async function POST(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }
    const d = parsed.data;

    const update: TablesUpdate<'users'> = { onboarded: true };
    if (d.first_name !== undefined) update.first_name = normStr(d.first_name);
    if (d.last_name !== undefined) update.last_name = normStr(d.last_name);
    if (d.birth_date !== undefined) update.birth_date = normStr(d.birth_date);
    if (d.shoots !== undefined) update.shoots = d.shoots;
    if (d.username !== undefined) update.username = normTelegramUsername(d.username);
    if (d.avatar_path) {
      update.avatar_url = sb.storage.from(MEDIA_BUCKET).getPublicUrl(d.avatar_path).data.publicUrl;
    }

    const { error: userErr } = await sb.from('users').update(update).eq('id', user.id);
    if (userErr) {
      return NextResponse.json({ error: userErr.message }, { status: 500 });
    }

    // Заявка на вступление — только при самостоятельном приходе игрока без членства.
    if (d.join_team_id && UUID_RE.test(d.join_team_id)) {
      const teamId = d.join_team_id;

      const { data: team } = await sb.from('teams').select('id').eq('id', teamId).maybeSingle();
      if (!team) {
        return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 });
      }

      const { data: membership } = await sb
        .from('team_memberships')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        const { data: existing } = await sb
          .from('team_join_requests')
          .select('id')
          .eq('team_id', teamId)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();
        if (!existing) {
          const { error: reqErr } = await sb.from('team_join_requests').insert({
            team_id: teamId,
            user_id: user.id,
            kind: 'request',
            created_by: user.id,
          });
          if (reqErr) {
            return NextResponse.json({ error: reqErr.message }, { status: 500 });
          }
        }
      }
    }

    const body: OnboardResponse = { ok: true };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
