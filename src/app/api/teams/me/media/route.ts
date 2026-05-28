import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import type {
  TeamMediaItemDto,
  TeamMediaResponse,
  EventType,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'team-media';

function buildPublicUrl(sb: ReturnType<typeof supabaseServer>, path: string): string {
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function asEventType(value: string | null | undefined): EventType {
  return value === 'game' ? 'game' : 'training';
}

// Дату с фронта (YYYY-MM-DD) приводим к ISO-границам дня, чтобы фильтр был включительным.
function dayBoundary(value: string | null, side: 'from' | 'to'): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return side === 'from' ? `${value}T00:00:00.000Z` : `${value}T23:59:59.999Z`;
}

// Общая галерея команды: все медиа со всех событий, с информацией о событии
// (для шапки просмотрщика) и о загрузившем (для аватарки на превью).
// Фильтр по диапазону `events.starts_at` — оба параметра опциональны.
export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const teamId = await getUserTeamId(user.id, req);
    if (!teamId) {
      return NextResponse.json({ error: 'Команды нет' }, { status: 404 });
    }

    const url = new URL(req.url);
    const from = dayBoundary(url.searchParams.get('from'), 'from');
    const to = dayBoundary(url.searchParams.get('to'), 'to');

    let query = sb
      .from('media_items')
      .select(
        `id, storage_path, mime_type, created_at,
         uploader:users!media_items_uploaded_by_fkey(id, first_name, last_name, photo_url, avatar_url),
         event:events!inner(id, type, title, starts_at, ends_at, venue:venues(name))`,
      )
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (from) query = query.gte('event.starts_at', from);
    if (to) query = query.lte('event.starts_at', to);

    const { data: rows, error: rowsErr } = await query;
    if (rowsErr) {
      return NextResponse.json({ error: rowsErr.message }, { status: 500 });
    }

    const items: TeamMediaItemDto[] = (rows ?? [])
      .map((r) => {
        const u = Array.isArray(r.uploader) ? r.uploader[0] : r.uploader;
        const e = Array.isArray(r.event) ? r.event[0] : r.event;
        if (!e) return null;
        const v = Array.isArray(e.venue) ? e.venue[0] : e.venue;
        return {
          id: r.id,
          url: buildPublicUrl(sb, r.storage_path),
          mime_type: r.mime_type ?? null,
          created_at: r.created_at ?? new Date().toISOString(),
          uploaded_by: u
            ? {
                id: u.id,
                first_name: u.first_name ?? null,
                last_name: u.last_name ?? null,
                photo_url: u.avatar_url ?? u.photo_url ?? null,
              }
            : null,
          event: {
            id: e.id,
            type: asEventType(e.type),
            title: e.title ?? null,
            starts_at: e.starts_at,
            ends_at: e.ends_at ?? null,
            venue: v ? { name: v.name } : null,
          },
        } satisfies TeamMediaItemDto;
      })
      .filter((x): x is TeamMediaItemDto => x !== null);

    const body: TeamMediaResponse = { items };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
