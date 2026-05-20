import { NextResponse } from 'next/server';
import { AuthError, requireUser } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'team-media';

type Params = { params: Promise<{ id: string; mediaId: string }> };

export async function DELETE(req: Request, { params }: Params): Promise<Response> {
  try {
    const user = await requireUser(req);
    const { id: eventId, mediaId } = await params;
    const sb = supabaseServer();

    const { data: media, error: mediaErr } = await sb
      .from('media_items')
      .select('id, event_id, team_id, uploaded_by, storage_path')
      .eq('id', mediaId)
      .maybeSingle();
    if (mediaErr) {
      return NextResponse.json({ error: mediaErr.message }, { status: 500 });
    }
    if (!media || media.event_id !== eventId) {
      return NextResponse.json({ error: 'Медиа не найдено' }, { status: 404 });
    }

    const { data: membership } = await sb
      .from('team_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('team_id', media.team_id)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: 'Медиа не найдено' }, { status: 404 });
    }

    const isOrganizer = membership.role === 'organizer';
    const isUploader = media.uploaded_by === user.id;
    if (!isOrganizer && !isUploader) {
      return NextResponse.json(
        { error: 'Удалять может только загрузивший или организатор' },
        { status: 403 },
      );
    }

    const { error: delDbErr } = await sb.from('media_items').delete().eq('id', mediaId);
    if (delDbErr) {
      return NextResponse.json({ error: delDbErr.message }, { status: 500 });
    }
    await sb.storage.from(BUCKET).remove([media.storage_path]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
