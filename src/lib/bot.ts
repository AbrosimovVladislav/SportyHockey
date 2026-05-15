import 'server-only';
import { Bot } from 'grammy';

let cachedBot: Bot | null = null;

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
    await ctx.reply('Привет! Я бот SportyHockey. Открой Mini App, чтобы начать.');
  });
}
