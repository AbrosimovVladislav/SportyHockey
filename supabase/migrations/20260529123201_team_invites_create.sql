-- Итерация 41: постоянный токен-инвайт у каждой команды.
-- Один токен на команду (уникальный индекс по team_id) — постоянный, без срока
-- годности и без ротации (это пост-MVP). Игрок переходит по ссылке /join/<token>,
-- сервер создаёт запись в team_memberships с role='player'.

CREATE TABLE IF NOT EXISTS public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS team_invites_team_id_uniq
  ON public.team_invites (team_id);

CREATE INDEX IF NOT EXISTS team_invites_token_idx
  ON public.team_invites (token);