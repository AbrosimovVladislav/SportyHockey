import 'server-only';
import { InlineKeyboard } from 'grammy';

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
  my_vote: BotEventVote;
};

const dateFmt = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
});

const timeFmt = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatDateLine(startsIso: string, endsIso: string | null): string {
  const starts = new Date(startsIso);
  const date = dateFmt.format(starts);
  const startTime = timeFmt.format(starts);
  if (!endsIso) return `📅 ${date} · ${startTime}`;
  const endTime = timeFmt.format(new Date(endsIso));
  return `📅 ${date} · ${startTime}–${endTime}`;
}

function formatRub(n: number): string {
  return n.toLocaleString('ru-RU');
}

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
  lines.push(formatDateLine(args.starts_at, args.ends_at));
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

  const miniAppUrl = process.env.MINI_APP_URL;
  if (miniAppUrl) {
    keyboard.webApp('Открыть в Mini App', `${miniAppUrl}?startapp=event_${args.eventId}`);
  }

  return { text, keyboard };
}
