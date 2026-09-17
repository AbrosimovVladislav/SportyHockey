import 'server-only';
import { Bot, InlineKeyboard, type Context } from 'grammy';
import { supabaseServer } from '@/lib/supabase-server';
import { buildEventCard, eventOpenKeyboard } from '@/lib/bot-event-card';
import { asEventType } from '@/lib/event-enum';
import { upsertTelegramUser } from '@/lib/upsert-telegram-user';
import { normTelegramUsername } from '@/lib/normalize-contact';
import { registerChannelHandlers } from '@/lib/bot-channel';

let cachedBot: Bot | null = null;

type TelegramFrom = NonNullable<Context['from']>;
type ClaimResult =
  | { kind: 'ok' } // привязали Telegram к игроку без аккаунта
  | { kind: 'already_claimed' } // та же ссылка, тот же пользователь — повторный переход
  | { kind: 'has_account' } // перешедший уже зарегистрирован отдельно — нужен мердж
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
  // Привязка канала анонсов (пересланный пост + выбор команды) — в bot-channel.ts.
  registerChannelHandlers(bot);

  // Голосование кнопками в боте убрано (итерация 71). Кнопки «Иду / Не иду» остались
  // под старыми сообщениями: отвечаем подсказкой и меняем их на «Открыть в Mini App».
  bot.callbackQuery(VOTE_CALLBACK_RE, async (ctx) => {
    const m = ctx.match;
    if (!Array.isArray(m)) return;
    await ctx.answerCallbackQuery({ text: 'Записаться теперь можно в приложении — открой событие' });
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: eventOpenKeyboard(m[2]) });
    } catch (err) {
      console.warn('[bot] editMessageReplyMarkup failed:', err);
    }
  });

  bot.command('events', async (ctx) => {
    if (!ctx.from) return;
    await sendUpcomingEvents(ctx);
  });

  bot.command('start', async (ctx) => {
    const payload = (ctx.match ?? '').trim();
    // Кнопки web_app Telegram разрешает только в личке — в группе отвечаем без клавиатуры.
    const kb = ctx.chat.type === 'private' ? openMiniAppKeyboard() : null;
    const withKb = kb ? { reply_markup: kb } : undefined;

    // Flow 2: персональное приглашение игрока без аккаунта — привязываем Telegram перешедшего.
    if (payload.startsWith('invite_') && ctx.from) {
      const userId = payload.slice('invite_'.length);
      const res = await claimInviteByDeeplink(ctx.from, userId);
      if (res.kind === 'ok' || res.kind === 'already_claimed') {
        await ctx.reply('Готово! Открой приложение и проверь свой профиль.', withKb);
        return;
      }
      if (res.kind === 'has_account') {
        await ctx.reply(
          'У тебя уже есть аккаунт в приложении. Попроси организатора добавить тебя в команду.',
          withKb,
        );
        return;
      }
      await ctx.reply('Ссылка-приглашение недействительна. Попроси организатора прислать новую.');
      return;
    }

    // Flow 1: ссылка на команду/приложение — ведём в онбординг, где игрок сам выберет команду
    // и отправит заявку (без аппрува организатора в команду не попадает).
    await ctx.reply(
      'Привет! Я бот SportyHockey. Открой приложение, выбери команду и отправь заявку на вступление.',
      withKb,
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
      'id, team_id, type, title, starts_at, ends_at, cost_per_player, opponent_name, venue:venues(name), team:teams(name, timezone)',
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

  for (const event of events) {
    const venueRaw = Array.isArray(event.venue) ? event.venue[0] : event.venue;
    const teamRaw = Array.isArray(event.team) ? event.team[0] : event.team;
    const card = buildEventCard({
      eventId: event.id,
      type: asEventType(event.type),
      title: event.title,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      venue_name: venueRaw?.name ?? null,
      cost_per_player: event.cost_per_player != null ? Number(event.cost_per_player) : null,
      opponent_name: event.opponent_name ?? null,
      team_name: teamRaw?.name ?? null,
      timezone: teamRaw?.timezone ?? null,
    });
    try {
      await ctx.reply(card.text, { reply_markup: card.keyboard });
    } catch (err) {
      console.error('[bot] /events reply failed:', err);
    }
  }
}

// Flow 2: переход по invite-ссылке игрока без аккаунта. По userId находим его карточку
// (telegram_id NULL) и привязываем к ней реальный Telegram перешедшего.
async function claimInviteByDeeplink(from: TelegramFrom, userId: string): Promise<ClaimResult> {
  if (!UUID_RE.test(userId)) return { kind: 'not_found' };
  const sb = supabaseServer();

  const { data: placeholder, error } = await sb
    .from('users')
    .select('id, telegram_id, username')
    .eq('id', userId)
    .maybeSingle();
  if (error) console.error('[bot] invite lookup failed:', error);
  if (error || !placeholder) return { kind: 'not_found' };

  // Уже привязан: этим же пользователем — ок (повторный переход), иначе ссылка занята.
  if (placeholder.telegram_id != null) {
    return placeholder.telegram_id === from.id
      ? { kind: 'already_claimed' }
      : { kind: 'has_account' };
  }

  // Перешедший уже зарегистрирован отдельной строкой — простая привязка невозможна (нужен мердж).
  const { data: existing } = await sb
    .from('users')
    .select('id')
    .eq('telegram_id', from.id)
    .maybeSingle();
  if (existing) return { kind: 'has_account' };

  const { error: updErr } = await sb
    .from('users')
    .update({
      telegram_id: from.id,
      username: normTelegramUsername(from.username) ?? placeholder.username,
    })
    .eq('id', placeholder.id)
    .is('telegram_id', null); // защита от гонки двух переходов
  if (updErr) {
    console.error('[bot] invite claim failed:', updErr);
    return { kind: 'has_account' };
  }

  // Помечаем invite-заявку принятой.
  await sb
    .from('team_join_requests')
    .update({ status: 'approved', decided_at: new Date().toISOString() })
    .eq('user_id', placeholder.id)
    .eq('kind', 'invite')
    .eq('status', 'pending');

  return { kind: 'ok' };
}
