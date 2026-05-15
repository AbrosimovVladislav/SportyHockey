import { webhookCallback } from 'grammy';
import { getBot } from '@/lib/bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const secret = req.headers.get('x-telegram-bot-api-secret-token');
  if (secret !== process.env.BOT_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const handle = webhookCallback(getBot(), 'std/http');
  return handle(req);
}
