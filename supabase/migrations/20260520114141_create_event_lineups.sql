-- Хранение распределения игроков по командам (светлые/тёмные) на конкретное событие.
-- Запись существует только для распределённых игроков; отсутствие строки = игрок не распределён.

create table if not exists public.event_lineups (
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references public.users(id)  on delete cascade,
  team_side  text not null check (team_side in ('light', 'dark')),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists event_lineups_event_id_idx
  on public.event_lineups(event_id);