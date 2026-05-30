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
  CreateFinanceResponse,
  FinanceListResponse,
} from '@/types/api';
import type { TablesInsert } from '@/types/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/finance — лента транзакций активной команды с фильтрами и
// пагинацией. На хабе используется без фильтров с limit=10 — «Последние операции».
export async function GET(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const teamId = await resolveActiveTeamId(req, user.id);
    if (!teamId) {
      return NextResponse.json({ error: 'Активная команда не выбрана' }, { status: 400 });
    }

    const url = new URL(req.url);
    const limit = clampLimit(url.searchParams.get('limit'));
    const cursor = url.searchParams.get('cursor');
    const type = url.searchParams.get('type');
    const category = url.searchParams.get('category');
    const userId = url.searchParams.get('user_id');
    const eventId = url.searchParams.get('event_id');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    const sb = supabaseServer();
    let q = sb
      .from('finance_transactions')
      .select(FINANCE_SELECT)
      .eq('team_id', teamId)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) q = q.eq('type', type);
    if (category) q = q.eq('category', category);
    if (userId) q = q.eq('user_id', userId);
    if (eventId) q = q.eq('event_id', eventId);
    if (from) q = q.gte('occurred_on', from);
    if (to) q = q.lte('occurred_on', to);
    if (cursor) q = q.lt('created_at', cursor);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // RawFinanceRow описывает форму, которую возвращает наш SELECT с JOIN-алиасами;
    // postgrest-js типизирует это как `unknown`-подобную форму, приводим один раз.
    const items = ((data ?? []) as unknown as RawFinanceRow[]).map(mapFinanceTransaction);
    const next_cursor = items.length === limit ? items[items.length - 1].created_at : null;
    const body: FinanceListResponse = { items, next_cursor };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

// POST /api/finance — создание транзакции. Доступно только организатору
// активной команды. Тип определяет, какие поля обязательны.
const BodySchema = z
  .object({
    type: z.enum(['player_payment', 'expense', 'refund', 'adjustment']),
    amount: z.number().positive(),
    occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    category: z.enum(['arena', 'inventory', 'uniform', 'other']).nullable().optional(),
    user_id: z.string().uuid().nullable().optional(),
    event_id: z.string().uuid().nullable().optional(),
    description: z.string().max(500).nullable().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.type === 'expense') {
      if (!d.category) {
        ctx.addIssue({
          code: 'custom',
          path: ['category'],
          message: 'Категория обязательна для расхода',
        });
      }
      if (d.user_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['user_id'],
          message: 'У расхода не может быть игрока',
        });
      }
    } else {
      if (d.category) {
        ctx.addIssue({
          code: 'custom',
          path: ['category'],
          message: 'Категория допустима только у расхода',
        });
      }
      if (d.type !== 'player_payment' && !d.user_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['user_id'],
          message: 'Для возврата и корректировки нужен игрок',
        });
      }
    }
  });

export async function POST(req: Request): Promise<Response> {
  try {
    const user = await requireUser(req);
    const teamId = await resolveActiveTeamId(req, user.id);
    if (!teamId) {
      return NextResponse.json({ error: 'Активная команда не выбрана' }, { status: 400 });
    }

    const sb = supabaseServer();
    // Только организатор активной команды.
    await assertOrganizer(sb, user.id, teamId);

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? 'Некорректные данные операции' },
        { status: 400 },
      );
    }
    const d = parsed.data;

    // Если задан user_id — игрок должен состоять в той же команде.
    if (d.user_id) {
      const { data: mem, error: memErr } = await sb
        .from('team_memberships')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', d.user_id)
        .maybeSingle();
      if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });
      if (!mem) return NextResponse.json({ error: 'Игрок не в команде' }, { status: 404 });
    }

    // Если задан event_id — событие должно принадлежать той же команде.
    if (d.event_id) {
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

    const insert: TablesInsert<'finance_transactions'> = {
      team_id: teamId,
      type: d.type,
      amount: d.amount,
      category: d.category ?? null,
      user_id: d.user_id ?? null,
      event_id: d.event_id ?? null,
      description: d.description ?? null,
      created_by: user.id,
    };
    if (d.occurred_on) insert.occurred_on = d.occurred_on;

    const { data: created, error: insErr } = await sb
      .from('finance_transactions')
      .insert(insert)
      .select(FINANCE_SELECT)
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    const body: CreateFinanceResponse = {
      transaction: mapFinanceTransaction(created as unknown as RawFinanceRow),
    };
    return NextResponse.json(body, { status: 201 });
  } catch (e) {
    return handleRouteError(e);
  }
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

function clampLimit(raw: string | null): number {
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(100, Math.max(1, parsed));
}
