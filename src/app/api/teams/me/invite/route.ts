import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { ensureTeamInviteToken } from '@/lib/team-invite';
import { buildTeamJoinLink } from '@/lib/team-link';
import type { TeamInviteDto } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Итерация 41 — постоянный токен команды для приглашения игроков.
// Один токен на команду; если записи ещё нет — создаётся лениво (см. team-invite.ts).

export async function GET(req: Request): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const token = await ensureTeamInviteToken(org.team_id, org.id);
    const body: TeamInviteDto = { token, url: buildTeamJoinLink(token) };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
