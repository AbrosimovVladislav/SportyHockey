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
