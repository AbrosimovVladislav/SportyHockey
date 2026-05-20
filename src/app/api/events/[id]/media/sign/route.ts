import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import type { SignMediaResponse, SignMediaUpload } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'team-media';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 20;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

const Body = z.object({
  files: z
    .array(
      z.object({
        mime: z.enum(ALLOWED_MIME),
        size: z.number().int().nonnegative().max(MAX_FILE_BYTES),
      }),
    )
    .min(1)
    .max(MAX_FILES),
});

function safeExt(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params): Promise<Response> {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const sb = supabaseServer();

    const { data: event, error: evErr } = await sb
      .from('events')
      .select('id, team_id')
      .eq('id', id)
      .maybeSingle();
    if (evErr) {
      return NextResponse.json({ error: evErr.message }, { status: 500 });
    }
    if (!event) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }
    const { data: membership } = await sb
      .from('team_memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('team_id', event.team_id)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }

    const uploads: SignMediaUpload[] = [];
    for (const f of parsed.data.files) {
      const ext = safeExt(f.mime);
      const path = `${event.team_id}/${event.id}/${crypto.randomUUID()}.${ext}`;
      const { data: signed, error: signErr } = await sb.storage
        .from(BUCKET)
        .createSignedUploadUrl(path);
      if (signErr || !signed) {
        return NextResponse.json(
          { error: signErr?.message ?? 'Не удалось получить signed URL' },
          { status: 500 },
        );
      }
      uploads.push({
        path: signed.path,
        signed_url: signed.signedUrl,
        token: signed.token,
        mime: f.mime,
      });
    }

    const body: SignMediaResponse = { uploads };
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
