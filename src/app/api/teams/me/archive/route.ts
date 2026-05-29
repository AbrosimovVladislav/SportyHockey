import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type { ArchiveTeamResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Итерация 41 — soft-archive команды. Просто проставляем archived_at = now().
// Что именно недоступно в архивированной команде, кто видит, как разархивировать —
// post-MVP (см. post-mvp.md → «Поведение архивированной команды»).

export async function POST(req: Request): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();

    const archivedAt = new Date().toISOString();
    const { error } = await sb
      .from('teams')
      .update({ archived_at: archivedAt })
      .eq('id', org.team_id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const body: ArchiveTeamResponse = { ok: true, archived_at: archivedAt };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
