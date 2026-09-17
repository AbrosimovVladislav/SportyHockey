-- Убираем мёртвый голос 'maybe' (его нельзя выставить из приложения; 0 строк в БД).
alter table public.event_attendances
  drop constraint event_attendances_vote_check;
alter table public.event_attendances
  add constraint event_attendances_vote_check
  check (vote = any (array['going'::text, 'not_going'::text]));

-- Сторона игрока хранится в event_lineups; колонка team_side в event_attendances
-- нигде не читалась/писалась (0 непустых) — удаляем дубль-поле.
alter table public.event_attendances
  drop column team_side;