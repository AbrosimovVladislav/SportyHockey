import { NextResponse } from 'next/server';
import { requireUser, resolveActiveTeamId } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { computeTeamBalance } from '@/lib/team-finance';
import type {
  PlayerBalanceItem,
  PlayerBalanceStatus,
  PlayersBalanceResponse,
} from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/finance/players — балансы всех игроков активной команды для экрана
// `/money/players`. Источник истины по суммам — `computeTeamBalance`, имена и
// аватары догружаем отдельным запросом через `team_memberships`.
//
// Игроки, которые есть в составе, но без транзакций и без посещений — попадают
// в выдачу со статусом `inactive` (баланс 0). Это правильно, потому что
// организатор хочет видеть всю команду, а не только тех, у кого был движ.
export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const teamId = await resolveActiveTeamId(req, user.id);
    if (!teamId) {
      return NextResponse.json({ error: 'Активная команда не выбрана' }, { status: 400 });
    }
    const sb = supabaseServer();

    // 1) Все члены команды + их профили.
    const memRes = await sb
      .from('team_memberships')
      .select('user_id, users!user_id(id, first_name, last_name, avatar_url, photo_url)')
      .eq('team_id', teamId);
    if (memRes.error) {
      return NextResponse.json({ error: memRes.error.message }, { status: 500 });
    }

    // 2) Балансы по игрокам — из общего расчёта.
    const balance = await computeTeamBalance(sb, teamId);
    const byUser = new Map<string, { total_charged: number; total_paid: number; balance: number }>();
    for (const p of balance.players) {
      byUser.set(p.user_id, {
        total_charged: p.total_charged,
        total_paid: p.total_paid,
        balance: p.balance,
      });
    }

    type RawUser = {
      id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      photo_url: string | null;
    };
    type RawMem = { user_id: string; users: RawUser | RawUser[] | null };

    const items: PlayerBalanceItem[] = (memRes.data as RawMem[] | null ?? [])
      .map((m): PlayerBalanceItem | null => {
        const u = Array.isArray(m.users) ? m.users[0] ?? null : m.users;
        if (!u) return null;
        const stats = byUser.get(m.user_id) ?? { total_charged: 0, total_paid: 0, balance: 0 };
        // Инвертируем знак: в computeTeamBalance положительный = долг (взгляд
        // команды). В DTO/UI принят player-side знак: + = депозит, − = долг.
        const playerBalance = -stats.balance;
        return {
          user_id: m.user_id,
          first_name: u.first_name,
          last_name: u.last_name,
          avatar_url: u.avatar_url,
          photo_url: u.photo_url,
          total_charged: stats.total_charged,
          total_paid: stats.total_paid,
          balance: playerBalance,
          status: classify(playerBalance, stats.total_charged, stats.total_paid),
        };
      })
      .filter((x): x is PlayerBalanceItem => x !== null);

    // Сортировка: должники сверху по убыванию долга, потом депозиты по убыванию,
    // потом «закрытые» и «без движа» — алфавитно по имени.
    items.sort(comparePlayers);

    const body: PlayersBalanceResponse = { items };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

// Зазор ±50 ₽ — если у игрока ровно 0 или копеечная разница, считаем «закрыт».
// Это съедает округления и единичные мелкие ошибки. Граница та же, что в
// roadmap'е (52.1).
const ZERO_EPS = 50;

function classify(
  balance: number,
  totalCharged: number,
  totalPaid: number,
): PlayerBalanceStatus {
  if (totalCharged === 0 && totalPaid === 0) return 'inactive';
  if (balance >= ZERO_EPS) return 'overpaid';
  if (balance <= -ZERO_EPS) return 'debtor';
  return 'closed';
}

// Порядок статусов в общем списке: должники → депозиты → закрытые → неактивные.
const STATUS_ORDER: Record<PlayerBalanceStatus, number> = {
  debtor: 0,
  overpaid: 1,
  closed: 2,
  inactive: 3,
};

function comparePlayers(a: PlayerBalanceItem, b: PlayerBalanceItem): number {
  const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (so !== 0) return so;
  // Внутри одного статуса — должники: больше долг сверху (balance отрицательный,
  // сравниваем по возрастанию). Депозиты: больше депозит сверху.
  if (a.status === 'debtor') return a.balance - b.balance;
  if (a.status === 'overpaid') return b.balance - a.balance;
  // Закрытые/неактивные — по имени.
  return nameOf(a).localeCompare(nameOf(b), 'ru');
}

function nameOf(p: PlayerBalanceItem): string {
  return [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
}
