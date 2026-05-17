import 'server-only';
import { supabaseServer } from '@/lib/supabase-server';

export async function getUserTeamId(userId: string): Promise<string | null> {
  const sb = supabaseServer();
  const { data } = await sb
    .from('team_memberships')
    .select('team_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  return data?.team_id ?? null;
}
