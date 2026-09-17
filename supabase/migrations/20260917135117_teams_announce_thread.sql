-- v0.8, итерация 70.8: анонсы в группу Telegram, а не только в канал.
-- В группах с темами (форум) анонс нужно слать в конкретную тему — запоминаем ту,
-- в которой организатор отправил /connect. NULL — обычная группа, канал или «General».
alter table public.teams
  add column if not exists announce_thread_id bigint;