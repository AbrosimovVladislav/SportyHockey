import 'server-only';
import { GrammyError, InlineKeyboard, InputFile } from 'grammy';
import { getBot } from '@/lib/bot';
import { supabaseServer } from '@/lib/supabase-server';
import { ensureTeamInviteToken } from '@/lib/team-invite';
import { buildEventDeepLink, buildMiniAppUrl } from '@/lib/team-link';
import { escapeHtml, formatEventDateLine, formatRub } from '@/lib/bot-format';

// Анонс события в чат команды в Telegram (итерация 70): фото + подпись + кнопка
// «Записаться». Чат — группа (бот в ней участник, пишет от своего имени; в группе
// с темами — в выбранную тему) или канал (бот — администратор, пост выглядит как пост
// канала). Один бот на все команды; у каждой команды — свой чат.

export type AnnounceFailReason = 'event_not_found' | 'no_channel' | 'bot_no_access' | 'send_failed';

export type AnnounceResult =
  | { ok: true; chat_id: number; message_id: number }
  | { ok: false; reason: AnnounceFailReason; message: string };

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // лимит sendPhoto при загрузке файлом
const DEFAULT_PHOTO_PATH = '/arena.png';

type Joined<T> = T | T[] | null;
function one<T>(v: Joined<T>): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

type AnnounceEvent = {
  id: string;
  team_id: string;
  type: string;
  title: string | null;
  details: string | null;
  starts_at: string;
  ends_at: string | null;
  cost_per_player: number | null;
  status: string | null;
  cancelled_reason: string | null;
  announce_chat_id: number | null;
  announce_message_id: number | null;
  venue: Joined<{ name: string; photo_url: string | null }>;
  team: Joined<{
    name: string;
    timezone: string | null;
    announce_chat_id: number | null;
    announce_thread_id: number | null;
  }>;
};

const EVENT_COLS =
  'id, team_id, type, title, details, starts_at, ends_at, cost_per_player, status, cancelled_reason, ' +
  'announce_chat_id, announce_message_id, venue:venues(name, photo_url), ' +
  'team:teams(name, timezone, announce_chat_id, announce_thread_id)';

async function loadEvent(eventId: string): Promise<AnnounceEvent | null> {
  const { data } = await supabaseServer()
    .from('events')
    .select(EVENT_COLS)
    .eq('id', eventId)
    .maybeSingle();
  return (data as AnnounceEvent | null) ?? null;
}

// Группа превратилась в супергруппу: Telegram отвечает ошибкой с новым id чата.
function migratedChatId(e: unknown): number | null {
  return e instanceof GrammyError ? (e.parameters?.migrate_to_chat_id ?? null) : null;
}

// Telegram не смог отправить из-за прав/доступа к чату (а не из-за самого поста).
function isAccessError(e: unknown): boolean {
  if (!(e instanceof GrammyError)) return false;
  if (e.error_code === 403) return true;
  const d = e.description.toLowerCase();
  return (
    d.includes('chat not found') ||
    d.includes('not enough rights') ||
    d.includes('need administrator rights') ||
    d.includes('not a member')
  );
}

function buildCaption(event: AnnounceEvent): string {
  const team = one(event.team);
  const venue = one(event.venue);
  const isGame = event.type === 'game';
  const title = event.title?.trim();

  const lines: string[] = [];
  lines.push(
    isGame
      ? `🏆 <b>Игра${title ? `: ${escapeHtml(title)}` : ''}</b>`
      : `🏒 <b>${escapeHtml(title || 'Тренировка')}</b>`,
  );
  lines.push(`📅 ${formatEventDateLine(event.starts_at, event.ends_at, team?.timezone)}`);
  if (venue?.name) lines.push(`📍 ${escapeHtml(venue.name)}`);
  const cost = event.cost_per_player != null ? Number(event.cost_per_player) : 0;
  if (cost > 0) lines.push(`💰 ${formatRub(cost)} ₽ с игрока`);
  const details = event.details?.trim();
  if (details) lines.push('', escapeHtml(details));
  return lines.join('\n');
}

// Порядок выбора фото: своя картинка анонса под тип события → фото площадки → стандартная.
async function pickPhoto(event: AnnounceEvent): Promise<InputFile | null> {
  const section = event.type === 'game' ? 'announce_game' : 'announce_training';
  const { data: custom } = await supabaseServer()
    .from('team_section_images')
    .select('image_url')
    .eq('team_id', event.team_id)
    .eq('section', section)
    .maybeSingle();

  const candidates = [
    custom?.image_url ?? null,
    one(event.venue)?.photo_url ?? null,
    buildMiniAppUrl(DEFAULT_PHOTO_PATH),
  ];
  for (const url of candidates) {
    if (!url) continue;
    const file = await downloadPhoto(url);
    if (file) return file;
  }
  return null;
}

// Скачиваем сами и грузим файлом: лимит 10 МБ против 5 МБ при отправке по URL,
// и не зависим от того, сможет ли Telegram достучаться до хранилища.
async function downloadPhoto(url: string): Promise<InputFile | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_PHOTO_BYTES) return null;
    const ext = /\.(png|webp|jpe?g)(\?|$)/i.exec(url)?.[1]?.toLowerCase() ?? 'jpg';
    return new InputFile(bytes, `announce.${ext}`);
  } catch (e) {
    console.warn('[announce] photo download failed:', url, e);
    return null;
  }
}

export async function publishEventAnnouncement(
  eventId: string,
  actorUserId: string,
): Promise<AnnounceResult> {
  const event = await loadEvent(eventId);
  if (!event) return { ok: false, reason: 'event_not_found', message: 'Событие не найдено' };

  let chatId = one(event.team)?.announce_chat_id ?? null;
  if (chatId == null) {
    return { ok: false, reason: 'no_channel', message: 'Чат анонсов не привязан' };
  }
  const threadId = one(event.team)?.announce_thread_id ?? undefined;

  const token = await ensureTeamInviteToken(event.team_id, actorUserId);
  const keyboard = new InlineKeyboard().url('Записаться', buildEventDeepLink(event.id, token));
  const caption = buildCaption(event);
  const bot = getBot();

  const photo = await pickPhoto(event);
  const send = async (to: number): Promise<number> => {
    if (photo) {
      try {
        const sent = await bot.api.sendPhoto(to, photo, {
          caption,
          parse_mode: 'HTML',
          reply_markup: keyboard,
          message_thread_id: threadId,
        });
        return sent.message_id;
      } catch (e) {
        if (isAccessError(e) || migratedChatId(e) != null) throw e;
        // Telegram не принял саму картинку (размеры, формат, запрет медиа в группе) —
        // анонс важнее фото.
        console.warn('[announce] sendPhoto failed, fallback to text:', e);
      }
    }
    const sent = await bot.api.sendMessage(to, caption, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
      message_thread_id: threadId,
    });
    return sent.message_id;
  };

  let messageId: number;
  try {
    try {
      messageId = await send(chatId);
    } catch (e) {
      const newChatId = migratedChatId(e);
      if (newChatId == null) throw e;
      // Запоминаем новый id чата и повторяем один раз.
      await supabaseServer()
        .from('teams')
        .update({ announce_chat_id: newChatId })
        .eq('id', event.team_id);
      chatId = newChatId;
      messageId = await send(chatId);
    }
  } catch (e) {
    console.error('[announce] publish failed:', e);
    if (isAccessError(e)) {
      return {
        ok: false,
        reason: 'bot_no_access',
        message:
          'Бот не может писать в чат анонсов. Проверь, что он всё ещё в группе (или администратор канала с правом публикации).',
      };
    }
    return { ok: false, reason: 'send_failed', message: 'Telegram не принял анонс, попробуй ещё раз' };
  }

  const { error } = await supabaseServer()
    .from('events')
    .update({
      announce_chat_id: chatId,
      announce_message_id: messageId,
      announced_at: new Date().toISOString(),
    })
    .eq('id', event.id);
  if (error) console.error('[announce] save message id failed:', error);

  return { ok: true, chat_id: chatId, message_id: messageId };
}

export type AnnounceReplyKind = 'cancelled' | 'rescheduled' | 'restored';

// Реплай под уже опубликованным анонсом: отмена, перенос, восстановление.
// Нет анонса — ничего не делаем. Ошибки не пробрасываем: это побочный эффект.
export async function replyToAnnouncement(eventId: string, kind: AnnounceReplyKind): Promise<void> {
  const event = await loadEvent(eventId);
  if (!event || event.announce_chat_id == null || event.announce_message_id == null) return;

  const when = formatEventDateLine(event.starts_at, event.ends_at, one(event.team)?.timezone);
  const venueName = one(event.venue)?.name;
  const lines: string[] = [];
  if (kind === 'cancelled') {
    lines.push('❌ <b>Отменено</b>');
    const reason = event.cancelled_reason?.trim();
    if (reason) lines.push(escapeHtml(reason));
  } else {
    lines.push(kind === 'rescheduled' ? '🔁 <b>Перенос</b>' : '✅ <b>Событие снова в силе</b>');
    lines.push(`📅 ${when}`);
    if (venueName) lines.push(`📍 ${escapeHtml(venueName)}`);
  }

  try {
    await getBot().api.sendMessage(event.announce_chat_id, lines.join('\n'), {
      parse_mode: 'HTML',
      reply_parameters: {
        message_id: event.announce_message_id,
        allow_sending_without_reply: true,
      },
    });
  } catch (e) {
    console.error('[announce] reply failed:', kind, e);
  }
}
