-- v0.8, итерация 70: анонсы событий в Telegram-канал команды.

-- Привязанный канал команды. Один бот на все команды; у каждой команды — свой канал.
-- bigint: id каналов Telegram (-100xxxxxxxxxx) не помещаются в int4.
alter table public.teams
  add column if not exists announce_chat_id bigint,
  add column if not exists announce_chat_title text;

-- Куда и когда ушёл анонс события: нужно для повторной публикации и реплаев об отмене/переносе.
alter table public.events
  add column if not exists announce_chat_id bigint,
  add column if not exists announce_message_id bigint,
  add column if not exists announced_at timestamptz;

-- Разрешил ли пользователь боту писать в личку (requestWriteAccess / allows_write_to_pm).
-- NULL — ещё не спрашивали.
alter table public.users
  add column if not exists bot_write_allowed boolean;

-- Свои картинки анонсов: отдельно для тренировки и для игры.
alter table public.team_section_images
  drop constraint if exists team_section_images_section_check;
alter table public.team_section_images
  add constraint team_section_images_section_check check (
    section in ('home', 'team', 'events_list', 'event_detail', 'money', 'announce_training', 'announce_game')
  );