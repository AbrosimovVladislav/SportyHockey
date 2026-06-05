import 'server-only';
import type { FinanceTxType, FinanceExpenseCategory } from '@/types/api';

// v0.5, итерация 58. Адаптер старого формата транзакций (type/category/user_id/
// event_id/venue_id) в ledger-формат (kind/from_kind/to_kind/from_*/to_*/
// external_label). Возвращает либо набор ledger-полей, либо строку с ошибкой.
// Сами CHECK-инварианты в БД мы дублируем здесь, чтобы 400 с понятным
// сообщением приходил клиенту, а не CHECK violation в логах.

export type CounterpartyKind = 'user' | 'team' | 'venue' | 'external';
export type TxKind = 'transfer' | 'adjustment';

export type LegacyInput = {
  type: FinanceTxType;
  category?: FinanceExpenseCategory | null;
  user_id?: string | null;
  event_id?: string | null;
  // Используется только для арендных расходов без привязки к событию
  // (депозит площадке). При наличии event_id venue вытаскивается из события.
  venue_id?: string | null;
};

export type LedgerFields = {
  kind: TxKind;
  from_kind: CounterpartyKind | null;
  to_kind: CounterpartyKind | null;
  from_user_id: string | null;
  to_user_id: string | null;
  from_venue_id: string | null;
  to_venue_id: string | null;
  external_label: string | null;
};

export type LedgerResolution =
  | { ok: true; fields: LedgerFields }
  | { ok: false; error: string };

// Раскладывает старую транзакцию в ledger-поля. Для арендных расходов
// требуется venue_id события — передаётся вторым аргументом, потому что
// сама функция синхронная (не лезет в БД).
export function legacyToLedger(
  input: LegacyInput,
  eventVenueId: string | null,
): LedgerResolution {
  switch (input.type) {
    case 'player_payment': {
      if (!input.user_id) return err('Для оплаты игрока нужен игрок');
      return ok({
        kind: 'transfer',
        from_kind: 'user',
        to_kind: 'team',
        from_user_id: input.user_id,
        to_user_id: null,
        from_venue_id: null,
        to_venue_id: null,
        external_label: null,
      });
    }
    case 'refund': {
      if (!input.user_id) return err('Для возврата нужен игрок');
      return ok({
        kind: 'transfer',
        from_kind: 'team',
        to_kind: 'user',
        from_user_id: null,
        to_user_id: input.user_id,
        from_venue_id: null,
        to_venue_id: null,
        external_label: null,
      });
    }
    case 'adjustment': {
      if (!input.user_id) return err('Для корректировки нужен игрок');
      return ok({
        kind: 'adjustment',
        from_kind: null,
        to_kind: null,
        from_user_id: null,
        to_user_id: input.user_id,
        from_venue_id: null,
        to_venue_id: null,
        external_label: null,
      });
    }
    case 'expense': {
      if (!input.category) return err('Категория обязательна для расхода');
      if (input.category === 'arena') {
        // Арендный расход: либо привязан к событию (venue берётся из event),
        // либо это депозит площадке (venue_id обязателен).
        if (input.event_id) {
          if (!eventVenueId) {
            return err('У события не задана площадка — укажите площадку или выберите другое событие');
          }
          return ok({
            kind: 'transfer',
            from_kind: 'team',
            to_kind: 'venue',
            from_user_id: null,
            to_user_id: null,
            from_venue_id: null,
            to_venue_id: eventVenueId,
            external_label: null,
          });
        }
        if (!input.venue_id) {
          return err('Выберите событие или площадку для аренды');
        }
        return ok({
          kind: 'transfer',
          from_kind: 'team',
          to_kind: 'venue',
          from_user_id: null,
          to_user_id: null,
          from_venue_id: null,
          to_venue_id: input.venue_id,
          external_label: null,
        });
      }
      // inventory / uniform / other → external с label=категория.
      return ok({
        kind: 'transfer',
        from_kind: 'team',
        to_kind: 'external',
        from_user_id: null,
        to_user_id: null,
        from_venue_id: null,
        to_venue_id: null,
        external_label: input.category,
      });
    }
  }
}

function ok(fields: LedgerFields): LedgerResolution {
  return { ok: true, fields };
}

function err(message: string): LedgerResolution {
  return { ok: false, error: message };
}
