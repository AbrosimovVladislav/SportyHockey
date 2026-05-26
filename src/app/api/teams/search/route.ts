import { NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import type { TeamSearchItem, TeamSearchResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIMIT = 20;

// Поиск команды при онбординге игрока. Пустой запрос — последние команды.
export async function GET(req: Request): Promise<Response> {
  try {
    await requireUser(req);
    const sb = supabaseServer();

    const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';

    let query = sb.from('teams').select('id, name, logo_url').limit(LIMIT);
    if (q) query = query.ilike('name', `%${q}%`);
    query = query.order('created_at', { ascending: false });

    const { data: teams, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ids = (teams ?? []).map((t) => t.id);
    const counts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: members, error: memErr } = await sb
        .from('team_memberships')
        .select('team_id')
        .in('team_id', ids);
      if (memErr) {
        return NextResponse.json({ error: memErr.message }, { status: 500 });
      }
      for (const m of members ?? []) {
        counts.set(m.team_id, (counts.get(m.team_id) ?? 0) + 1);
      }
    }

    const items: TeamSearchItem[] = (teams ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      logo_url: t.logo_url,
      member_count: counts.get(t.id) ?? 0,
    }));

    const body: TeamSearchResponse = { teams: items };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
