import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, requireOrganizer, resolveActiveTeamId } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type {
  SectionImageKey,
  SetTeamSectionImageRequest,
  SetTeamSectionImageResponse,
  TeamSectionImagesResponse,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MEDIA_BUCKET = 'team-media';
const SECTIONS: SectionImageKey[] = ['home', 'team', 'events_list', 'money'];

function emptyMap(): TeamSectionImagesResponse {
  return {
    home: null,
    team: null,
    events_list: null,
    money: null,
  };
}

async function loadMap(
  sb: ReturnType<typeof supabaseServer>,
  teamId: string,
): Promise<TeamSectionImagesResponse> {
  const { data, error } = await sb
    .from('team_section_images')
    .select('section, image_url')
    .eq('team_id', teamId);
  if (error) throw new Error(error.message);
  const out = emptyMap();
  for (const r of data ?? []) {
    if ((SECTIONS as string[]).includes(r.section)) {
      out[r.section as SectionImageKey] = r.image_url;
    }
  }
  return out;
}

// GET — текущая мапа картинок разделов для активной команды (доступно всем
// участникам, включая игроков — картинки показываются у всех).
export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const teamId = await resolveActiveTeamId(req, user.id);
    if (!teamId) {
      return NextResponse.json({ error: 'Активная команда не выбрана' }, { status: 400 });
    }
    const sb = supabaseServer();
    const body = await loadMap(sb, teamId);
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

const PatchBody = z.object({
  section: z.enum(['home', 'team', 'events_list', 'money']),
  path: z.string().max(300).nullable(),
}) satisfies z.ZodType<SetTeamSectionImageRequest>;

// PATCH — установить или сбросить картинку конкретного раздела.
// path=null → удалить запись и вернуть мапу с null для этого раздела;
// path=<string> → апсерт + public URL по этому пути.
export async function PATCH(req: Request): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();

    const json = await req.json().catch(() => null);
    const parsed = PatchBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }
    const { section, path } = parsed.data;

    if (path === null) {
      const { error } = await sb
        .from('team_section_images')
        .delete()
        .eq('team_id', org.team_id)
        .eq('section', section);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const publicUrl = sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
      const { error } = await sb
        .from('team_section_images')
        .upsert(
          { team_id: org.team_id, section, image_url: publicUrl, uploaded_at: new Date().toISOString() },
          { onConflict: 'team_id,section' },
        );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const body: SetTeamSectionImageResponse = await loadMap(sb, org.team_id);
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
