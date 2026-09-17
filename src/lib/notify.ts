import 'server-only';
import { getBot } from '@/lib/bot';
import { supabaseServer } from '@/lib/supabase-server';
import { formatName } from '@/lib/format-name';
import { buildEventCard } from '@/lib/bot-event-card';
import { asEventType } from '@/lib/event-enum';
import { replyToAnnouncement } from '@/lib/announce';
import { formatEventDateLine, formatRub, resolveTimezone } from '@/lib/bot-format';
import { buildMiniAppUrl } from '@/lib/team-link';

export async function notifyEventCreated(eventId: string): Promise<void> {
  const sb = supabaseServer();

  const { data: event } = await sb
    .from('events')
    .select(
      'id, team_id, type, title, starts_at, ends_at, cost_per_player, opponent_name, venue:venues(name), team:teams(name, timezone)',
    )
    .eq('id', eventId)
    .maybeSingle();
  if (!event) {
    console.warn('[notify] event-created: событие не найдено', eventId);
    return;
  }

  // Уведомление о событии — всей команде (игроки + организаторы, включая автора),
  // без фильтра по роли (roadmap 33.7).
  const { data: members } = await sb
    .from('team_memberships')
    .select('user_id, users(telegram_id)')
    .eq('team_id', event.team_id);
  if (!members || members.length === 0) return;

  let bot;
  try {
    bot = getBot();
  } catch (e) {
    console.warn('[notify] event-created: бот не сконфигурирован', e);
    return;
  }

  const venueRaw = Array.isArray(event.venue) ? event.venue[0] : event.venue;
  const teamRaw = Array.isArray(event.team) ? event.team[0] : event.team;
  const cardArgs = {
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
  };

  const card = buildEventCard(cardArgs);
  await Promise.all(
    members.map(async (p) => {
      const u = Array.isArray(p.users) ? p.users[0] : p.users;
      const telegramId = u?.telegram_id;
      if (!telegramId) return;
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

// Серия тренировок (итерация 72): одно личное сообщение со всеми датами вместо пачки
// одинаковых карточек.
export async function notifyEventSeriesCreated(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;
  if (eventIds.length === 1) return notifyEventCreated(eventIds[0]);
  const sb = supabaseServer();

  const { data: events } = await sb
    .from('events')
    .select(
      'id, team_id, type, starts_at, ends_at, cost_per_player, venue:venues(name), team:teams(name, timezone)',
    )
    .in('id', eventIds)
    .order('starts_at', { ascending: true });
  if (!events || events.length === 0) return;

  const first = events[0];
  const { data: members } = await sb
    .from('team_memberships')
    .select('user_id, users(telegram_id)')
    .eq('team_id', first.team_id);
  if (!members || members.length === 0) return;

  let bot;
  try {
    bot = getBot();
  } catch (e) {
    console.warn('[notify] series-created: бот не сконфигурирован', e);
    return;
  }

  const venueRaw = Array.isArray(first.venue) ? first.venue[0] : first.venue;
  const teamRaw = Array.isArray(first.team) ? first.team[0] : first.team;
  const isGame = first.type === 'game';
  const lines: string[] = [`🏒 Новые ${isGame ? 'игры' : 'тренировки'}: ${events.length}`];
  if (teamRaw?.name?.trim()) lines.push(`👥 ${teamRaw.name.trim()}`);
  for (const e of events) {
    lines.push(`📅 ${formatEventDateLine(e.starts_at, e.ends_at, teamRaw?.timezone)}`);
  }
  if (venueRaw?.name) lines.push(`📍 ${venueRaw.name}`);
  const cost = first.cost_per_player != null ? Number(first.cost_per_player) : 0;
  if (cost > 0) lines.push(`💰 ${formatRub(cost)} ₽`);
  const text = lines.join('\n');

  const eventsUrl = buildMiniAppUrl('/events');
  const replyMarkup = eventsUrl
    ? { inline_keyboard: [[{ text: 'Открыть в Mini App', web_app: { url: eventsUrl } }]] }
    : undefined;

  await Promise.all(
    members.map(async (p) => {
      const u = Array.isArray(p.users) ? p.users[0] : p.users;
      const telegramId = u?.telegram_id;
      if (!telegramId) return;
      try {
        await bot.api.sendMessage(telegramId, text, { reply_markup: replyMarkup });
      } catch (err) {
        console.error('[notify] series-created sendMessage failed:', err);
      }
    }),
  );
}

// Изменение события. В канал пишем только то, что важно всем: перенос (время или
// площадка) и возврат отменённого события. Правка взноса/деталей реплая не стоит.
// Личные сообщения об изменениях пока не сделаны.
export async function notifyEventUpdated(
  eventId: string,
  change: { rescheduled: boolean; restored: boolean },
): Promise<void> {
  if (change.restored) await replyToAnnouncement(eventId, 'restored');
  else if (change.rescheduled) await replyToAnnouncement(eventId, 'rescheduled');
}

export async function notifyEventCancelled(eventId: string): Promise<void> {
  await replyToAnnouncement(eventId, 'cancelled');
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
    .select('title, type, starts_at, team:teams(timezone)')
    .eq('id', args.event_id)
    .maybeSingle();
  const teamRaw = Array.isArray(event?.team) ? event?.team[0] : event?.team;

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
        timeZone: resolveTimezone(teamRaw?.timezone),
      })
    : null;

  const text =
    `💸 ${playerLabel} утверждает, что уже оплатил${
      eventLabel ? ` ${eventLabel}` : ''
    }${dateLabel ? ` (${dateLabel})` : ''}.\n\n` +
    `Зайди в состав события и проверь — если оплата действительно прошла, отметь сумму в «Сдал».`;

  // Личка с ботом — web_app-кнопка открывает экран состава напрямую.
  const attendeesUrl = buildMiniAppUrl(`/events/${args.event_id}/attendees`);

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
          reply_markup: attendeesUrl
            ? { inline_keyboard: [[{ text: 'Открыть состав', web_app: { url: attendeesUrl } }]] }
            : undefined,
        });
      } catch (err) {
        console.error('[notify] payment-claim sendMessage failed:', err);
      }
    }),
  );
}
