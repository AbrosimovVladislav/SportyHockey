import 'server-only';

export function buildInviteLink(teamId: string): string {
  return `https://t.me/${botUsername()}?start=team_${teamId}`;
}

// Персональная invite-ссылка на игрока без аккаунта (flow 2). Несёт его user_id —
// бот по нему находит карточку и привязывает к ней реальный Telegram перешедшего.
export function buildMemberInviteLink(userId: string): string {
  return `https://t.me/${botUsername()}?start=invite_${userId}`;
}

// Инвайт-ссылка с постоянным токеном команды (итерация 41). Открывается через
// startapp-deeplink Mini App — параметр прилетает в initData как start_param,
// клиент перенаправляет на /join/<token>. Один токен на команду, см. team_invites.
export function buildTeamJoinLink(token: string): string {
  return `https://t.me/${botUsername()}?startapp=join_${token}`;
}

// Кнопка «Записаться» под анонсом в канале (итерация 70). В каналах кнопки типа
// web_app запрещены, поэтому это обычная ссылка на Main Mini App бота. Параметр несёт
// id события и invite-токен команды: участник попадает сразу на страницу события,
// новичок по дороге вступает в команду. Формат разбирает start-param-redirect.tsx.
// Длина: 3 + 36 + 1 + 12 = 52 символа — укладывается в лимит 64.
export function buildEventDeepLink(eventId: string, token: string): string {
  return `https://t.me/${botUsername()}?startapp=ev_${eventId}_${token}`;
}

// Прямой путь внутри Mini App — для web_app-кнопок в личке с ботом (там они разрешены).
// null, если MINI_APP_URL не задан.
export function buildMiniAppUrl(path: string): string | null {
  const base = process.env.MINI_APP_URL?.trim().replace(/\/$/, '');
  return base ? `${base}${path}` : null;
}

function botUsername(): string {
  const raw = process.env.BOT_USERNAME;
  if (!raw) {
    throw new Error('BOT_USERNAME должен быть задан');
  }
  // Устойчиво к вводу с @, ссылкой t.me/ и пробелами — Telegram резолвит только чистый юзернейм.
  const name = raw
    .trim()
    .replace(/^https?:\/\/t\.me\//i, '')
    .replace(/^@/, '');
  if (!name) {
    throw new Error('BOT_USERNAME должен быть задан');
  }
  return name;
}
