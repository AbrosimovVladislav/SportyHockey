import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import type { HomeActionsResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Контекст для quick-actions на главной (v0.6, итерация 63):
//   • last_past_event_id  — последнее не-отменённое событие, у которого
//     `starts_at < now`. Цель плитки «Отметить оплаты» — открывает это
//     событие. NULL → плитка неактивна.
//   • last_past_game_id   — то же, но только `type='game'`. Цель «Записать
//     результат» — открывает экран result последней игры.
//   • pending_requests_count — заявки на вступление в активную команду
//     в статусе `pending`. Показываем бейджем на плитке «Заявки».
//
// Один эндпоинт вместо трёх отдельных — на главной всё это нужно одновременно.
// Запросы внутри идут параллельно, чтобы дайджест загружался одним кругом.
export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const teamId = await getUserTeamId(user.id, req);
    if (!teamId) {
      const empty: HomeActionsResponse = {
        last_past_event_id: null,
        last_past_game_id: null,
        pending_requests_count: 0,
      };
      return NextResponse.json(empty);
    }

    const sb = supabaseServer();
    const nowIso = new Date().toISOString();

    const [pastEventRes, pastGameRes, reqRes] = await Promise.all([
      sb
        .from('events')
        .select('id')
        .eq('team_id', teamId)
        .neq('status', 'cancelled')
        .lt('starts_at', nowIso)
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      sb
        .from('events')
        .select('id')
        .eq('team_id', teamId)
        .eq('type', 'game')
        .neq('status', 'cancelled')
        .lt('starts_at', nowIso)
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      sb
        .from('team_join_requests')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('kind', 'request')
        .eq('status', 'pending'),
    ]);

    if (pastEventRes.error) {
      return NextResponse.json({ error: pastEventRes.error.message }, { status: 500 });
    }
    if (pastGameRes.error) {
      return NextResponse.json({ error: pastGameRes.error.message }, { status: 500 });
    }
    if (reqRes.error) {
      return NextResponse.json({ error: reqRes.error.message }, { status: 500 });
    }

    const body: HomeActionsResponse = {
      last_past_event_id: pastEventRes.data?.id ?? null,
      last_past_game_id: pastGameRes.data?.id ?? null,
      pending_requests_count: reqRes.count ?? 0,
    };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
