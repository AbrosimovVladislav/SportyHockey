-- v0.2 итерация 23: модель игрока и членства
-- 1. users.telegram_id допускает NULL (placeholder-игроки)
ALTER TABLE public.users ALTER COLUMN telegram_id DROP NOT NULL;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_telegram_id_key;
DROP INDEX IF EXISTS public.users_telegram_id_key;
CREATE UNIQUE INDEX users_telegram_id_unique_when_present
  ON public.users (telegram_id)
  WHERE telegram_id IS NOT NULL;

-- 2. users: профильные поля
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- 3. team_memberships: командные поля
ALTER TABLE public.team_memberships
  ADD COLUMN IF NOT EXISTS slot_role TEXT,
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'main',
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

ALTER TABLE public.team_memberships
  DROP CONSTRAINT IF EXISTS team_memberships_tier_check;
ALTER TABLE public.team_memberships
  ADD CONSTRAINT team_memberships_tier_check
  CHECK (tier IN ('main', 'reserve'));

ALTER TABLE public.team_memberships
  DROP CONSTRAINT IF EXISTS team_memberships_slot_role_check;
ALTER TABLE public.team_memberships
  ADD CONSTRAINT team_memberships_slot_role_check
  CHECK (slot_role IS NULL OR slot_role IN ('lw', 'c', 'rw', 'ld', 'rd', 'g'));