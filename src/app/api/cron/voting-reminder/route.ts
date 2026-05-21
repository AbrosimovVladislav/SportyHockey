import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { sendVotingReminder } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get('authorization');
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const sb = supabaseServer();
  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: events, error } = await sb
    .from('events')
    .select('id')
    .eq('status', 'scheduled')
    .gte('starts_at', now.toISOString())
    .lte('starts_at', horizon.toISOString());
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;
  let sentTotal = 0;
  for (const event of events ?? []) {
    try {
      const { sent } = await sendVotingReminder(event.id, { only_no_vote: true });
      processed += 1;
      sentTotal += sent;
    } catch (e) {
      console.error('[cron] voting-reminder failed for event:', event.id, e);
    }
  }

  return NextResponse.json({ processed, sent_total: sentTotal });
}
