create table if not exists public.event_goals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_side text not null check (team_side in ('own','opponent','light','dark')),
  scorer_user_id uuid null references public.users(id) on delete set null,
  time_seconds integer null check (time_seconds is null or (time_seconds >= 0 and time_seconds < 36000)),
  created_at timestamptz not null default now(),
  created_by uuid null references public.users(id) on delete set null
);

create index if not exists event_goals_event_id_idx on public.event_goals (event_id);
create index if not exists event_goals_created_at_idx on public.event_goals (event_id, created_at);

create table if not exists public.event_goal_assists (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.event_goals(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  assist_order smallint not null check (assist_order in (1, 2)),
  unique (goal_id, assist_order),
  unique (goal_id, user_id)
);

create index if not exists event_goal_assists_goal_id_idx on public.event_goal_assists (goal_id);

create table if not exists public.event_penalties (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_side text not null check (team_side in ('own','opponent','light','dark')),
  player_user_id uuid null references public.users(id) on delete set null,
  minutes integer not null check (minutes > 0 and minutes <= 60),
  time_seconds integer null check (time_seconds is null or (time_seconds >= 0 and time_seconds < 36000)),
  created_at timestamptz not null default now(),
  created_by uuid null references public.users(id) on delete set null
);

create index if not exists event_penalties_event_id_idx on public.event_penalties (event_id);
create index if not exists event_penalties_created_at_idx on public.event_penalties (event_id, created_at);
