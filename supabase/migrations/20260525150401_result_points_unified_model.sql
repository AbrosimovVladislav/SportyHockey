-- Единая модель результативных очков: гол и передача — строки одной таблицы.
create table result_points (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  type text not null check (type in ('goal', 'assist')),
  team_side text not null,
  time_seconds integer,
  created_at timestamptz not null default now(),
  created_by uuid references users(id) on delete set null
);

create index result_points_event_idx on result_points (event_id);
create index result_points_user_idx on result_points (user_id);
create index result_points_event_type_idx on result_points (event_id, type);

-- Связь гол ↔ передача. UNIQUE(assist) гарантирует: одна передача принадлежит ровно одному голу.
create table result_point_links (
  goal_point_id uuid not null,
  assist_point_id uuid not null,
  assist_order integer not null,
  primary key (goal_point_id, assist_point_id),
  constraint rpl_goal_fk foreign key (goal_point_id) references result_points (id) on delete cascade,
  constraint rpl_assist_fk foreign key (assist_point_id) references result_points (id) on delete cascade,
  constraint rpl_assist_unique unique (assist_point_id)
);

-- Перенос голов (id сохраняем).
insert into result_points (id, event_id, user_id, type, team_side, time_seconds, created_at, created_by)
select id, event_id, scorer_user_id, 'goal', team_side, time_seconds, created_at, created_by
from event_goals;

-- Перенос передач: event_id и сторона берутся из их гола (id сохраняем).
insert into result_points (id, event_id, user_id, type, team_side, time_seconds, created_at, created_by)
select a.id, g.event_id, a.user_id, 'assist', g.team_side, null, g.created_at, g.created_by
from event_goal_assists a
join event_goals g on g.id = a.goal_id;

-- Перенос связей.
insert into result_point_links (goal_point_id, assist_point_id, assist_order)
select a.goal_id, a.id, a.assist_order
from event_goal_assists a;