-- Users (1:1 с Telegram-юзером)
create table public.users (
  id           uuid primary key default gen_random_uuid(),
  telegram_id  bigint unique not null,
  username     text,
  first_name   text,
  last_name    text,
  photo_url    text,
  created_at   timestamptz default now()
);

create table public.teams (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  logo_url     text,
  created_at   timestamptz default now()
);

create table public.team_memberships (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  role         text not null check (role in ('organizer', 'player')),
  joined_at    timestamptz default now(),
  unique (team_id, user_id)
);

create table public.venues (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams(id) on delete cascade,
  name         text not null,
  address      text,
  notes        text,
  created_at   timestamptz default now()
);

create table public.events (
  id               uuid primary key default gen_random_uuid(),
  team_id          uuid not null references public.teams(id) on delete cascade,
  type             text not null check (type in ('training', 'game')),
  title            text,
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  venue_id         uuid references public.venues(id) on delete set null,
  venue_text       text,
  description      text,
  visibility       text default 'private' check (visibility in ('private','public')),
  cost_per_player  numeric(10,2),
  status           text default 'scheduled' check (status in ('scheduled','cancelled','completed')),
  created_by       uuid references public.users(id),
  created_at       timestamptz default now()
);
create index events_team_starts_idx on public.events (team_id, starts_at);

create table public.event_attendances (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  vote         text check (vote in ('going','maybe','not_going')),
  showed_up    boolean,
  team_color   text check (team_color in ('white','dark')),
  paid_amount  numeric(10,2) default 0,
  goals        integer default 0,
  assists      integer default 0,
  notes        text,
  voted_at     timestamptz,
  unique (event_id, user_id)
);

create table public.finance_transactions (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams(id) on delete cascade,
  user_id      uuid references public.users(id) on delete cascade,
  event_id     uuid references public.events(id) on delete set null,
  type         text not null check (type in ('income','expense','player_payment','player_debt')),
  amount       numeric(10,2) not null,
  description  text,
  created_by   uuid references public.users(id),
  created_at   timestamptz default now()
);
create index finance_team_created_idx on public.finance_transactions (team_id, created_at desc);

create table public.media_items (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams(id) on delete cascade,
  event_id     uuid references public.events(id) on delete set null,
  uploaded_by  uuid references public.users(id),
  storage_path text not null,
  type         text check (type in ('photo','video')),
  width        integer,
  height       integer,
  created_at   timestamptz default now()
);

-- PoC: RLS отключён на всех таблицах. Весь доступ через server-side API с service-role.
alter table public.users               disable row level security;
alter table public.teams               disable row level security;
alter table public.team_memberships    disable row level security;
alter table public.venues              disable row level security;
alter table public.events              disable row level security;
alter table public.event_attendances   disable row level security;
alter table public.finance_transactions disable row level security;
alter table public.media_items         disable row level security;
