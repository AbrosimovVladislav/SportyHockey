import 'server-only';
import { getBot } from '@/lib/bot';
import { supabaseServer } from '@/lib/supabase-server';
import { formatName } from '@/lib/format-name';
import { buildEventCard, type BotEventVote } from '@/lib/bot-event-card';
import { asEventType } from '@/lib/event-enum';

export async function notifyEventCreated(eventId: string): Promise<void> {
  const sb = supabaseServer();

  const { data: event } = await sb
    .from('events')
    .select(
      'id, team_id, type, title, starts_at, ends_at, cost_per_player, opponent_name, venue:venues(name)',
    )
    .eq('id', eventId)
    .maybeSingle();
  if (!event) {
    console.warn('[notify] event-created: событие не найдено', eventId);
    return;
  }

  const { data: players } = await sb
    .from('team_memberships')
    .select('user_id, users(telegram_id)')
    .eq('team_id', event.team_id)
    .eq('role', 'player');
  if (!players || players.length === 0) return;

  let bot;
  try {
    bot = getBot();
  } catch (e) {
    console.warn('[notify] event-created: бот не сконфигурирован', e);
    return;
  }

  const venueRaw = Array.isArray(event.venue) ? event.venue[0] : event.venue;
  const cardArgs = {
    eventId: event.id,
    type: asEventType(event.type),
    title: event.title,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    venue_name: venueRaw?.name ?? null,
    cost_per_player: event.cost_per_player != null ? Number(event.cost_per_player) : null,
    opponent_name: event.opponent_name ?? null,
  };

  await Promise.all(
    players.map(async (p) => {
      const u = Array.isArray(p.users) ? p.users[0] : p.users;
      const telegramId = u?.telegram_id;
      if (!telegramId) return;
      const card = buildEventCard({ ...cardArgs, my_vote: null });
      try {
        await bot.api.sendMessage(telegramId, card.text, {
          reply_markup: card.keyboard,
        });
      } catch (err) {
        console.error('[notify] event-created sendMessage failed:', err);
      }
    }),
  );
}

export async function sendVotingReminder(
  eventId: string,
  options: { only_no_vote?: boolean } = { only_no_vote: true },
): Promise<{ sent: number }> {
  const sb = supabaseServer();

  const { data: event } = await sb
    .from('events')
    .select(
      'id, team_id, type, title, starts_at, ends_at, cost_per_player, opponent_name, status, venue:venues(name)',
    )
    .eq('id', eventId)
    .maybeSingle();
  if (!event || event.status === 'cancelled') return { sent: 0 };

  const { data: players } = await sb
    .from('team_memberships')
    .select('user_id, users(telegram_id)')
    .eq('team_id', event.team_id)
    .eq('role', 'player');
  if (!players || players.length === 0) return { sent: 0 };

  const userIds = players.map((p) => p.user_id);
  const { data: votes } = await sb
    .from('event_attendances')
    .select('user_id, vote')
    .eq('event_id', event.id)
    .in('user_id', userIds);
  const voteMap = new Map<string, BotEventVote>(
    (votes ?? []).map((v) => [
      v.user_id,
      (v.vote === 'going' || v.vote === 'not_going' ? v.vote : null) as BotEventVote,
    ]),
  );

  let bot;
  try {
    bot = getBot();
  } catch (e) {
    console.warn('[notify] voting-reminder: бот не сконфигурирован', e);
    return { sent: 0 };
  }

  const venueRaw = Array.isArray(event.venue) ? event.venue[0] : event.venue;
  const baseArgs = {
    eventId: event.id,
    type: asEventType(event.type),
    title: event.title,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    venue_name: venueRaw?.name ?? null,
    cost_per_player: event.cost_per_player != null ? Number(event.cost_per_player) : null,
    opponent_name: event.opponent_name ?? null,
  };

  let sent = 0;
  await Promise.all(
    players.map(async (p) => {
      const myVote = voteMap.get(p.user_id) ?? null;
      if (options.only_no_vote && myVote != null) return;
      const u = Array.isArray(p.users) ? p.users[0] : p.users;
      const telegramId = u?.telegram_id;
      if (!telegramId) return;
      const card = buildEventCard({ ...baseArgs, my_vote: myVote, with_reminder_prefix: true });
      try {
        await bot.api.sendMessage(telegramId, card.text, {
          reply_markup: card.keyboard,
        });
        sent += 1;
      } catch (err) {
        console.error('[notify] voting-reminder sendMessage failed:', err);
      }
    }),
  );
  return { sent };
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
