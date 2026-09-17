ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS default_cost_per_player numeric NULL;