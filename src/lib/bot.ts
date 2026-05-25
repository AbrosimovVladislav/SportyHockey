import 'server-only';
import { Bot, InlineKeyboard, type Context } from 'grammy';
import { supabaseServer } from '@/lib/supabase-server';
import { buildEventCard, type BotEventVote } from '@/lib/bot-event-card';
import { asEventType } from '@/lib/event-enum';
import { upsertTelegramUser } from '@/lib/upsert-telegram-user';

let cachedBot: Bot | null = null;

type TelegramFrom = NonNullable<Context['from']>;
type JoinResult =
  | { kind: 'ok'; teamName: string }
  | { kind: 'already_in'; teamName: string }
  | { kind: 'not_found' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getBot(): Bot {
  if (cachedBot) return cachedBot;
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error('BOT_TOKEN должен быть задан');
  }
  const bot = new Bot(token);
  registerHandlers(bot);
  cachedBot = bot;
  return bot;
}

const VOTE_CALLBACK_RE = /^vote:(going|not_going):([0-9a-f-]{36})$/i;

function registerHandlers(bot: Bot): void {
  bot.callbackQuery(VOTE_CALLBACK_RE, async (ctx) => {
    const m = ctx.match;
    if (!Array.isArray(m)) return;
    const next = m[1] as 'going' | 'not_going';
    const eventId = m[2];
    if (!ctx.from) {
      await ctx.answerCallbackQuery({ text: 'Нет данных пользователя' });
      return;
    }
    await handleVoteCallback(ctx, eventId, next);
  });

  bot.command('events', async (ctx) => {
    if (!ctx.from) return;
    await sendUpcomingEvents(ctx);
  });

  bot.command('start', async (ctx) => {
    const payload = (ctx.match ?? '').trim();

    if (payload.startsWith('team_') && ctx.from) {
      const teamId = payload.slice('team_'.length);
      const result = await joinTeamByDeeplink(ctx.from, teamId);
      const kb = openMiniAppKeyboard();

      if (result.kind === 'ok') {
        await ctx.reply(
          `Привет! Ты в команде «${result.teamName}». Открой Mini App, чтобы голосовать за события.`,
          kb ? { reply_markup: kb } : undefined,
        );
        return;
      }
      if (result.kind === 'already_in') {
        await ctx.reply(
          `Ты уже в команде «${result.teamName}». Открой Mini App.`,
          kb ? { reply_markup: kb } : undefined,
        );
        return;
      }
      await ctx.reply('Не удалось найти команду по этой ссылке. Попроси организатора прислать новую.');
      return;
    }

    const kb = openMiniAppKeyboard();
    await ctx.reply(
      'Привет! Я бот SportyHockey. Открой Mini App, чтобы начать.',
      kb ? { reply_markup: kb } : undefined,
    );
  });
}

function openMiniAppKeyboard(): InlineKeyboard | null {
  const url = process.env.MINI_APP_URL;
  if (!url) return null;
  return new InlineKeyboard().webApp('Открыть Mini App', url);
}

// Гарантирует строку users по данным Telegram и возвращает её id (или null при сбое).
// Имя/фамилию не затирает — этим занимается upsertTelegramUser (пишет только при создании).
async function ensureBotUserId(from: TelegramFrom): Promise<string | null> {
  try {
    const u = await upsertTelegramUser({
      telegram_id: from.id,
      username: from.username ?? null,
      first_name: from.first_name ?? null,
      last_name: from.last_name ?? null,
    });
    return u.id;
  } catch (e) {
    console.error('[bot] ensure user failed:', e);
    return null;
  }
}

async function handleVoteCallback(
  ctx: Context,
  eventId: string,
  next: 'going' | 'not_going',
): Promise<void> {
  if (!ctx.from) {
    await ctx.answerCallbackQuery({ text: 'Нет данных пользователя' });
    return;
  }
  const sb = supabaseServer();

  const userId = await ensureBotUserId(ctx.from);
  if (!userId) {
    await ctx.answerCallbackQuery({ text: 'Не удалось определить пользователя' });
    return;
  }

  const { data: event } = await sb
    .from('events')
    .select(
      'id, team_id, type, title, starts_at, ends_at, cost_per_player, opponent_name, status, venue:venues(name)',
    )
    .eq('id', eventId)
    .maybeSingle();
  if (!event || event.status === 'cancelled') {
    await ctx.answerCallbackQuery({ text: 'Событие недоступно' });
    return;
  }

  const { data: mem } = await sb
    .from('team_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('team_id', event.team_id)
    .maybeSingle();
  if (!mem) {
    await ctx.answerCallbackQuery({ text: 'Ты не в этой команде' });
    return;
  }

  const { data: prev } = await sb
    .from('event_attendances')
    .select('vote')
    .eq('event_id', event.id)
    .eq('user_id', userId)
    .maybeSingle();
  const prevVote = (prev?.vote === 'going' || prev?.vote === 'not_going'
    ? prev.vote
    : null) as BotEventVote;

  let finalVote: BotEventVote;
  if (prevVote === next) {
    await sb
      .from('event_attendances')
      .delete()
      .eq('event_id', event.id)
      .eq('user_id', userId);
    finalVote = null;
  } else {
    await sb.from('event_attendances').upsert(
      {
        event_id: event.id,
        user_id: userId,
        vote: next,
        voted_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,user_id' },
    );
    finalVote = next;
  }

  const venueRaw = Array.isArray(event.venue) ? event.venue[0] : event.venue;
  const card = buildEventCard({
    eventId: event.id,
    type: asEventType(event.type),
    title: event.title,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    venue_name: venueRaw?.name ?? null,
    cost_per_player: event.cost_per_player != null ? Number(event.cost_per_player) : null,
    opponent_name: event.opponent_name ?? null,
    my_vote: finalVote,
  });

  try {
    await ctx.editMessageReplyMarkup({ reply_markup: card.keyboard });
  } catch (err) {
    console.warn('[bot] editMessageReplyMarkup failed:', err);
  }

  const toast =
    finalVote === 'going'
      ? 'Записано: иду'
      : finalVote === 'not_going'
        ? 'Записано: не иду'
        : 'Голос снят';
  await ctx.answerCallbackQuery({ text: toast });
}

async function sendUpcomingEvents(ctx: Context): Promise<void> {
  if (!ctx.from) return;
  const sb = supabaseServer();

  const userId = await ensureBotUserId(ctx.from);
  if (!userId) return;

  const { data: memberships } = await sb
    .from('team_memberships')
    .select('team_id')
    .eq('user_id', userId);
  const teamIds = (memberships ?? []).map((m) => m.team_id);
  if (teamIds.length === 0) {
    await ctx.reply('Тебя пока нет в команде. Попроси организатора прислать приглашение.');
    return;
  }

  const { data: events } = await sb
    .from('events')
    .select(
      'id, team_id, type, title, starts_at, ends_at, cost_per_player, opponent_name, venue:venues(name)',
    )
    .in('team_id', teamIds)
    .neq('status', 'cancelled')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(5);
  if (!events || events.length === 0) {
    await ctx.reply('Ближайших событий нет.');
    return;
  }

  const eventIds = events.map((e) => e.id);
  const { data: votes } = await sb
    .from('event_attendances')
    .select('event_id, vote')
    .eq('user_id', userId)
    .in('event_id', eventIds);
  const voteMap = new Map<string, BotEventVote>(
    (votes ?? []).map((v) => [
      v.event_id,
      (v.vote === 'going' || v.vote === 'not_going' ? v.vote : null) as BotEventVote,
    ]),
  );

  for (const event of events) {
    const venueRaw = Array.isArray(event.venue) ? event.venue[0] : event.venue;
    const card = buildEventCard({
      eventId: event.id,
      type: asEventType(event.type),
      title: event.title,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      venue_name: venueRaw?.name ?? null,
      cost_per_player: event.cost_per_player != null ? Number(event.cost_per_player) : null,
      opponent_name: event.opponent_name ?? null,
      my_vote: voteMap.get(event.id) ?? null,
    });
    try {
      await ctx.reply(card.text, { reply_markup: card.keyboard });
    } catch (err) {
      console.error('[bot] /events reply failed:', err);
    }
  }
}

async function joinTeamByDeeplink(from: TelegramFrom, teamId: string): Promise<JoinResult> {
  if (!UUID_RE.test(teamId)) {
    return { kind: 'not_found' };
  }
  const sb = supabaseServer();

  const { data: team, error: teamErr } = await sb
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .maybeSingle();
  if (teamErr) console.error('[bot] team lookup failed:', teamErr);
  if (teamErr || !team) return { kind: 'not_found' };

  const userId = await ensureBotUserId(from);
  if (!userId) return { kind: 'not_found' };

  const { data: existing } = await sb
    .from('team_memberships')
    .select('id')
    .eq('team_id', team.id)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) return { kind: 'already_in', teamName: team.name };

  const { error: insErr } = await sb
    .from('team_memberships')
    .insert({ team_id: team.id, user_id: userId, role: 'player' });
  if (insErr) {
    console.error('[bot] membership insert failed:', insErr);
    return { kind: 'not_found' };
  }

  return { kind: 'ok', teamName: team.name };
}
