import 'server-only';

export function buildInviteLink(teamId: string): string {
  const botUsername = process.env.BOT_USERNAME;
  if (!botUsername) {
    throw new Error('BOT_USERNAME должен быть задан');
  }
  return `https://t.me/${botUsername}?start=team_${teamId}`;
}
