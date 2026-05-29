import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type { TablesUpdate } from '@/types/db';
import type {
  TeamSettingsDto,
  TeamSettingsVenue,
  UpdateTeamSettingsRequest,
  UpdateTeamSettingsResponse,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MEDIA_BUCKET = 'team-media';

// Итерация 41 — настройки команды.
// GET — собирает всё, что показывают 4 вкладки (Общее, Роли, События/финансы, Опасная зона).
// PATCH — частичный апдейт: name, logo_path, photo_path, default_venue_id,
//         default_event_cost, default_player_fee.

export async function GET(req: Request): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();

    // Один SELECT — все поля team + join к venues для дефолтной арены.
    const { data: team, error } = await sb
      .from('teams')
      .select(
        `id, name, logo_url, photo_url,
         default_event_cost, default_player_fee, archived_at,
         default_venue:venues!teams_default_venue_id_fkey ( id, name, address )`,
      )
      .eq('id', org.team_id)
      .single();
    if (error || !team) {
      return NextResponse.json(
        { error: error?.message ?? 'Команда не найдена' },
        { status: 500 },
      );
    }

    // PostgREST возвращает join либо объектом, либо массивом — нормализуем.
    const rawVenue = team.default_venue as TeamSettingsVenue | TeamSettingsVenue[] | null;
    const v = Array.isArray(rawVenue) ? (rawVenue[0] ?? null) : rawVenue;
    const venue: TeamSettingsVenue | null = v
      ? { id: v.id, name: v.name, address: v.address ?? null }
      : null;

    const body: TeamSettingsDto = {
      team_id: team.id,
      name: team.name,
      logo_url: team.logo_url,
      photo_url: team.photo_url,
      default_venue: venue,
      default_event_cost: team.default_event_cost,
      default_player_fee: team.default_player_fee,
      archived_at: team.archived_at,
    };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

const PatchBody = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  // logo_path/photo_path — путь в bucket team-media после signed-upload.
  // null — удалить (отвязать) изображение; undefined — не менять.
  logo_path: z.string().max(300).nullable().optional(),
  photo_path: z.string().max(300).nullable().optional(),
  default_venue_id: z.string().uuid().nullable().optional(),
  default_event_cost: z.number().min(0).max(10_000_000).nullable().optional(),
  default_player_fee: z.number().min(0).max(10_000_000).nullable().optional(),
}) satisfies z.ZodType<UpdateTeamSettingsRequest>;

export async function PATCH(req: Request): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();

    const json = await req.json().catch(() => null);
    const parsed = PatchBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные настройки' }, { status: 400 });
    }
    const d = parsed.data;

    const update: TablesUpdate<'teams'> = {};
    if (d.name !== undefined) update.name = d.name;
    if (d.logo_path !== undefined) {
      update.logo_url = d.logo_path
        ? sb.storage.from(MEDIA_BUCKET).getPublicUrl(d.logo_path).data.publicUrl
        : null;
    }
    if (d.photo_path !== undefined) {
      update.photo_url = d.photo_path
        ? sb.storage.from(MEDIA_BUCKET).getPublicUrl(d.photo_path).data.publicUrl
        : null;
    }
    if (d.default_venue_id !== undefined) update.default_venue_id = d.default_venue_id;
    if (d.default_event_cost !== undefined) update.default_event_cost = d.default_event_cost;
    if (d.default_player_fee !== undefined) update.default_player_fee = d.default_player_fee;

    if (Object.keys(update).length === 0) {
      const body: UpdateTeamSettingsResponse = { ok: true };
      return NextResponse.json(body);
    }

    const { error: updErr } = await sb.from('teams').update(update).eq('id', org.team_id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    const body: UpdateTeamSettingsResponse = { ok: true };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
