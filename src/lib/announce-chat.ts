import 'server-only';
import type { Api } from 'grammy';

// Проверка прав на чат анонсов при привязке (добавление бота в группу, /connect,
// пересланный пост канала).
//
// Один бот обслуживает все команды, поэтому всегда проверяем обе стороны: бот может
// писать в чат И тот, кто привязывает, — администратор этого чата. Иначе чужой человек
// мог бы направить анонсы своей команды в группу, где бот уже есть.

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
