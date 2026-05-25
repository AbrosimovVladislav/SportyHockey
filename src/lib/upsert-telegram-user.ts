import 'server-only';
import { supabaseServer } from '@/lib/supabase-server';

export type TgIdentityInput = {
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
};

export type TgUserRow = {
  id: string;
  telegram_id: number | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

const COLS = 'id, telegram_id, username, first_name, last_name, photo_url';

/**
 * Гарантирует строку `users` по `telegram_id` и возвращает её.
 *
 * Имя/фамилию пишем ТОЛЬКО при создании строки. После регистрации источник
 * правды по имени — приложение (правка организатором в профиле игрока), поэтому
 * Telegram больше не затирает `first_name`/`last_name` при каждом входе.
 * Волатильные поля (`username`, `photo_url`) освежаем из Telegram на каждом входе.
 */
export async function upsertTelegramUser(tg: TgIdentityInput): Promise<TgUserRow> {
  const sb = supabaseServer();

  const volatile: { username?: string | null; photo_url?: string | null } = {};
  if (tg.username !== undefined) volatile.username = tg.username;
  if (tg.photo_url !== undefined) volatile.photo_url = tg.photo_url;

  // Существующая строка → обновляем только волатильные поля, имя не трогаем.
  if (Object.keys(volatile).length > 0) {
    const { data, error } = await sb
      .from('users')
      .update(volatile)
      .eq('telegram_id', tg.telegram_id)
      .select(COLS);
    if (error) throw new Error(`users update failed: ${error.message}`);
    if (data && data.length > 0) return data[0] as TgUserRow;
  } else {
    const { data, error } = await sb
      .from('users')
      .select(COLS)
      .eq('telegram_id', tg.telegram_id)
      .maybeSingle();
    if (error) throw new Error(`users lookup failed: ${error.message}`);
    if (data) return data as TgUserRow;
  }

  // Строки ещё нет → создаём с полным набором (имя из Telegram как стартовое).
  // ignoreDuplicates, чтобы гонка двух первых запросов не перезаписала имя.
  const { data: inserted, error: insErr } = await sb
    .from('users')
    .upsert(
      {
        telegram_id: tg.telegram_id,
        username: tg.username ?? null,
        first_name: tg.first_name ?? null,
        last_name: tg.last_name ?? null,
        photo_url: tg.photo_url ?? null,
      },
      { onConflict: 'telegram_id', ignoreDuplicates: true },
    )
    .select(COLS)
    .maybeSingle();
  if (insErr) throw new Error(`users insert failed: ${insErr.message}`);
  if (inserted) return inserted as TgUserRow;

  // Строку успели создать параллельно — просто читаем её.
  const { data: again, error: againErr } = await sb
    .from('users')
    .select(COLS)
    .eq('telegram_id', tg.telegram_id)
    .single();
  if (againErr || !again) {
    throw new Error(`users resolve failed: ${againErr?.message ?? 'not found'}`);
  }
  return again as TgUserRow;
}
