import { NextResponse } from 'next/server';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import type { TeamChannelDto } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Итерация 70 — чат анонсов активной команды: группа или канал Telegram.
// Сама привязка идёт через бота (добавление в группу / команда /connect, либо
// пересланный пост из канала — см. lib/bot-channel.ts); здесь — статус и отвязка.

function botUsername(): string | null {
  const raw = process.env.BOT_USERNAME?.trim();
  if (!raw) return null;
  return raw.replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '') || null;
}

export async function GET(req: Request): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const { data, error } = await supabaseServer()
      .from('teams')
      .select('announce_chat_id, announce_chat_title')
      .eq('id', org.team_id)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const body: TeamChannelDto = {
      bound: data?.announce_chat_id != null,
      title: data?.announce_chat_title ?? null,
      bot_username: botUsername(),
    };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(req: Request): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const { error } = await supabaseServer()
      .from('teams')
      .update({ announce_chat_id: null, announce_chat_title: null, announce_thread_id: null })
      .eq('id', org.team_id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const body: TeamChannelDto = { bound: false, title: null, bot_username: botUsername() };
    return NextResponse.json(body);
  } catch (e) {
    return handleRouteError(e);
  }
}
