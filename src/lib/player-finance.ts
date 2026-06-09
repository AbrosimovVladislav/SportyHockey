import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type { PlayerFinance, PlayerFinanceEventRow, PlayerFinanceRow } from '@/types/api';
import { eventLabel } from '@/lib/event-label';
import { asEventType } from '@/lib/event-enum';
import { computePlayerBalance } from '@/lib/player-balance';

type SB = SupabaseClient<Database>;

/**
 * Финансы игрока для вкладки «Финансы».
 *
 * Начисления не хранятся транзакциями — они равны `cost_per_player` посещённых прошедших
 * событий. Оплаты — `finance_transactions` type=player_payment, у каждой есть `event_id`
 * (проставляется при отметке на экране события) либо null (депозит — пока не используется).
 * Строки сдваиваются по событию: одно событие = начисление + оплата. Оплаты без `event_id`
 * идут отдельными строками-депозитами. Баланс/процент считаются в коде.
 */
export async function computePlayerFinance(
  sb: SB,
  teamId: string,
  userId: string,
): Promise<PlayerFinance> {
  const nowIso = new Date().toISOString();

  const [attendedRes, paysRes, totals] = await Promise.all([
    sb
      .from('event_attendances')
      .select('events!inner(id, type, title, opponent_name, starts_at, cost_per_player)')
      .eq('user_id', userId)
      .eq('showed_up', true)
      .eq('events.team_id', teamId)
      .neq('events.status', 'cancelled')
      .lt('events.starts_at', nowIso),
    // Оплаты игрока за события (transfer user→team). Сюда же попадают
    // депозиты без привязки (event_id IS NULL) — это «оплата вперёд».
    sb
      .from('finance_transactions')
      .select(
        'id, amount, description, created_at, event_id, events(id, type, title, opponent_name, starts_at)',
      )
      .eq('team_id', teamId)
      .eq('from_kind', 'user')
      .eq('from_id', userId)
      .eq('to_kind', 'team'),
    // Итоги (charge / paid / balance) — единый расчёт через player-balance,
    // общий с /money/players и публичным профилем. Список строк ниже остаётся
    // по «оплатам user→team», но шапка карточки совпадает с другими экранами.
    computePlayerBalance(sb, teamId, userId),
  ]);

  // Сдвоенные строки события, ключ — event_id. Начисления — из посещённых прошедших событий.
  const eventRows = new Map<string, PlayerFinanceEventRow>();
  for (const r of attendedRes.data ?? []) {
    const ev = r.events;
    if (!ev) continue;
    const cost = ev.cost_per_player != null ? Number(ev.cost_per_player) : 0;
    if (cost <= 0) continue;
    eventRows.set(ev.id, {
      kind: 'event',
      event_id: ev.id,
      title: eventLabel(ev),
      is_game: asEventType(ev.type) === 'game',
      charged: cost,
      charged_date: ev.starts_at,
      paid: 0,
      paid_date: null,
    });
  }

  const deposits: PlayerFinanceRow[] = [];
  for (const p of paysRes.data ?? []) {
    const amt = Number(p.amount);
    const ev = p.event_id ? p.events : null;
    if (p.event_id) {
      let row = eventRows.get(p.event_id);
      // Оплата за событие без начисления (не было явки) — показываем строку с charged=0 ради прозрачности.
      if (!row && ev) {
        row = {
          kind: 'event',
          event_id: ev.id,
          title: eventLabel(ev),
          is_game: asEventType(ev.type) === 'game',
          charged: 0,
          charged_date: ev.starts_at,
          paid: 0,
          paid_date: null,
        };
        eventRows.set(ev.id, row);
      }
      if (row) {
        row.paid += amt;
        if (!row.paid_date || (p.created_at && p.created_at > row.paid_date)) {
          row.paid_date = p.created_at ?? row.paid_date;
        }
        continue;
      }
      // event_id есть, но событие не подтянулось (удалено) — деградируем в строку без перехода
    }
    deposits.push({
      kind: 'deposit',
      id: p.id,
      title: p.description,
      amount: amt,
      date: p.created_at ?? nowIso,
    });
  }

  const rows: PlayerFinanceRow[] = [...eventRows.values(), ...deposits];
  rows.sort((a, b) => {
    const da = a.kind === 'event' ? a.charged_date : a.date;
    const db = b.kind === 'event' ? b.charged_date : b.date;
    return da < db ? 1 : da > db ? -1 : 0;
  });

  const paidPercent =
    totals.charge > 0 ? Math.min(100, Math.round((totals.paid / totals.charge) * 100)) : 0;

  return {
    balance: totals.balance,
    total_charged: totals.charge,
    total_paid: totals.paid,
    paid_percent: paidPercent,
    rows,
  };
}
