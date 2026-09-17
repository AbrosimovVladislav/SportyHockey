-- Итерация 37.1: сохранённый исход события (для счётчика «Побед» в командной статистике).
-- Заполняется и пересчитывается на сервере через src/lib/event-outcome.ts при любых
-- изменениях result_points типа 'goal'. Для тренировок и игр без зафиксированного счёта — NULL.
ALTER TABLE public.events
  ADD COLUMN outcome text NULL
  CHECK (outcome IS NULL OR outcome IN ('win', 'draw', 'loss'));

COMMENT ON COLUMN public.events.outcome IS
  'Сохранённый исход игры (win/draw/loss). NULL для тренировок и для игр без зафиксированного счёта. Считается на основе result_points (type=goal, team_side own vs opponent).';