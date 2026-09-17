import 'server-only';
import { InlineKeyboard, type Bot, type Context } from 'grammy';
import { supabaseServer } from '@/lib/supabase-server';
import { upsertTelegramUser } from '@/lib/upsert-telegram-user';

// Привязка Telegram-канала к команде (итерация 70).
//
// Сценарий: бота добавляют администратором канала с правом публикации, затем
// организатор пересылает боту в личку любой пост из этого канала. Так мы узнаём
// id канала без перенастройки webhook (нужен только тип `message`) и одинаково
// работаем с публичными и приватными каналами.
//
// Один бот обслуживает все команды, поэтому проверяем обе стороны:
//   • отправитель управляет командой в приложении;
//   • отправитель — администратор самого канала. Без этого любой мог бы переслать
//     пост из чужого канала, где бот уже админ, и публиковать туда свои анонсы.

// После итерации 71 (роль admin) привязка останется только у админа команды.
const BINDER_ROLES = ['organizer', 'admin'];

const BIND_CALLBACK_RE = /^bindch:([0-9a-f-]{36}):(-?\d+)$/i;

type ManagedTeam = { id: string; name: string };

export function registerChannelHandlers(bot: Bot): void {
  bot.on('message:forward_origin', async (ctx, next) => {
    const origin = ctx.msg.forward_origin;
    if (ctx.chat.type !== 'private' || origin.type !== 'channel' || !ctx.from) {
      await next();
      return;
    }
    const chatId = origin.chat.id;
    const title = 'title' in origin.chat ? (origin.chat.title ?? 'Канал') : 'Канал';

    const teams = await loadManagedTeams(ctx.from);
    if (teams.length === 0) {
      await ctx.reply('Привязать канал может только организатор команды в приложении.');
      return;
    }
    const problem = await checkChannelAccess(ctx, chatId);
    if (problem) {
      await ctx.reply(problem);
      return;
    }

    if (teams.length === 1) {
      await ctx.reply(await bindChannel(teams[0], chatId, title));
      return;
    }
    const kb = new InlineKeyboard();
    for (const team of teams) kb.text(team.name, `bindch:${team.id}:${chatId}`).row();
    await ctx.reply(`К какой команде привязать канал «${title}»?`, { reply_markup: kb });
  });

  bot.callbackQuery(BIND_CALLBACK_RE, async (ctx) => {
    const m = ctx.match;
    if (!Array.isArray(m) || !ctx.from) return;
    const teamId = m[1];
    const chatId = Number(m[2]);

    const team = (await loadManagedTeams(ctx.from)).find((t) => t.id === teamId);
    if (!team) {
      await ctx.answerCallbackQuery({ text: 'Нет прав на эту команду' });
      return;
    }
    const problem = await checkChannelAccess(ctx, chatId);
    if (problem) {
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(problem);
      return;
    }
    let title = 'Канал';
    try {
      const chat = await ctx.api.getChat(chatId);
      if ('title' in chat && chat.title) title = chat.title;
    } catch (e) {
      console.warn('[bot-channel] getChat failed:', e);
    }
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(await bindChannel(team, chatId, title));
  });
}

// Команды, которыми отправитель управляет в приложении.
async function loadManagedTeams(from: NonNullable<Context['from']>): Promise<ManagedTeam[]> {
  const user = await upsertTelegramUser({
    telegram_id: from.id,
    username: from.username ?? null,
    first_name: from.first_name ?? null,
    last_name: from.last_name ?? null,
  });
  const { data, error } = await supabaseServer()
    .from('team_memberships')
    .select('team_id, teams(name, archived_at)')
    .eq('user_id', user.id)
    .in('role', BINDER_ROLES);
  if (error) {
    console.error('[bot-channel] memberships lookup failed:', error);
    return [];
  }
  const out: ManagedTeam[] = [];
  for (const row of data ?? []) {
    const team = Array.isArray(row.teams) ? row.teams[0] : row.teams;
    if (!team || team.archived_at) continue;
    out.push({ id: row.team_id, name: team.name });
  }
  return out;
}

// null — всё в порядке; иначе текст отказа для пользователя.
async function checkChannelAccess(ctx: Context, chatId: number): Promise<string | null> {
  if (!ctx.from) return 'Не удалось определить пользователя.';
  try {
    const me = await ctx.api.getChatMember(chatId, ctx.me.id);
    const canPost =
      me.status === 'creator' || (me.status === 'administrator' && me.can_post_messages === true);
    if (!canPost) {
      return 'У меня нет права публиковать в этом канале. Добавь меня администратором с правом «Публикация сообщений» и перешли пост ещё раз.';
    }
    const sender = await ctx.api.getChatMember(chatId, ctx.from.id);
    if (sender.status !== 'creator' && sender.status !== 'administrator') {
      return 'Привязать канал может только его администратор.';
    }
    return null;
  } catch (e) {
    console.warn('[bot-channel] getChatMember failed:', e);
    return 'Я не состою в этом канале. Добавь меня администратором с правом «Публикация сообщений» и перешли пост ещё раз.';
  }
}

async function bindChannel(team: ManagedTeam, chatId: number, title: string): Promise<string> {
  const { error } = await supabaseServer()
    .from('teams')
    .update({ announce_chat_id: chatId, announce_chat_title: title })
    .eq('id', team.id);
  if (error) {
    console.error('[bot-channel] bind failed:', error);
    return 'Не получилось сохранить привязку, попробуй ещё раз.';
  }
  return `Готово! Канал «${title}» привязан к команде «${team.name}». Анонсы событий теперь будут публиковаться туда.`;
}
