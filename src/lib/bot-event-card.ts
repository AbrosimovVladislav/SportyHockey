import 'server-only';
import { InlineKeyboard } from 'grammy';
import { formatEventDateLine, formatRub } from '@/lib/bot-format';
import { buildMiniAppUrl } from '@/lib/team-link';

export type BotEventVote = 'going' | 'not_going' | null;

export type BotEventCardArgs = {
  eventId: string;
  type: 'training' | 'game';
  title: string | null;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  cost_per_player: number | null;
  opponent_name: string | null;
  // Название команды — чтобы игрок нескольких команд понимал, чьё это событие.
  team_name: string | null;
  // IANA-пояс команды: сервер живёт в UTC, время пишем в поясе команды.
  timezone: string | null;
  my_vote: BotEventVote;
};

export function buildEventCard(args: BotEventCardArgs): {
  text: string;
  keyboard: InlineKeyboard;
} {
  const titleSource =
    args.title?.trim() ||
    (args.type === 'game'
      ? args.opponent_name?.trim()
        ? `Игра с «${args.opponent_name.trim()}»`
        : 'Игра'
      : 'Тренировка');

  const lines: string[] = [];
  lines.push(`🏒 ${titleSource}`);
  // У игры название команды уже в заголовке («Команда vs Соперник»).
  if (args.type !== 'game' && args.team_name?.trim()) lines.push(`👥 ${args.team_name.trim()}`);
  lines.push(`📅 ${formatEventDateLine(args.starts_at, args.ends_at, args.timezone)}`);
  if (args.venue_name) lines.push(`📍 ${args.venue_name}`);
  if (args.cost_per_player != null && args.cost_per_player > 0) {
    lines.push(`💰 ${formatRub(args.cost_per_player)} ₽`);
  }
  const text = lines.join('\n');

  const goingLabel = args.my_vote === 'going' ? '✅ Иду ✓' : '✅ Иду';
  const notGoingLabel = args.my_vote === 'not_going' ? '❌ Не иду ✓' : '❌ Не иду';

  const keyboard = new InlineKeyboard()
    .text(goingLabel, `vote:going:${args.eventId}`)
    .text(notGoingLabel, `vote:not_going:${args.eventId}`)
    .row();

  // Личка с ботом — здесь web_app-кнопка разрешена и открывает экран напрямую.
  const eventUrl = buildMiniAppUrl(`/events/${args.eventId}`);
  if (eventUrl) keyboard.webApp('Открыть в Mini App', eventUrl);

  return { text, keyboard };
}
