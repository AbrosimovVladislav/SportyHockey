import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type { SignTeamMediaResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Итерация 41 — signed-upload для логотипа команды.
// Путь: logos/{team_id}/{uuid}.{ext} в bucket team-media. Кропа нет — клиент
// загружает изображение как есть, дизайн-обработка (круглое превью и т.п.) — на UI.

const BUCKET = 'team-media';
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

const Body = z.object({ mime: z.enum(ALLOWED_MIME) });

function safeExt(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}

export async function POST(req: Request): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }

    const ext = safeExt(parsed.data.mime);
    const path = `logos/${org.team_id}/${crypto.randomUUID()}.${ext}`;
    const { data: signed, error: signErr } = await sb.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (signErr || !signed) {
      return NextResponse.json(
        { error: signErr?.message ?? 'Не удалось получить signed URL' },
        { status: 500 },
      );
    }

    const body: SignTeamMediaResponse = {
      path: signed.path,
      signed_url: signed.signedUrl,
      token: signed.token,
      mime: parsed.data.mime,
    };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
