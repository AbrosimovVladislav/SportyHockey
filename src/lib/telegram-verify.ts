import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
};

export type VerifiedInitData = {
  user: TelegramUser;
  auth_date: number;
  start_param?: string;
};

// Срок жизни подписи initData. 24h как security-best-practice слишком жёстко
// для TMA, который у пользователя может «висеть в фоне» по нескольку дней —
// при возвращении в app сервер отбрасывал старую подпись и весь интерфейс
// показывал «что-то пошло не так». 7 дней — приемлемый компромисс для PoC
// (HMAC всё равно проверяется криптографически; ограничение чисто против
// replay-атак с украденным initData).
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function verifyInitData(initData: string, botToken: string): VerifiedInitData {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');
  if (!receivedHash) {
    throw new Error('initData: hash отсутствует');
  }
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => [k, v] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const a = Buffer.from(receivedHash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('initData: подпись невалидна');
  }

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate)) {
    throw new Error('initData: auth_date отсутствует');
  }
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > MAX_AGE_SECONDS) {
    throw new Error('initData: устарел');
  }

  const userJson = params.get('user');
  if (!userJson) {
    throw new Error('initData: user отсутствует');
  }
  const user = JSON.parse(userJson) as TelegramUser;

  return {
    user,
    auth_date: authDate,
    start_param: params.get('start_param') ?? undefined,
  };
}
