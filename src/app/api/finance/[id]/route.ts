import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, resolveActiveTeamId, AuthError } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import {
  FINANCE_SELECT,
  mapFinanceTransaction,
  type RawFinanceRow,
} from '@/lib/finance-mapper';
import type {
  UpdateFinanceResponse,
  DeleteFinanceResponse,
} from '@/types/api';
import type { TablesUpdate } from '@/types/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// Тело PATCH совпадает с POST по полям, но всё опционально. Тип менять нельзя
// (если ошиблись — удалить и создать заново). Доп-валидация делается ниже на
// уже смерженных значениях (см. validateMerged).
const PatchSchema = z.object({
  amount: z.number().positive().optional(),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  category: z.enum(['arena', 'inventory', 'uniform', 'other']).nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  event_id: z.string().uuid().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
});

// PATCH /api/finance/[id] — правка транзакции. Только organizer активной команды.
// Меняется всё кроме `type`.
export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  try {
    const user = await requireUser(req);
    const teamId = await resolveActiveTeamId(req, user.id);
    if (!teamId) {
      return NextResponse.json({ error: 'Активная команда не выбрана' }, { status: 400 });
    }

    const { id } = await params;
    const sb = supabaseServer();
    await assertOrganizer(sb, user.id, teamId);

    // Достаём существующую запись и проверяем принадлежность команде.
    const { data: existing, error: exErr } = await sb
      .from('finance_transactions')
      .select('id, team_id, type, category, user_id, event_id')
      .eq('id', id)
      .maybeSingle();
    if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });
    if (!existing || existing.team_id !== teamId) {
      return NextResponse.json({ error: 'Операция не найдена' }, { status: 404 });
    }

    const json = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? 'Некорректные данные операции' },
        { status: 400 },
      );
    }
    const d = parsed.data;

    // Сливаем патч с существующей записью — валидация работает на финальном
    // состоянии, а не только на присланных полях. Это позволяет, например,
    // прислать только новый amount без повтора user_id и не словить «нужен игрок».
    const merged = {
      type: existing.type,
      category: 'category' in d ? d.category ?? null : existing.category,
      user_id: 'user_id' in d ? d.user_id ?? null : existing.user_id,
      event_id: 'event_id' in d ? d.event_id ?? null : existing.event_id,
    };
    const validationError = validateMerged(merged);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Если user_id меняется на новый — игрок должен состоять в той же команде.
    if (d.user_id && d.user_id !== existing.user_id) {
      const { data: mem, error: memErr } = await sb
        .from('team_memberships')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', d.user_id)
        .maybeSingle();
      if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });
      if (!mem) return NextResponse.json({ error: 'Игрок не в команде' }, { status: 404 });
    }

    // Аналогично — новое событие должно принадлежать команде.
    if (d.event_id && d.event_id !== existing.event_id) {
      const { data: ev, error: evErr } = await sb
        .from('events')
        .select('id, team_id')
        .eq('id', d.event_id)
        .maybeSingle();
      if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 });
      if (!ev || ev.team_id !== teamId) {
        return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
      }
    }

    const update: TablesUpdate<'finance_transactions'> = {};
    if (d.amount !== undefined) update.amount = d.amount;
    if (d.occurred_on !== undefined && d.occurred_on !== null) update.occurred_on = d.occurred_on;
    if ('category' in d) update.category = d.category ?? null;
    if ('user_id' in d) update.user_id = d.user_id ?? null;
    if ('event_id' in d) update.event_id = d.event_id ?? null;
    if ('description' in d) update.description = d.description ?? null;

    const { data: updated, error: updErr } = await sb
      .from('finance_transactions')
      .update(update)
      .eq('id', id)
      .select(FINANCE_SELECT)
      .single();
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    const body: UpdateFinanceResponse = {
      transaction: mapFinanceTransaction(updated as unknown as RawFinanceRow),
    };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

// DELETE /api/finance/[id] — жёсткое удаление. Soft-delete на PoC не нужен.
export async function DELETE(req: Request, { params }: Params): Promise<Response> {
  try {
    const user = await requireUser(req);
    const teamId = await resolveActiveTeamId(req, user.id);
    if (!teamId) {
      return NextResponse.json({ error: 'Активная команда не выбрана' }, { status: 400 });
    }

    const { id } = await params;
    const sb = supabaseServer();
    await assertOrganizer(sb, user.id, teamId);

    const { data: existing, error: exErr } = await sb
      .from('finance_transactions')
      .select('id, team_id')
      .eq('id', id)
      .maybeSingle();
    if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });
    if (!existing || existing.team_id !== teamId) {
      return NextResponse.json({ error: 'Операция не найдена' }, { status: 404 });
    }

    const { error: delErr } = await sb
      .from('finance_transactions')
      .delete()
      .eq('id', id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    const body: DeleteFinanceResponse = { ok: true };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

// Те же правила, что у POST /api/finance: для expense обязательна категория,
// для refund/adjustment — user_id, у не-expense категория запрещена.
function validateMerged(m: {
  type: string;
  category: string | null;
  user_id: string | null;
  event_id: string | null;
}): string | null {
  if (m.type === 'expense') {
    if (!m.category) return 'Категория обязательна для расхода';
    if (m.user_id) return 'У расхода не может быть игрока';
    return null;
  }
  if (m.category) return 'Категория допустима только у расхода';
  if (m.type !== 'player_payment' && !m.user_id) {
    return 'Для возврата и корректировки нужен игрок';
  }
  return null;
}

async function assertOrganizer(
  sb: ReturnType<typeof supabaseServer>,
  userId: string,
  teamId: string,
): Promise<void> {
  const { data, error } = await sb
    .from('team_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .eq('role', 'organizer')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new AuthError('Только организатор команды', 403);
}
