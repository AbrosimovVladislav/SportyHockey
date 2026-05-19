import 'server-only';
import { getBot } from '@/lib/bot';
import { supabaseServer } from '@/lib/supabase-server';
import { formatName } from '@/lib/format-name';

// Полноценные рассылки по событиям (создание/изменение/отмена + инлайн-голосование) —
// итерация 12.x (`docs/roadmap/v0.1.md`). Здесь сейчас рабочая реализация только для
// `notifyPaymentClaim` (пуш оргам, когда игрок жмёт «я уже оплатил»).

export async function notifyEventCreated(eventId: string): Promise<void> {
  console.log('[notify] event created:', eventId);
}

export async function notifyEventUpdated(eventId: string): Promise<void> {
  console.log('[notify] event updated:', eventId);
}

export async function notifyEventCancelled(eventId: string): Promise<void> {
  console.log('[notify] event cancelled:', eventId);
}

export async function notifyPaymentClaim(args: {
  team_id: string;
  event_id: string;
  claimant_user_id: string;
}): Promise<void> {
  const sb = supabaseServer();

  const { data: claimant } = await sb
    .from('users')
    .select('first_name, last_name, username')
    .eq('id', args.claimant_user_id)
    .maybeSingle();

  const { data: event } = await sb
    .from('events')
    .select('title, type, starts_at')
    .eq('id', args.event_id)
    .maybeSingle();

  const { data: orgs } = await sb
    .from('team_memberships')
    .select('user_id, users(telegram_id)')
    .eq('team_id', args.team_id)
    .eq('role', 'organizer');

  if (!orgs || orgs.length === 0) {
    console.warn('[notify] payment-claim: организаторов нет', args);
    return;
  }

  const playerLabel = claimant
    ? formatName({
        first_name: claimant.first_name,
        last_name: claimant.last_name,
        username: claimant.username,
      })
    : 'Игрок';
  const eventLabel = event?.title?.trim()
    ? event.title.trim()
    : event?.type === 'game'
      ? 'игру'
      : 'тренировку';
  const dateLabel = event?.starts_at
    ? new Date(event.starts_at).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const text =
    `💸 ${playerLabel} утверждает, что уже оплатил${
      eventLabel ? ` ${eventLabel}` : ''
    }${dateLabel ? ` (${dateLabel})` : ''}.\n\n` +
    `Зайди в состав события и проверь — если оплата действительно прошла, отметь сумму в «Сдал».`;

  const miniAppUrl = process.env.MINI_APP_URL;
  const deepLink = miniAppUrl
    ? `${miniAppUrl}?startapp=event_${args.event_id}_attendees`
    : null;

  let bot;
  try {
    bot = getBot();
  } catch (e) {
    console.warn('[notify] payment-claim: бот не сконфигурирован', e);
    return;
  }

  await Promise.all(
    orgs.map(async (o) => {
      const u = Array.isArray(o.users) ? o.users[0] : o.users;
      const telegramId = u?.telegram_id;
      if (!telegramId) return;
      try {
        await bot.api.sendMessage(telegramId, text, {
          reply_markup: deepLink
            ? { inline_keyboard: [[{ text: 'Открыть состав', url: deepLink }]] }
            : undefined,
        });
      } catch (err) {
        console.error('[notify] payment-claim sendMessage failed:', err);
      }
    }),
  );
}
