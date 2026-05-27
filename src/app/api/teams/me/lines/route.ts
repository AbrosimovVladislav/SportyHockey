import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { getUserTeamId } from '@/lib/user-team';
import { asLineSlot, LINE_SLOT_REGEX } from '@/lib/event-lines';
import type { TeamDefaultLineEntry, TeamLinesResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();

    const teamId = await getUserTeamId(user.id, req);
    if (!teamId) {
      return NextResponse.json({ error: 'Команды нет' }, { status: 404 });
    }

    const { data, error } = await sb
      .from('team_default_lines')
      .select('user_id, slot')
      .eq('team_id', teamId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const lines: TeamDefaultLineEntry[] = [];
    for (const r of data ?? []) {
      const slot = asLineSlot(r.slot);
      if (slot) lines.push({ user_id: r.user_id, slot });
    }

    const body: TeamLinesResponse = { lines };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

const Body = z.object({
  user_id: z.string().uuid(),
  slot: z.string().regex(LINE_SLOT_REGEX).nullable(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    // Дефолтный состав команды двигает только организатор.
    const ctx = await requireOrganizer(req);
    const teamId = ctx.team_id;

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные данные звена' }, { status: 400 });
    }

    const sb = supabaseServer();

    const { data: mem } = await sb
      .from('team_memberships')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', parsed.data.user_id)
      .maybeSingle();
    if (!mem) {
      return NextResponse.json({ error: 'Игрок не в команде' }, { status: 404 });
    }

    if (parsed.data.slot === null) {
      const { error } = await sb
        .from('team_default_lines')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', parsed.data.user_id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    const userId = parsed.data.user_id;
    const targetSlot = parsed.data.slot;

    // Текущий слот перетаскиваемого игрока и тот, кто уже стоит на целевом слоте.
    const { data: existing, error: selErr } = await sb
      .from('team_default_lines')
      .select('user_id, slot')
      .eq('team_id', teamId)
      .or(`user_id.eq.${userId},slot.eq.${targetSlot}`);
    if (selErr) {
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }
    const sourceSlot = existing?.find((r) => r.user_id === userId)?.slot ?? null;
    const occupant =
      existing?.find((r) => r.slot === targetSlot && r.user_id !== userId)?.user_id ?? null;

    // Освобождаем обе задействованные записи.
    const { error: delErr } = await sb
      .from('team_default_lines')
      .delete()
      .eq('team_id', teamId)
      .or(`user_id.eq.${userId},slot.eq.${targetSlot}`);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    const now = new Date().toISOString();
    const rows = [{ team_id: teamId, user_id: userId, slot: targetSlot, updated_at: now }];
    // Если оба были в звеньях — меняем их местами. Иначе прежний владелец слота уходит в запасные.
    if (occupant && sourceSlot) {
      rows.push({ team_id: teamId, user_id: occupant, slot: sourceSlot, updated_at: now });
    }

    const { error: insErr } = await sb.from('team_default_lines').insert(rows);
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
