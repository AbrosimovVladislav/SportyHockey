import 'server-only';
import type { Api } from 'grammy';

// Общие проверки чата анонсов — и для бота (добавление в группу, /connect), и для
// настроек команды, где организатор вписывает @ник группы (итерация 71).
//
// Один бот обслуживает все команды, поэтому всегда проверяем обе стороны: бот может
// писать в чат И тот, кто привязывает, — администратор этого чата. Иначе любую
// публичную группу с ботом можно было бы завалить чужими анонсами.

export type ChatKind = 'group' | 'channel';

// null — всё в порядке; иначе текст отказа для пользователя.
export async function checkChatAccess(
  api: Api,
  botId: number,
  chatId: number,
  kind: ChatKind,
  userTelegramId: number,
): Promise<string | null> {
  const isChannel = kind === 'channel';
  try {
    const me = await api.getChatMember(chatId, botId);
    // Канал: нужен админ с правом публикации. Группа: достаточно быть участником,
    // которому не запретили писать.
    const canPost = isChannel
      ? me.status === 'creator' || (me.status === 'administrator' && me.can_post_messages === true)
      : me.status === 'creator' ||
        me.status === 'administrator' ||
        me.status === 'member' ||
        (me.status === 'restricted' && me.can_send_messages);
    if (!canPost) {
      if (!isChannel && (me.status === 'left' || me.status === 'kicked')) {
        return 'Меня нет в этой группе. Добавь меня в группу (лучше администратором) и попробуй ещё раз.';
      }
      return isChannel
        ? 'У меня нет права публиковать в этом канале. Добавь меня администратором с правом «Публикация сообщений» и попробуй ещё раз.'
        : 'Мне запрещено писать в этой группе. Сделай меня администратором группы и попробуй ещё раз.';
    }
    const sender = await api.getChatMember(chatId, userTelegramId);
    if (sender.status !== 'creator' && sender.status !== 'administrator') {
      return isChannel
        ? 'Привязать канал может только его администратор.'
        : 'Привязать группу может только её администратор.';
    }
    return null;
  } catch (e) {
    console.warn('[announce-chat] getChatMember failed:', e);
    return isChannel
      ? 'Я не состою в этом канале. Добавь меня администратором с правом «Публикация сообщений» и попробуй ещё раз.'
      : 'Не получилось проверить права в этой группе. Добавь меня в группу администратором и попробуй ещё раз.';
  }
}

// «@wolves_chat», «wolves_chat», «t.me/wolves_chat», «https://t.me/wolves_chat» → «wolves_chat».
// Пригласительные ссылки (t.me/+…, joinchat) ником не являются — по ним бот чат не найдёт.
export function parseChatUsername(raw: string): string | null {
  const s = raw
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(t|telegram)\.me\//i, '')
    .replace(/^@/, '');
  if (/^joinchat(\/|$)/i.test(s)) return null;
  const name = s.replace(/[/?#].*$/, '');
  return /^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(name) ? name : null;
}

export type ResolvedChat =
  | { ok: true; chatId: number; title: string; kind: ChatKind }
  | { ok: false; status: number; message: string };

// Ник есть только у публичных групп и каналов. Закрытую группу так не найти — она
// привязывается сама, когда бота в неё добавляют (см. bot-channel.ts).
export async function resolveChatByUsername(
  api: Api,
  username: string,
  userTelegramId: number,
): Promise<ResolvedChat> {
  let chat;
  try {
    chat = await api.getChat(`@${username}`);
  } catch (e) {
    console.warn('[announce-chat] getChat failed:', username, e);
    return {
      ok: false,
      status: 404,
      message: `Не нашёл @${username}. Ник есть только у публичной группы — проверь его в настройках группы.`,
    };
  }
  if (chat.type === 'private') {
    return { ok: false, status: 400, message: 'Это ник человека или бота, а нужен ник группы.' };
  }
  const kind: ChatKind = chat.type === 'channel' ? 'channel' : 'group';
  const me = await api.getMe();
  const problem = await checkChatAccess(api, me.id, chat.id, kind, userTelegramId);
  if (problem) return { ok: false, status: 403, message: problem };
  return { ok: true, chatId: chat.id, title: chat.title ?? `@${username}`, kind };
}
