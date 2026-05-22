import { NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import type { VenueDto, VenuesListResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Площадки — общий справочник, не привязанный к команде. У команды будет
// «домашняя площадка» как ссылка (teams.home_venue_id, отдельная задача),
// но сами площадки доступны всем для выбора.
export async function GET(req: Request): Promise<Response> {
  try {
    await requireUser(req);
    const sb = supabaseServer();
    const { data, error } = await sb
      .from('venues')
      .select('id, name, address, default_cost_per_player, cost_per_arena')
      .order('name', { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const venues: VenueDto[] = (data ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      address: v.address,
      default_cost_per_player:
        v.default_cost_per_player != null ? Number(v.default_cost_per_player) : null,
      cost_per_arena: v.cost_per_arena != null ? Number(v.cost_per_arena) : null,
    }));
    const body: VenuesListResponse = { venues };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
