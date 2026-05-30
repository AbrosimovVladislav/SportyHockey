import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type {
  JoinRequestItem,
  JoinRequestStatus,
  JoinRequestsResponse,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UserRef = {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  avatar_url: string | null;
};

function pickUser(raw: UserRef | UserRef[] | null): UserRef | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

function parseStatus(input: string | null): 'pending' | 'all' {
  return input === 'pending' ? 'pending' : 'all';
}

function asStatus(raw: string): JoinRequestStatus {
  return raw === 'approved' || raw === 'rejected' ? raw : 'pending';
}

// Заявки на вступление (kind='request'):
//   ?status=pending — только ожидающие (для pop-up в профиле организатора)
//   ?status=all (default) — вся история, сортировка по created_at desc
//                            (для экрана /squad/requests)
export async function GET(req: Request): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();

    const url = new URL(req.url);
    const filter = parseStatus(url.searchParams.get('status'));

    let q = sb
      .from('team_join_requests')
      .select(
        'id, user_id, status, decided_at, created_at, applicant:users!team_join_requests_user_id_fkey(first_name, last_name, username, photo_url, avatar_url)',
      )
      .eq('team_id', org.team_id)
      .eq('kind', 'request');

    if (filter === 'pending') {
      q = q.eq('status', 'pending').order('created_at', { ascending: true });
    } else {
      q = q.order('created_at', { ascending: false });
    }

    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const requests: JoinRequestItem[] = (data ?? []).map((r) => {
      const u = pickUser(r.applicant as UserRef | UserRef[] | null);
      return {
        id: r.id,
        user_id: r.user_id,
        first_name: u?.first_name ?? null,
        last_name: u?.last_name ?? null,
        username: u?.username ?? null,
        photo_url: u?.photo_url ?? null,
        avatar_url: u?.avatar_url ?? null,
        status: asStatus(r.status),
        decided_at: r.decided_at,
        created_at: r.created_at,
      };
    });

    const body: JoinRequestsResponse = { requests };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
