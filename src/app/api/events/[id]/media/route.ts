import { NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import type { EventMediaResponse, MediaItemDto } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'team-media';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

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
    isOrganizer: membership.role === 'organizer',
  };
}

function buildPublicUrl(sb: ReturnType<typeof supabaseServer>, path: string): string {
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function safeExt(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}

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

export async function POST(req: Request, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const access = await loadEventAccess(req, id);
    if (!access.found) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }
    const { sb, user, event } = access;

    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: 'Ожидается multipart/form-data' }, { status: 400 });
    }
    const files = form.getAll('files');
    if (files.length === 0) {
      return NextResponse.json({ error: 'Файлы не приложены' }, { status: 400 });
    }

    const uploaded: MediaItemDto[] = [];
    for (const raw of files) {
      if (!(raw instanceof File)) continue;
      const mime = raw.type;
      if (!ALLOWED_MIME.has(mime)) {
        return NextResponse.json(
          { error: 'Можно загружать только JPG, PNG или WebP' },
          { status: 400 },
        );
      }
      if (raw.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: 'Файл больше 10 МБ' },
          { status: 400 },
        );
      }

      const ext = safeExt(mime);
      const filename = `${crypto.randomUUID()}.${ext}`;
      const storagePath = `${event.team_id}/${event.id}/${filename}`;
      const buffer = Buffer.from(await raw.arrayBuffer());

      const { error: upErr } = await sb.storage.from(BUCKET).upload(storagePath, buffer, {
        contentType: mime,
        upsert: false,
      });
      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }

      const { data: inserted, error: insErr } = await sb
        .from('media_items')
        .insert({
          team_id: event.team_id,
          event_id: event.id,
          uploaded_by: user.id,
          storage_path: storagePath,
          type: 'photo',
          mime_type: mime,
        })
        .select('id, created_at')
        .single();
      if (insErr || !inserted) {
        await sb.storage.from(BUCKET).remove([storagePath]);
        return NextResponse.json(
          { error: insErr?.message ?? 'Не удалось сохранить медиа' },
          { status: 500 },
        );
      }

      uploaded.push({
        id: inserted.id,
        url: buildPublicUrl(sb, storagePath),
        width: null,
        height: null,
        mime_type: mime,
        created_at: inserted.created_at ?? new Date().toISOString(),
        uploaded_by: {
          id: user.id,
          first_name: user.first_name ?? null,
          last_name: user.last_name ?? null,
          photo_url: user.photo_url ?? null,
        },
      });
    }

    const body: EventMediaResponse = { items: uploaded };
    return NextResponse.json(body, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
