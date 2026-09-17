create table if not exists event_lines (
  event_id uuid not null references events(id) on delete cascade,
  team_side text not null check (team_side in ('light','dark')),
  slot text not null check (slot in (
    'f1_lw','f1_c','f1_rw',
    'f2_lw','f2_c','f2_rw',
    'f3_lw','f3_c','f3_rw',
    'd1_ld','d1_rd',
    'd2_ld','d2_rd',
    'd3_ld','d3_rd',
    'g'
  )),
  user_id uuid not null references users(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (event_id, team_side, slot)
);

create unique index if not exists event_lines_user_unique
  on event_lines (event_id, team_side, user_id);

create index if not exists event_lines_event_team_idx
  on event_lines (event_id, team_side);
