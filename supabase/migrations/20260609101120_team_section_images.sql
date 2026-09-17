create table if not exists public.team_section_images (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  section text not null,
  image_url text not null,
  uploaded_at timestamptz not null default now(),
  constraint team_section_images_section_check check (
    section in ('home', 'team', 'events_list', 'event_detail', 'money')
  ),
  constraint team_section_images_unique unique (team_id, section)
);

create index if not exists team_section_images_team_idx on public.team_section_images(team_id);