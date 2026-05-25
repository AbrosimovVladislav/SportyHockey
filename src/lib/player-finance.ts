import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';
import type { PlayerFinance, PlayerFinanceTx } from '@/types/api';
import { eventLabel } from '@/lib/event-label';

type SB = SupabaseClient<Database>;

/**
 * Финансы игрока для вкладки «Финансы».
 *
 * Начисления не хранятся транзакциями — они равны `cost_per_player` посещённых прошедших
 * событий команды. Оплаты — `finance_transactions` type=player_payment. В Node приезжает
 * только личный след игрока; арифметика (баланс, процент) — в коде.
 */
export async function computePlayerFinance(
  sb: SB,
  teamId: string,
  userId: string,
): Promise<PlayerFinance> {
  const nowIso = new Date().toISOString();

  const [attendedRes, paysRes] = await Promise.all([
    sb
      .from('event_attendances')
      .select('events!inner(id, type, title, opponent_name, starts_at, cost_per_player)')
      .eq('user_id', userId)
      .eq('showed_up', true)
      .eq('events.team_id', teamId)
      .neq('events.status', 'cancelled')
      .lt('events.starts_at', nowIso),
    sb
      .from('finance_transactions')
      .select('id, amount, description, created_at')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('type', 'player_payment'),
  ]);

  const transactions: PlayerFinanceTx[] = [];
  let totalCharged = 0;
  for (const r of attendedRes.data ?? []) {
    const ev = r.events;
    if (!ev) continue;
    const cost = ev.cost_per_player != null ? Number(ev.cost_per_player) : 0;
    totalCharged += cost;
    if (cost > 0) {
      transactions.push({
        id: ev.id,
        kind: 'charge',
        title: eventLabel(ev),
        date: ev.starts_at,
        amount: cost,
        event_id: ev.id,
      });
    }
  }

  let totalPaid = 0;
  for (const p of paysRes.data ?? []) {
    const amt = Number(p.amount);
    totalPaid += amt;
    transactions.push({
      id: p.id,
      kind: 'payment',
      title: p.description,
      date: p.created_at ?? nowIso,
      amount: amt,
      event_id: null,
    });
  }

  transactions.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const balance = totalCharged - totalPaid;
  const paidPercent =
    totalCharged > 0 ? Math.min(100, Math.round((totalPaid / totalCharged) * 100)) : 0;

  return {
    balance,
    total_charged: totalCharged,
    total_paid: totalPaid,
    paid_percent: paidPercent,
    transactions,
  };
}
