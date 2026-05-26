import 'server-only';

export function buildInviteLink(teamId: string): string {
  return `https://t.me/${botUsername()}?start=team_${teamId}`;
}

// Персональная invite-ссылка на игрока без аккаунта (flow 2). Несёт его user_id —
// бот по нему находит карточку и привязывает к ней реальный Telegram перешедшего.
export function buildMemberInviteLink(userId: string): string {
  return `https://t.me/${botUsername()}?start=invite_${userId}`;
}

function botUsername(): string {
  const name = process.env.BOT_USERNAME;
  if (!name) {
    throw new Error('BOT_USERNAME должен быть задан');
  }
  return name;
}
