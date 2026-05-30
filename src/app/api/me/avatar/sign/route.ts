import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type { SignAvatarResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'team-media';
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

const Body = z.object({ mime: z.enum(ALLOWED_MIME) });

function safeExt(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}

// Signed-upload для аватара, который игрок загружает сам в своём профиле
// (v0.4). Путь — `avatars/me/{user_id}/{uuid}.{ext}`: команда-агностичен,
// чтобы аватар не зависел от активной команды (он общий для всех).
export async function POST(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }

    const ext = safeExt(parsed.data.mime);
    const path = `avatars/me/${user.id}/${crypto.randomUUID()}.${ext}`;
    const { data: signed, error: signErr } = await sb.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (signErr || !signed) {
      return NextResponse.json(
        { error: signErr?.message ?? 'Не удалось получить signed URL' },
        { status: 500 },
      );
    }

    const body: SignAvatarResponse = {
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
