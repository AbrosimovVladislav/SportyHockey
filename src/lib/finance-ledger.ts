import 'server-only';
import type { FinanceTxType, FinanceExpenseCategory } from '@/types/api';

// v0.5, итерация 60. Полиморфный ledger «кто → кому».
//
// Адаптер работает в обе стороны:
//   • legacyToLedger — принимает старый API-формат (type/category/user_id/
//     event_id/venue_id) и раскладывает в полиморфные поля БД
//     (kind/from_kind/from_id/to_kind/to_id/external_kind);
//   • ledgerToLegacy* — собирает старые DTO-поля (type/category/user_id)
//     из ledger-полей. Это нужно, чтобы DTO `FinanceTransaction` оставался
//     прежним и фронт не пришлось переписывать.
//
// CHECK-инварианты БД здесь продублированы — чтобы 400 с понятным
// сообщением приходил клиенту, а не CHECK violation в логах.

export type CounterpartyKind = 'user' | 'team' | 'venue' | 'external';
export type TxKind = 'transfer' | 'adjustment';

export type LedgerFields = {
  kind: TxKind;
  from_kind: CounterpartyKind | null;
  from_id: string | null;
  to_kind: CounterpartyKind | null;
  to_id: string | null;
  external_kind: string | null;
};

export type LegacyInput = {
  type: FinanceTxType;
  category?: FinanceExpenseCategory | null;
  user_id?: string | null;
  event_id?: string | null;
  // Только для арендных расходов без привязки к событию (депозит площадке).
  // При наличии event_id venue вытаскивается из события (см. eventVenueId).
  venue_id?: string | null;
};

export type LedgerResolution =
  | { ok: true; fields: LedgerFields }
  | { ok: false; error: string };

// teamId — для симметрии формулы: когда сторона = team, в from_id/to_id
// пишем team_id транзакции (балансы любого счёта = Σ to=X − Σ from=X
// одинаково для user / team / venue без специальных case'ов).
// eventVenueId — venue выбранного события (если event_id задан и cat='arena').
export function legacyToLedger(
  input: LegacyInput,
  teamId: string,
  eventVenueId: string | null,
): LedgerResolution {
  switch (input.type) {
    case 'player_payment': {
      if (!input.user_id) return err('Для оплаты игрока нужен игрок');
      return ok({
        kind: 'transfer',
        from_kind: 'user',
        from_id: input.user_id,
        to_kind: 'team',
        to_id: teamId,
        external_kind: null,
      });
    }
    case 'refund': {
      if (!input.user_id) return err('Для возврата нужен игрок');
      return ok({
        kind: 'transfer',
        from_kind: 'team',
        from_id: teamId,
        to_kind: 'user',
        to_id: input.user_id,
        external_kind: null,
      });
    }
    case 'adjustment': {
      if (!input.user_id) return err('Для корректировки нужен игрок');
      return ok({
        kind: 'adjustment',
        from_kind: null,
        from_id: null,
        to_kind: 'user',
        to_id: input.user_id,
        external_kind: null,
      });
    }
    case 'expense': {
      if (!input.category) return err('Категория обязательна для расхода');
      if (input.category === 'arena') {
        if (input.event_id) {
          if (!eventVenueId) {
            return err(
              'У события не задана площадка — укажите площадку или выберите другое событие',
            );
          }
          return ok({
            kind: 'transfer',
            from_kind: 'team',
            from_id: teamId,
            to_kind: 'venue',
            to_id: eventVenueId,
            external_kind: null,
          });
        }
        if (!input.venue_id) {
          return err('Выберите событие или площадку для аренды');
        }
        return ok({
          kind: 'transfer',
          from_kind: 'team',
          from_id: teamId,
          to_kind: 'venue',
          to_id: input.venue_id,
          external_kind: null,
        });
      }
      // inventory / uniform / other → external с label=категория.
      return ok({
        kind: 'transfer',
        from_kind: 'team',
        from_id: teamId,
        to_kind: 'external',
        to_id: null,
        external_kind: input.category,
      });
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Обратное направление — собираем legacy-поля DTO из ledger-строки.
// Нужен исключительно ради того, чтобы `FinanceTransaction` оставался
// прежним и существующий фронт не пришлось переписывать.
// ──────────────────────────────────────────────────────────────────────────

export type LedgerRow = {
  kind: string;
  from_kind: string | null;
  from_id: string | null;
  to_kind: string | null;
  to_id: string | null;
  external_kind: string | null;
};

export function ledgerToLegacyType(row: LedgerRow): FinanceTxType {
  if (row.kind === 'adjustment') return 'adjustment';
  if (row.from_kind === 'user' && row.to_kind === 'team') return 'player_payment';
  if (row.from_kind === 'team' && row.to_kind === 'user') return 'refund';
  return 'expense';
}

export function ledgerToLegacyCategory(row: LedgerRow): FinanceExpenseCategory | null {
  if (row.to_kind === 'venue') return 'arena';
  if (row.to_kind === 'external') {
    const k = row.external_kind;
    if (k === 'inventory' || k === 'uniform' || k === 'other') return k;
  }
  return null;
}

// Игрок, к которому относится транзакция: для player_payment — отправитель,
// для refund/adjustment — получатель. Расход — null.
export function ledgerToLegacyUserId(row: LedgerRow): string | null {
  if (row.from_kind === 'user') return row.from_id;
  if (row.to_kind === 'user') return row.to_id;
  return null;
}

function ok(fields: LedgerFields): LedgerResolution {
  return { ok: true, fields };
}

function err(message: string): LedgerResolution {
  return { ok: false, error: message };
}
