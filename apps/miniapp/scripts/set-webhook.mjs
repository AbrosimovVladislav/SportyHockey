// Запуск: pnpm set-webhook https://your-domain.vercel.app
// Требует BOT_TOKEN и BOT_WEBHOOK_SECRET из .env.local (Node --env-file).

const baseUrl = process.argv[2];
if (!baseUrl) {
  console.error('Usage: pnpm set-webhook <public-base-url>');
  process.exit(1);
}

const token = process.env.BOT_TOKEN;
const secret = process.env.BOT_WEBHOOK_SECRET;

if (!token || !secret) {
  console.error('BOT_TOKEN и BOT_WEBHOOK_SECRET должны быть в .env.local');
  process.exit(1);
}

const url = `${baseUrl.replace(/\/$/, '')}/api/bot`;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url,
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  }),
});

const body = await res.json();
console.log(JSON.stringify(body, null, 2));
process.exit(body.ok ? 0 : 1);
