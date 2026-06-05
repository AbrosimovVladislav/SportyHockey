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
import { syncArenaPaidAmount, syncArenaPaidAmountForChange } from '@/lib/sync-arena-paid';
import { legacyToLedger } from '@/lib/finance-ledger';
import {
  currentOnHand,
  insufficientOnHandMessage,
  onHandDelta,
  todayIso,
} from '@/lib/on-hand-guard';
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
  venue_id: z.string().uuid().nullable().optional(),
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
      .select(
        'id, team_id, type, category, user_id, event_id, amount, occurred_on, to_venue_id',
      )
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
      // venue_id явно не хранится в старой схеме — берём только если прислали,
      // и используем как fallback для арендного депозита без события. Если
      // event_id остаётся прежним, venue вытянется из события.
      venue_id: 'venue_id' in d ? d.venue_id ?? null : existing.to_venue_id,
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

    // Аналогично — новое событие должно принадлежать команде. Заодно получаем
    // venue_id и arena_cost для ledger-маппинга и 409.
    let eventVenueId: string | null = null;
    let eventArenaCost: number | null = null;
    if (merged.event_id) {
      const { data: ev, error: evErr } = await sb
        .from('events')
        .select('id, team_id, venue_id, arena_cost')
        .eq('id', merged.event_id)
        .maybeSingle();
      if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 });
      if (!ev || ev.team_id !== teamId) {
        return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
      }
      eventVenueId = ev.venue_id;
      eventArenaCost = ev.arena_cost != null ? Number(ev.arena_cost) : null;
    }

    // Если задан venue_id (для депозита площадке) — площадка должна существовать.
    if (merged.venue_id && !merged.event_id) {
      const { data: v, error: vErr } = await sb
        .from('venues')
        .select('id')
        .eq('id', merged.venue_id)
        .maybeSingle();
      if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });
      if (!v) return NextResponse.json({ error: 'Площадка не найдена' }, { status: 404 });
    }

    // Раскладываем merged в ledger-поля и пишем их в update.
    const ledger = legacyToLedger(
      {
        type: merged.type as 'player_payment' | 'expense' | 'refund' | 'adjustment',
        category: merged.category as 'arena' | 'inventory' | 'uniform' | 'other' | null,
        user_id: merged.user_id,
        event_id: merged.event_id,
        venue_id: merged.venue_id,
      },
      eventVenueId,
    );
    if (!ledger.ok) {
      return NextResponse.json({ error: ledger.error }, { status: 400 });
    }

    // Проверка переплаты события: суммарная оплата по событию (без этой
    // транзакции) + новая сумма не должна превышать arena_cost.
    const newAmount = d.amount ?? Number(existing.amount);
    if (
      merged.type === 'expense' &&
      merged.category === 'arena' &&
      merged.event_id &&
      eventArenaCost != null &&
      eventArenaCost > 0
    ) {
      const { data: paidRows, error: paidErr } = await sb
        .from('finance_transactions')
        .select('amount')
        .eq('team_id', teamId)
        .eq('event_id', merged.event_id)
        .eq('to_kind', 'venue')
        .neq('id', id);
      if (paidErr) return NextResponse.json({ error: paidErr.message }, { status: 500 });
      const alreadyPaid = (paidRows ?? []).reduce(
        (acc, row) => acc + Number(row.amount || 0),
        0,
      );
      if (alreadyPaid + newAmount > eventArenaCost) {
        return NextResponse.json(
          {
            error:
              'Событие уже оплачено полностью — для дополнительной оплаты площадке создайте депозит без привязки к событию',
          },
          { status: 409 },
        );
      }
    }

    // Проверка кассы: считаем чистое изменение on_hand после применения патча
    // и отказываем, если это уведёт on_hand в минус. Дельта = новый вклад −
    // старый вклад (текущая касса уже учитывает старый вклад).
    const today = todayIso();
    const newOccurredOn =
      d.occurred_on !== undefined && d.occurred_on !== null
        ? d.occurred_on
        : existing.occurred_on;
    const oldDelta = onHandDelta(
      { type: existing.type, amount: existing.amount, occurred_on: existing.occurred_on },
      today,
    );
    const newDelta = onHandDelta(
      { type: existing.type, amount: newAmount, occurred_on: newOccurredOn },
      today,
    );
    const netChange = newDelta - oldDelta;
    if (netChange < 0) {
      const onHand = await currentOnHand(sb, teamId);
      if (onHand + netChange < 0) {
        return NextResponse.json(
          { error: insufficientOnHandMessage(onHand) },
          { status: 400 },
        );
      }
    }

    const update: TablesUpdate<'finance_transactions'> = {};
    if (d.amount !== undefined) update.amount = d.amount;
    if (d.occurred_on !== undefined && d.occurred_on !== null) update.occurred_on = d.occurred_on;
    if ('category' in d) update.category = d.category ?? null;
    if ('user_id' in d) update.user_id = d.user_id ?? null;
    if ('event_id' in d) update.event_id = d.event_id ?? null;
    if ('description' in d) update.description = d.description ?? null;
    // ledger-поля всегда переписываем из адаптера — это устраняет дрейф между
    // зеркалом и ledger при частичном PATCH.
    update.kind = ledger.fields.kind;
    update.from_kind = ledger.fields.from_kind;
    update.to_kind = ledger.fields.to_kind;
    update.from_user_id = ledger.fields.from_user_id;
    update.to_user_id = ledger.fields.to_user_id;
    update.from_venue_id = ledger.fields.from_venue_id;
    update.to_venue_id = ledger.fields.to_venue_id;
    update.external_label = ledger.fields.external_label;

    const { data: updated, error: updErr } = await sb
      .from('finance_transactions')
      .update(update)
      .eq('id', id)
      .select(FINANCE_SELECT)
      .single();
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // Если запись затрагивает аренду (была или стала) — пересинхронизируем
    // arena_paid_amount у обоих событий (старого и нового), если они есть.
    const wasArena = existing.type === 'expense' && existing.category === 'arena';
    const isArena = merged.type === 'expense' && merged.category === 'arena';
    if (wasArena || isArena) {
      await syncArenaPaidAmountForChange(
        sb,
        wasArena ? existing.event_id : null,
        isArena ? merged.event_id : null,
      );
    }

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
      .select('id, team_id, type, category, event_id, amount, occurred_on')
      .eq('id', id)
      .maybeSingle();
    if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });
    if (!existing || existing.team_id !== teamId) {
      return NextResponse.json({ error: 'Операция не найдена' }, { status: 404 });
    }

    // Удаление транзакции откатывает её вклад в on_hand. Если запись пополняла
    // кассу (например, депозит) — после удаления касса уменьшится; отказываем,
    // если результат отрицательный. Удаление расхода всегда только увеличивает
    // кассу, поэтому проверка тривиально не сработает.
    const today = todayIso();
    const oldDelta = onHandDelta(
      { type: existing.type, amount: existing.amount, occurred_on: existing.occurred_on },
      today,
    );
    if (oldDelta > 0) {
      const onHand = await currentOnHand(sb, teamId);
      if (onHand - oldDelta < 0) {
        return NextResponse.json(
          { error: insufficientOnHandMessage(onHand) },
          { status: 400 },
        );
      }
    }

    const { error: delErr } = await sb
      .from('finance_transactions')
      .delete()
      .eq('id', id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    // Если удалили аренду события — пересинхронизируем arena_paid_amount.
    if (existing.type === 'expense' && existing.category === 'arena' && existing.event_id) {
      await syncArenaPaidAmount(sb, existing.event_id);
    }

    const body: DeleteFinanceResponse = { ok: true };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

// Те же правила, что у POST /api/finance: для expense обязательна категория,
// для refund/adjustment — user_id, у не-expense категория запрещена. Поле
// venue_id допустимо только для аренды и взаимоисключающе с event_id
// (если событие задано, venue берётся из event, а присланный venue_id игнорируется).
function validateMerged(m: {
  type: string;
  category: string | null;
  user_id: string | null;
  event_id: string | null;
  venue_id: string | null;
}): string | null {
  if (m.type === 'expense') {
    if (!m.category) return 'Категория обязательна для расхода';
    if (m.user_id) return 'У расхода не может быть игрока';
    if (m.category !== 'arena' && m.venue_id) {
      return 'Площадка применима только к аренде';
    }
    if (m.category === 'arena' && !m.event_id && !m.venue_id) {
      return 'Выберите событие или площадку для аренды';
    }
    return null;
  }
  if (m.category) return 'Категория допустима только у расхода';
  if (m.venue_id) return 'Площадка применима только к аренде';
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
