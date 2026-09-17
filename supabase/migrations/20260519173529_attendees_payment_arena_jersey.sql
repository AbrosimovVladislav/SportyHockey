
ALTER TABLE public.team_memberships
  ADD COLUMN IF NOT EXISTS jersey_number int NULL,
  ADD COLUMN IF NOT EXISTS position text NULL;

ALTER TABLE public.team_memberships DROP CONSTRAINT IF EXISTS team_memberships_position_check;
ALTER TABLE public.team_memberships
  ADD CONSTRAINT team_memberships_position_check
  CHECK (position IS NULL OR position IN ('forward', 'defender', 'goalie'));

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS cost_per_arena numeric NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS arena_cost numeric NULL;

ALTER TABLE public.event_attendances
  ADD COLUMN IF NOT EXISTS payment_claim boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS finance_transactions_player_payment_unique
  ON public.finance_transactions (event_id, user_id)
  WHERE type = 'player_payment';
