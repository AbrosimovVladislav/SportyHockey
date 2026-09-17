import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrganizer } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { parseChatUsername, resolveChatByUsername } from '@/lib/announce-chat';
import { getBot } from '@/lib/bot';
import { supabaseServer } from '@/lib/supabase-server';
import type { TeamChannelDto } from '@/types/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Группа команды в Telegram, куда бот публикует анонсы (итерации 70–71). У каждой
// команды своя. Публичную группу организатор указывает здесь по @нику (PUT); закрытая
// привязывается сама, когда бота в неё добавляют (lib/bot-channel.ts). Плюс статус и отвязка.

const BindBody = z.object({ username: z.string().trim().min(1).max(100) });

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

export async function PUT(req: Request): Promise<Response> {
  try {
    const org = await requireOrganizer(req);
    const parsed = BindBody.safeParse(await req.json().catch(() => null));
    const username = parsed.success ? parseChatUsername(parsed.data.username) : null;
    if (!username) {
      return NextResponse.json(
        { error: 'Впиши ник группы: @nick или ссылку t.me/nick. Пригласительная ссылка не подойдёт.' },
        { status: 400 },
      );
    }

    const chat = await resolveChatByUsername(getBot().api, username, org.telegram_id);
    if (!chat.ok) {
      return NextResponse.json({ error: chat.message }, { status: chat.status });
    }

    const { error } = await supabaseServer()
      .from('teams')
      .update({
        announce_chat_id: chat.chatId,
        announce_chat_title: chat.title,
        announce_thread_id: null,
      })
      .eq('id', org.team_id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const body: TeamChannelDto = { bound: true, title: chat.title, bot_username: botUsername() };
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
