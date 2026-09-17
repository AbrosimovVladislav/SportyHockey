-- Возвращаем обычный UNIQUE constraint на users.telegram_id.
-- В Postgres 15+ дефолт NULLS DISTINCT — несколько NULL допустимы, но
-- среди не-NULL значений уникальность сохраняется. Это нужно для
-- onConflict в Supabase-клиенте и проще, чем partial unique index.
DROP INDEX IF EXISTS public.users_telegram_id_unique_when_present;
ALTER TABLE public.users
  ADD CONSTRAINT users_telegram_id_key UNIQUE (telegram_id);