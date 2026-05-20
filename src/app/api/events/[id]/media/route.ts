import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import type { EventMediaResponse, MediaItemDto } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'team-media';
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

type Params = { params: Promise<{ id: string }> };

async function loadEventAccess(req: Request, eventId: string) {
  const user = await requireUser(req);
  const sb = supabaseServer();
  const { data: event, error } = await sb
    .from('events')
    .select('id, team_id')
    .eq('id', eventId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!event) return { found: false as const };
  const { data: membership } = await sb
    .from('team_memberships')
    .select('id, role')
    .eq('user_id', user.id)
    .eq('team_id', event.team_id)
    .maybeSingle();
  if (!membership) return { found: false as const };
  return {
    found: true as const,
    sb,
    user,
    event,
  };
}

function buildPublicUrl(sb: ReturnType<typeof supabaseServer>, path: string): string {
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
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

export async function GET(req: Request, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const access = await loadEventAccess(req, id);
    if (!access.found) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }
    const { sb, event } = access;

    const { data: rows, error: rowsErr } = await sb
      .from('media_items')
      .select(
        'id, storage_path, width, height, mime_type, created_at, uploaded_by, uploader:users!media_items_uploaded_by_fkey(id, first_name, last_name, photo_url)',
      )
      .eq('event_id', event.id)
      .order('created_at', { ascending: false });
    if (rowsErr) {
      return NextResponse.json({ error: rowsErr.message }, { status: 500 });
    }

    const items: MediaItemDto[] = (rows ?? []).map((r) => {
      const u = Array.isArray(r.uploader) ? r.uploader[0] : r.uploader;
      return {
        id: r.id,
        url: buildPublicUrl(sb, r.storage_path),
        width: r.width,
        height: r.height,
        mime_type: r.mime_type ?? null,
        created_at: r.created_at ?? new Date().toISOString(),
        uploaded_by: u
          ? {
              id: u.id,
              first_name: u.first_name ?? null,
              last_name: u.last_name ?? null,
              photo_url: u.photo_url ?? null,
            }
          : null,
      };
    });

    const body: EventMediaResponse = { items };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

// Commit: фронт уже загрузил файлы напрямую в Supabase Storage через signed URL
// (см. /sign), сюда передаёт массив {path, mime} — создаём записи в media_items.
export async function POST(req: Request, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const access = await loadEventAccess(req, id);
    if (!access.found) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }
    const { sb, user, event } = access;

    const json = await req.json().catch(() => null);
    const parsed = CommitBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }

    // Защита: path должен принадлежать этому событию (префикс `{team_id}/{event_id}/`).
    const expectedPrefix = `${event.team_id}/${event.id}/`;
    for (const it of parsed.data.items) {
      if (!it.path.startsWith(expectedPrefix)) {
        return NextResponse.json({ error: 'Некорректный путь файла' }, { status: 400 });
      }
    }

    const rows = parsed.data.items.map((it) => ({
      team_id: event.team_id,
      event_id: event.id,
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

    const items: MediaItemDto[] = inserted.map((r) => ({
      id: r.id,
      url: buildPublicUrl(sb, r.storage_path),
      width: null,
      height: null,
      mime_type: r.mime_type ?? null,
      created_at: r.created_at ?? new Date().toISOString(),
      uploaded_by: {
        id: user.id,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        photo_url: user.photo_url ?? null,
      },
    }));

    const body: EventMediaResponse = { items };
    return NextResponse.json(body, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
