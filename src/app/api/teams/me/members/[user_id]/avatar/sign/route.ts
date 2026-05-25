import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthError, requireOrganizer } from '@/lib/auth';
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

export async function POST(
  req: Request,
  ctx: { params: Promise<{ user_id: string }> },
): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();
    const { user_id: memberUserId } = await ctx.params;

    const { data: membership, error: memErr } = await sb
      .from('team_memberships')
      .select('id')
      .eq('team_id', org.team_id)
      .eq('user_id', memberUserId)
      .maybeSingle();
    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }
    if (!membership) {
      return NextResponse.json({ error: 'Игрок не найден в команде' }, { status: 404 });
    }

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }

    const ext = safeExt(parsed.data.mime);
    const path = `avatars/${org.team_id}/${memberUserId}/${crypto.randomUUID()}.${ext}`;
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
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
