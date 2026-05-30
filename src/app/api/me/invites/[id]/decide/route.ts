import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type { MyInviteDecisionResponse } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ action: z.enum(['approve', 'reject']) });

// Игрок принимает или отклоняет приглашение, направленное ему командой
// (kind='invite'). approve → создаёт membership с role='player', обновляет
// заявку. reject → закрывает заявку. Только сам приглашённый игрок может
// решать — поэтому ищем заявку по user_id = me.id и kind='invite'.
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = await requireUser(req);
    const sb = supabaseServer();
    const { id } = await ctx.params;

    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректное действие' }, { status: 400 });
    }

    const { data: invite, error: invErr } = await sb
      .from('team_join_requests')
      .select('id, team_id, user_id, kind, status')
      .eq('id', id)
      .maybeSingle();
    if (invErr) {
      return NextResponse.json({ error: invErr.message }, { status: 500 });
    }
    if (!invite || invite.user_id !== user.id || invite.kind !== 'invite') {
      return NextResponse.json({ error: 'Приглашение не найдено' }, { status: 404 });
    }
    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Приглашение уже обработано' }, { status: 409 });
    }

    if (parsed.data.action === 'approve') {
      // Если уже в команде (например, через ссылку) — просто закрываем приглашение
      // как принятое; повторно строки в team_memberships не добавляем.
      const { data: existing } = await sb
        .from('team_memberships')
        .select('id')
        .eq('team_id', invite.team_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!existing) {
        const { error: insErr } = await sb
          .from('team_memberships')
          .insert({ team_id: invite.team_id, user_id: user.id, role: 'player' });
        if (insErr) {
          return NextResponse.json({ error: insErr.message }, { status: 500 });
        }
      }
    }

    const status = parsed.data.action === 'approve' ? 'approved' : 'rejected';
    const { error: updErr } = await sb
      .from('team_join_requests')
      .update({ status, decided_by: user.id, decided_at: new Date().toISOString() })
      .eq('id', invite.id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    const body: MyInviteDecisionResponse = {
      ok: true,
      team_id: invite.team_id,
      status,
    };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
