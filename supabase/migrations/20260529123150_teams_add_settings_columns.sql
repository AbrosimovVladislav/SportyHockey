-- Итерация 41: настройки команды.
-- Добавляем к teams:
--   photo_url        — командная фотография для шапки /squad (cover)
--   default_venue_id — стандартная арена (для подстановки при создании события)
--   default_event_cost — стандартная стоимость события (аренда)
--   default_player_fee — стандартный взнос с игрока
--   archived_at      — soft-archive команды (timestamptz; null = активна).

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS default_venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_event_cost numeric(10,2),
  ADD COLUMN IF NOT EXISTS default_player_fee numeric(10,2),
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;