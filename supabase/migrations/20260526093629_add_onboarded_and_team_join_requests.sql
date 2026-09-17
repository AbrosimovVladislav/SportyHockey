-- Маркер прохождения онбординга. Существующие пользователи уже вошли — помечаем onboarded.
ALTER TABLE public.users ADD COLUMN onboarded boolean NOT NULL DEFAULT false;
UPDATE public.users SET onboarded = true;

-- Единая сущность «ожидающая связь игрок↔команда»: и приглашение (kind='invite'),
-- и заявка игрока (kind='request').
CREATE TABLE public.team_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('invite', 'request')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  decided_at timestamptz
);

-- Не больше одной активной (pending) записи на пару (команда, игрок).
CREATE UNIQUE INDEX team_join_requests_pending_uniq
  ON public.team_join_requests (team_id, user_id)
  WHERE status = 'pending';

CREATE INDEX team_join_requests_team_status_idx
  ON public.team_join_requests (team_id, status);