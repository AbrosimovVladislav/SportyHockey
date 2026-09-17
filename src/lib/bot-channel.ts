import 'server-only';
import { InlineKeyboard, type Bot, type Context } from 'grammy';
import { supabaseServer } from '@/lib/supabase-server';
import { upsertTelegramUser } from '@/lib/upsert-telegram-user';
import { checkChatAccess } from '@/lib/announce-chat';

// Привязка чата анонсов к команде (итерация 70): группа или канал Telegram.
//
// Группа (основной сценарий, 70.8):
//   • бота добавляют в группу — служебное сообщение об этом бот получает всегда,
//     даже в privacy mode; если добавил админ группы, управляющий командой, — чат
//     привязывается сразу;
//   • запасной путь и перепривязка — команда /connect@<бот> в группе. В группе
//     с темами команда, отправленная в теме, направит анонсы именно в эту тему.
//   Пересланное из группы сообщение id чата не несёт, поэтому способ канала не годится.
// Канал: бота делают администратором с правом публикации и пересылают ему в личку
//   любой пост из канала.
//
// Webhook получает только `message` и `callback_query` — оба сценария в это укладываются.
// Один бот обслуживает все команды, поэтому всегда проверяем обе стороны: отправитель
// управляет командой в приложении И является администратором самого чата.

// Кто в приложении может привязывать чат. admin — задел: сейчас такой роли нет.
const BINDER_ROLES = ['organizer', 'admin'];

// «Анонимный админ» группы: сообщения приходят от служебного бота, человека не узнать.
const ANONYMOUS_ADMIN_ID = 1087968824;

// bc:<teamId без дефисов>:<chatId>:<threadId | 0> — укладывается в 64 байта callback_data.
const BIND_CALLBACK_RE = /^bc:([0-9a-f]{32}):(-?\d+):(\d+)$/i;

type ManagedTeam = { id: string; name: string; boundChatId: number | null };
type BindTarget = {
  chatId: number;
  title: string;
  kind: 'group' | 'channel';
  threadId: number | null;
};

function isGroupChat(ctx: Context): boolean {
  return ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';
}

function groupTarget(ctx: Context): BindTarget | null {
  const chat = ctx.chat;
  if (!chat || (chat.type !== 'group' && chat.type !== 'supergroup')) return null;
  const msg = ctx.msg;
  return {
    chatId: chat.id,
    title: chat.title ?? 'Группа',
    kind: 'group',
    threadId: msg?.is_topic_message && msg.message_thread_id ? msg.message_thread_id : null,
  };
}

export function registerChannelHandlers(bot: Bot): void {
  // Канал: пересланный пост в личке с ботом.
  bot.on('message:forward_origin', async (ctx, next) => {
    const origin = ctx.msg.forward_origin;
    if (ctx.chat.type !== 'private' || origin.type !== 'channel') return next();
    const title = 'title' in origin.chat ? (origin.chat.title ?? 'Канал') : 'Канал';
    await startBind(ctx, { chatId: origin.chat.id, title, kind: 'channel', threadId: null }, false);
  });

  // Группа: бота только что добавили.
  bot.on('message:new_chat_members', async (ctx, next) => {
    const target = groupTarget(ctx);
    if (!target || !ctx.msg.new_chat_members.some((m) => m.id === ctx.me.id)) return next();
    await startBind(ctx, target, true);
  });

  // Группа: явная привязка / перепривязка (в теме — анонсы пойдут в эту тему).
  bot.command('connect', async (ctx) => {
    const target = groupTarget(ctx);
    if (!target) {
      await ctx.reply(
        `Эта команда работает в группе команды. Добавь меня в группу и отправь там /connect@${ctx.me.username}`,
      );
      return;
    }
    await startBind(ctx, target, false);
  });

  // Группа превратилась в супергруппу — Telegram меняет id чата.
  bot.on('message:migrate_to_chat_id', async (ctx) => {
    const { error } = await supabaseServer()
      .from('teams')
      .update({ announce_chat_id: ctx.msg.migrate_to_chat_id })
      .eq('announce_chat_id', ctx.chat.id);
    if (error) console.error('[bot-channel] migrate failed:', error);
    // Уже опубликованные анонсы: реплаи об отмене/переносе должны попасть в новый чат.
    await supabaseServer()
      .from('events')
      .update({ announce_chat_id: ctx.msg.migrate_to_chat_id })
      .eq('announce_chat_id', ctx.chat.id);
  });

  // Выбор команды, если отправитель управляет несколькими.
  bot.callbackQuery(BIND_CALLBACK_RE, async (ctx) => {
    const m = ctx.match;
    if (!Array.isArray(m) || !ctx.from) return;
    const teamId = m[1].replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5').toLowerCase();
    const chatId = Number(m[2]);
    const threadId = Number(m[3]) || null;

    const team = (await loadManagedTeams(ctx.from)).find((t) => t.id === teamId);
    if (!team) {
      await ctx.answerCallbackQuery({ text: 'Нет прав на эту команду' });
      return;
    }
    let target: BindTarget = { chatId, title: 'Чат', kind: 'group', threadId };
    try {
      const chat = await ctx.api.getChat(chatId);
      target = {
        ...target,
        kind: chat.type === 'channel' ? 'channel' : 'group',
        title: ('title' in chat && chat.title) || target.title,
      };
    } catch (e) {
      console.warn('[bot-channel] getChat failed:', e);
    }
    const problem = await checkAccess(ctx, target);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(problem ?? (await bindChat(team, target)));
  });
}

// quietIntro — бота только что добавили в группу: вместо отказа подсказываем, что делать.
async function startBind(ctx: Context, target: BindTarget, quietIntro: boolean): Promise<void> {
  if (!ctx.from) return;
  const connectHint = `Чтобы анонсы команды приходили сюда, админ группы, который управляет командой в приложении, должен отправить /connect@${ctx.me.username}`;

  if (ctx.from.id === ANONYMOUS_ADMIN_ID) {
    await say(ctx, target, `Ты пишешь анонимно от имени группы — я не вижу, кто ты. ${connectHint} не анонимно.`);
    return;
  }
  const managed = await loadManagedTeams(ctx.from);
  if (managed.length === 0) {
    await say(
      ctx,
      target,
      quietIntro ? `Привет! ${connectHint}` : 'Привязать чат может только организатор команды в приложении.',
    );
    return;
  }
  // Авто-привязка при добавлении бота — только для команды без чата: иначе добавление
  // бота в любую другую группу молча перекинуло бы анонсы туда. Перенос — явным /connect.
  const teams = quietIntro ? managed.filter((t) => t.boundChatId == null) : managed;
  if (teams.length === 0) {
    await say(
      ctx,
      target,
      `Привет! У команды уже привязан чат анонсов. Чтобы перенести анонсы сюда, отправь /connect@${ctx.me.username}`,
    );
    return;
  }
  const problem = await checkAccess(ctx, target);
  if (problem) {
    await say(ctx, target, quietIntro ? `Привет! ${connectHint}` : problem);
    return;
  }
  if (teams.length === 1) {
    await say(ctx, target, await bindChat(teams[0], target));
    return;
  }
  const kb = new InlineKeyboard();
  for (const team of teams) {
    kb.text(team.name, `bc:${team.id.replace(/-/g, '')}:${target.chatId}:${target.threadId ?? 0}`).row();
  }
  await say(ctx, target, `К какой команде привязать «${target.title}»?`, kb);
}

// Ответ там же, где пришло сообщение; в группе с темами — в той же теме.
async function say(ctx: Context, target: BindTarget, text: string, kb?: InlineKeyboard): Promise<void> {
  await ctx.reply(text, {
    reply_markup: kb,
    message_thread_id: isGroupChat(ctx) ? (target.threadId ?? undefined) : undefined,
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
    .select('team_id, teams(name, archived_at, announce_chat_id)')
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
    out.push({ id: row.team_id, name: team.name, boundChatId: team.announce_chat_id ?? null });
  }
  return out;
}

// null — всё в порядке; иначе текст отказа для пользователя.
async function checkAccess(ctx: Context, target: BindTarget): Promise<string | null> {
  if (!ctx.from) return 'Не удалось определить пользователя.';
  return checkChatAccess(ctx.api, ctx.me.id, target.chatId, target.kind, ctx.from.id);
}

async function bindChat(team: ManagedTeam, target: BindTarget): Promise<string> {
  const { error } = await supabaseServer()
    .from('teams')
    .update({
      announce_chat_id: target.chatId,
      announce_chat_title: target.title,
      announce_thread_id: target.threadId,
    })
    .eq('id', team.id);
  if (error) {
    console.error('[bot-channel] bind failed:', error);
    return 'Не получилось сохранить привязку, попробуй ещё раз.';
  }
  const where = target.kind === 'channel' ? `Канал «${target.title}»` : `Группа «${target.title}»`;
  const topic = target.threadId ? ' Анонсы будут приходить в эту тему.' : '';
  return `Готово! ${where} привязан${target.kind === 'channel' ? '' : 'а'} к команде «${team.name}» — анонсы событий будут приходить сюда.${topic}`;
}
