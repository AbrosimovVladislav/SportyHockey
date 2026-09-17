-- Хват игрока: персональная характеристика (не зависит от команды).
alter table public.users
  add column if not exists shoots text
  check (shoots in ('left', 'right'));

-- Капитанская нашивка в команде: отдельно от прав organizer/player.
alter table public.team_memberships
  add column if not exists captaincy text not null default 'none'
  check (captaincy in ('none', 'assistant', 'captain'));