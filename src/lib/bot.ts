import 'server-only';
import { Bot, InlineKeyboard, type Context } from 'grammy';
import { supabaseServer } from '@/lib/supabase-server';

let cachedBot: Bot | null = null;

type TelegramFrom = NonNullable<Context['from']>;
type JoinResult =
  | { kind: 'ok'; teamName: string }
  | { kind: 'already_in'; teamName: string }
  | { kind: 'not_found' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getBot(): Bot {
  if (cachedBot) return cachedBot;
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error('BOT_TOKEN должен быть задан');
  }
  const bot = new Bot(token);
  registerHandlers(bot);
  cachedBot = bot;
  return bot;
}

function registerHandlers(bot: Bot): void {
  bot.command('start', async (ctx) => {
    const payload = String(ctx.match ?? '').trim();

    if (payload.startsWith('team_') && ctx.from) {
      const teamId = payload.slice('team_'.length);
      const result = await joinTeamByDeeplink(ctx.from, teamId);
      const kb = openMiniAppKeyboard();

      if (result.kind === 'ok') {
        await ctx.reply(
          `Привет! Ты в команде «${result.teamName}». Открой Mini App, чтобы голосовать за события.`,
          kb ? { reply_markup: kb } : undefined,
        );
        return;
      }
      if (result.kind === 'already_in') {
        await ctx.reply(
          `Ты уже в команде «${result.teamName}». Открой Mini App.`,
          kb ? { reply_markup: kb } : undefined,
        );
        return;
      }
      await ctx.reply('Не удалось найти команду по этой ссылке. Попроси организатора прислать новую.');
      return;
    }

    const kb = openMiniAppKeyboard();
    await ctx.reply(
      'Привет! Я бот SportyHockey. Открой Mini App, чтобы начать.',
      kb ? { reply_markup: kb } : undefined,
    );
  });
}

function openMiniAppKeyboard(): InlineKeyboard | null {
  const url = process.env.MINI_APP_URL;
  if (!url) return null;
  return new InlineKeyboard().webApp('Открыть Mini App', url);
}

async function joinTeamByDeeplink(from: TelegramFrom, teamId: string): Promise<JoinResult> {
  if (!UUID_RE.test(teamId)) {
    return { kind: 'not_found' };
  }
  const sb = supabaseServer();

  const { data: team, error: teamErr } = await sb
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .maybeSingle();
  if (teamErr || !team) return { kind: 'not_found' };

  const { data: u, error: uErr } = await sb
    .from('users')
    .upsert(
      {
        telegram_id: from.id,
        username: from.username ?? null,
        first_name: from.first_name ?? null,
        last_name: from.last_name ?? null,
      },
      { onConflict: 'telegram_id' },
    )
    .select('id')
    .single();
  if (uErr || !u) return { kind: 'not_found' };

  const { data: existing } = await sb
    .from('team_memberships')
    .select('id')
    .eq('team_id', team.id)
    .eq('user_id', u.id)
    .maybeSingle();
  if (existing) return { kind: 'already_in', teamName: team.name };

  const { error: insErr } = await sb
    .from('team_memberships')
    .insert({ team_id: team.id, user_id: u.id, role: 'player' });
  if (insErr) return { kind: 'not_found' };

  return { kind: 'ok', teamName: team.name };
}
