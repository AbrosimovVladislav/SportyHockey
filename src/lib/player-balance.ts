import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

type SB = SupabaseClient<Database>;

export type PlayerBalanceTotals = {
  charge: number;
  paid: number;
  balance: number;
};

// Единый источник истины по балансу одного игрока. Используется в:
//   • /money/players — список балансов всех игроков (через цикл в computeTeamBalance);
//   • публичный профиль игрока — карточка «Финансы»;
//   • вкладка «Финансы» в профиле — итоги сверху списка строк.
// До этого в каждом из трёх мест была своя формула, и при наличии refund-ов
// или adjustment-ов цифры расходились. Формула здесь — самая полная:
//   charge = Σ(showed_up × cost) + Σ(transfer team→user)
//   paid   = Σ(transfer user→team) + Σ(adjustment to_user)
// Знак balance — со стороны команды (положительный = игрок должен).
export async function computePlayerBalance(
  sb: SB,
  teamId: string,
  userId: string,
  asOf?: string,
): Promise<PlayerBalanceTotals> {
  const cutoffIso = asOf ? `${asOf}T23:59:59.999Z` : new Date().toISOString();
  const occurredCutoff = asOf ?? new Date().toISOString().slice(0, 10);

  const [attRes, txRes] = await Promise.all([
    sb
      .from('event_attendances')
      .select('events!inner(cost_per_player)')
      .eq('user_id', userId)
      .eq('showed_up', true)
      .eq('events.team_id', teamId)
      .neq('events.status', 'cancelled')
      .lt('events.starts_at', cutoffIso),
    sb
      .from('finance_transactions')
      .select('amount, kind, from_kind, from_id, to_kind, to_id')
      .eq('team_id', teamId)
      .lte('occurred_on', occurredCutoff)
      .or(
        `and(from_kind.eq.user,from_id.eq.${userId}),and(to_kind.eq.user,to_id.eq.${userId})`,
      ),
  ]);

  if (attRes.error) throw new Error(attRes.error.message);
  if (txRes.error) throw new Error(txRes.error.message);

  let charge = 0;
  for (const r of attRes.data ?? []) {
    const cost = r.events?.cost_per_player != null ? Number(r.events.cost_per_player) : 0;
    if (cost > 0) charge += cost;
  }

  let paid = 0;
  for (const tx of txRes.data ?? []) {
    const amt = Number(tx.amount);
    if (!Number.isFinite(amt)) continue;
    if (tx.kind === 'transfer') {
      if (tx.from_kind === 'user' && tx.from_id === userId) paid += amt;
      if (tx.to_kind === 'user' && tx.to_id === userId) charge += amt;
    } else if (tx.kind === 'adjustment') {
      if (tx.to_kind === 'user' && tx.to_id === userId) paid += amt;
    }
  }

  return { charge, paid, balance: charge - paid };
}
