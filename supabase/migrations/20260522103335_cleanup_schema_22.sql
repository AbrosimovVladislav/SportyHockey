-- event_attendances: drop dead columns
ALTER TABLE public.event_attendances
  DROP COLUMN IF EXISTS paid_amount,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS goals,
  DROP COLUMN IF EXISTS assists;

-- event_attendances: rename team_color -> team_side, migrate values white -> light
ALTER TABLE public.event_attendances
  DROP CONSTRAINT IF EXISTS event_attendances_team_color_check;

ALTER TABLE public.event_attendances
  RENAME COLUMN team_color TO team_side;

UPDATE public.event_attendances
  SET team_side = 'light'
  WHERE team_side = 'white';

ALTER TABLE public.event_attendances
  ADD CONSTRAINT event_attendances_team_side_check
  CHECK (team_side IS NULL OR team_side = ANY (ARRAY['light'::text, 'dark'::text]));

-- events: drop dead columns
ALTER TABLE public.events
  DROP COLUMN IF EXISTS visibility,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS venue_text;

-- media_items: drop dead columns
ALTER TABLE public.media_items
  DROP COLUMN IF EXISTS width,
  DROP COLUMN IF EXISTS height;

-- venues: drop FK + team_id
ALTER TABLE public.venues
  DROP CONSTRAINT IF EXISTS venues_team_id_fkey;

ALTER TABLE public.venues
  DROP COLUMN IF EXISTS team_id;
