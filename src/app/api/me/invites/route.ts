import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type {
  JoinRequestStatus,
  MyInviteItem,
  MyInviteKind,
  MyInvitesResponse,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TeamRef = { id: string; name: string; logo_url: string | null } | { id: string; name: string; logo_url: string | null }[] | null;

function pickTeam(raw: TeamRef): { id: string; name: string; logo_url: string | null } | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

function asKind(raw: string): MyInviteKind {
  return raw === 'invite' ? 'invite' : 'request';
}

function asStatus(raw: string): JoinRequestStatus {
  return raw === 'approved' || raw === 'rejected' ? raw : 'pending';
}

// Личный инбокс игрока: все записи в team_join_requests, где user_id = me.id.
// Сортировка — created_at desc. Возвращаем kind ('invite' | 'request') и
// статус — фронт сам делит на «Входящие» (kind='invite') и «Исходящие»
// (kind='request') по табам в UI.
export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const { data, error } = await sb
      .from('team_join_requests')
      .select(
        'id, team_id, kind, status, decided_at, created_at, teams(id, name, logo_url)',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items: MyInviteItem[] = (data ?? []).map((r) => {
      const team = pickTeam(r.teams as TeamRef);
      return {
        id: r.id,
        team_id: r.team_id,
        team_name: team?.name ?? '',
        team_logo_url: team?.logo_url ?? null,
        kind: asKind(r.kind),
        status: asStatus(r.status),
        decided_at: r.decided_at,
        created_at: r.created_at,
      };
    });

    const body: MyInvitesResponse = { items };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
