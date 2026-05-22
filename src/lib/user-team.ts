import 'server-only';
import { supabaseServer } from '@/lib/supabase-server';

export async function getUserTeamId(
  userId: string,
  req?: Request,
): Promise<string | null> {
  const sb = supabaseServer();
  const activeTeamId = req?.headers.get('x-team-id') ?? null;

  if (activeTeamId) {
    const { data } = await sb
      .from('team_memberships')
      .select('team_id')
      .eq('user_id', userId)
      .eq('team_id', activeTeamId)
      .maybeSingle();
    if (data) return data.team_id;
  }

  const { data } = await sb
    .from('team_memberships')
    .select('team_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  return data?.team_id ?? null;
}
