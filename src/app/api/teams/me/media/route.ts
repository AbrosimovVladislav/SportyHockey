import { NextResponse } from 'next/server';
import { z } from 'zod';
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
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

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

    // Left-join на events: в выдачу попадают и медиа без события (загруженные прямо
    // в общую галерею). Фильтр по дате при этом отсекает «общие» — у них нет даты.
    let query = sb
      .from('media_items')
      .select(
        `id, storage_path, mime_type, created_at, event_id,
         uploader:users!media_items_uploaded_by_fkey(id, first_name, last_name, photo_url, avatar_url),
         event:events!media_items_event_id_fkey(id, type, title, starts_at, ends_at, venue:venues(name))`,
      )
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (from) query = query.gte('event.starts_at', from).not('event_id', 'is', null);
    if (to) query = query.lte('event.starts_at', to).not('event_id', 'is', null);

    const { data: rows, error: rowsErr } = await query;
    if (rowsErr) {
      return NextResponse.json({ error: rowsErr.message }, { status: 500 });
    }

    const items: TeamMediaItemDto[] = (rows ?? []).map((r) => {
      const u = Array.isArray(r.uploader) ? r.uploader[0] : r.uploader;
      const e = Array.isArray(r.event) ? r.event[0] : r.event;
      const v = e ? (Array.isArray(e.venue) ? e.venue[0] : e.venue) : null;
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
        event: e
          ? {
              id: e.id,
              type: asEventType(e.type),
              title: e.title ?? null,
              starts_at: e.starts_at,
              ends_at: e.ends_at ?? null,
              venue: v ? { name: v.name } : null,
            }
          : null,
      } satisfies TeamMediaItemDto;
    });

    const body: TeamMediaResponse = { items };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

const CommitBody = z.object({
  items: z
    .array(
      z.object({
        path: z.string().min(1),
        mime: z.enum(ALLOWED_MIME),
      }),
    )
    .min(1)
    .max(20),
});

// Commit загрузки в общую галерею команды — без привязки к событию.
// Фронт уже залил файлы в Supabase Storage через signed URL (/sign), сюда передаёт
// массив {path, mime}. Путь должен начинаться с `{team_id}/general/`.
export async function POST(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();
    const teamId = await getUserTeamId(user.id, req);
    if (!teamId) {
      return NextResponse.json({ error: 'Команды нет' }, { status: 404 });
    }

    const json = await req.json().catch(() => null);
    const parsed = CommitBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }

    const expectedPrefix = `${teamId}/general/`;
    for (const it of parsed.data.items) {
      if (!it.path.startsWith(expectedPrefix)) {
        return NextResponse.json({ error: 'Некорректный путь файла' }, { status: 400 });
      }
    }

    const rows = parsed.data.items.map((it) => ({
      team_id: teamId,
      event_id: null,
      uploaded_by: user.id,
      storage_path: it.path,
      type: 'photo',
      mime_type: it.mime,
    }));

    const { data: inserted, error: insErr } = await sb
      .from('media_items')
      .insert(rows)
      .select('id, storage_path, mime_type, created_at');
    if (insErr || !inserted) {
      const paths = parsed.data.items.map((it) => it.path);
      await sb.storage.from(BUCKET).remove(paths);
      return NextResponse.json(
        { error: insErr?.message ?? 'Не удалось сохранить медиа' },
        { status: 500 },
      );
    }

    // Аватар загрузившего: кастомный важнее Telegram-фото.
    const { data: uploaderProfile } = await sb
      .from('users')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    const uploaderPhoto = uploaderProfile?.avatar_url ?? user.photo_url ?? null;

    const items: TeamMediaItemDto[] = inserted.map((r) => ({
      id: r.id,
      url: buildPublicUrl(sb, r.storage_path),
      mime_type: r.mime_type ?? null,
      created_at: r.created_at ?? new Date().toISOString(),
      uploaded_by: {
        id: user.id,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        photo_url: uploaderPhoto,
      },
      event: null,
    }));

    const body: TeamMediaResponse = { items };
    return NextResponse.json(body, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
}
