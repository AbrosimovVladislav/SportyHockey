-- Дефолтные звенья команды (построение без деления light/dark, копируется в событие).
create table public.team_default_lines (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  slot text not null,
  updated_at timestamptz not null default now(),
  primary key (team_id, slot)
);
create index team_default_lines_team_user_idx on public.team_default_lines (team_id, user_id);

-- Дефолтное распределение Светлые/Тёмные на уровне команды (для тренировок).
create table public.team_default_sides (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  team_side text not null check (team_side in ('light', 'dark')),
  updated_at timestamptz not null default now(),
  primary key (team_id, user_id)
);