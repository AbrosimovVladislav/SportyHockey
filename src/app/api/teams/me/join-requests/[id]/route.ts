import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type { JoinRequestDecisionResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ action: z.enum(['approve', 'reject']) });

// Решение организатора по заявке: approve → создаём членство, reject → закрываем.
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const sb = supabaseServer();
    const { id } = await ctx.params;

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректное действие' }, { status: 400 });
    }

    const { data: request, error: reqErr } = await sb
      .from('team_join_requests')
      .select('id, team_id, user_id, status, kind')
      .eq('id', id)
      .maybeSingle();
    if (reqErr) {
      return NextResponse.json({ error: reqErr.message }, { status: 500 });
    }
    if (!request || request.team_id !== org.team_id || request.kind !== 'request') {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
    }
    if (request.status !== 'pending') {
      return NextResponse.json({ error: 'Заявка уже обработана' }, { status: 409 });
    }

    if (parsed.data.action === 'approve') {
      const { data: membership } = await sb
        .from('team_memberships')
        .select('id')
        .eq('team_id', request.team_id)
        .eq('user_id', request.user_id)
        .maybeSingle();
      if (!membership) {
        const { error: insErr } = await sb
          .from('team_memberships')
          .insert({ team_id: request.team_id, user_id: request.user_id, role: 'player' });
        if (insErr) {
          return NextResponse.json({ error: insErr.message }, { status: 500 });
        }
      }
    }

    const { error: updErr } = await sb
      .from('team_join_requests')
      .update({
        status: parsed.data.action === 'approve' ? 'approved' : 'rejected',
        decided_by: org.id,
        decided_at: new Date().toISOString(),
      })
      .eq('id', request.id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    const body: JoinRequestDecisionResponse = { ok: true };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
