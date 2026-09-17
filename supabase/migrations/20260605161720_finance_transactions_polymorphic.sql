-- v0.5, итерация 60. Полиморфная схема ledger'а:
-- вместо отдельных FK on `from_user_id` / `from_venue_id` / `to_user_id` /
-- `to_venue_id` — одна пара полиморфных колонок `from_kind+from_id` /
-- `to_kind+to_id`. FK на `from_id`/`to_id` нет (полиморфная ссылка —
-- стандартная плата). Целостность гарантирует адаптер в приложении.
-- Также денормализованное зеркало `type`/`category`/`user_id` дропается —
-- маппер собирает соответствующие поля DTO из ledger-полей.

-- 1) Добавляем новые колонки и переименовываем external_label → external_kind.
ALTER TABLE finance_transactions
  ADD COLUMN from_id uuid,
  ADD COLUMN to_id   uuid;

ALTER TABLE finance_transactions
  RENAME COLUMN external_label TO external_kind;

-- 2) Бэкфилл: from_id/to_id из старых FK-колонок и team_id.
-- user: from_id = from_user_id
UPDATE finance_transactions
SET from_id = from_user_id
WHERE kind = 'transfer' AND from_kind = 'user';

-- venue: from_id = from_venue_id
UPDATE finance_transactions
SET from_id = from_venue_id
WHERE kind = 'transfer' AND from_kind = 'venue';

-- team: from_id = team_id (по соглашению, для симметрии формулы баланса)
UPDATE finance_transactions
SET from_id = team_id
WHERE kind = 'transfer' AND from_kind = 'team';

-- external: from_id остаётся NULL

-- to-сторона
UPDATE finance_transactions
SET to_id = to_user_id
WHERE kind = 'transfer' AND to_kind = 'user';

UPDATE finance_transactions
SET to_id = to_venue_id
WHERE kind = 'transfer' AND to_kind = 'venue';

UPDATE finance_transactions
SET to_id = team_id
WHERE kind = 'transfer' AND to_kind = 'team';

UPDATE finance_transactions
SET to_id = to_user_id
WHERE kind = 'adjustment';

-- 3) Дроп старых CHECK constraints (созданных в итерации 58).
ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS ft_kind_check;
ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS ft_from_kind_check;
ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS ft_to_kind_check;
ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS ft_shape_check;
ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS ft_adjustment_one_side_check;
ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS ft_from_user_consistency_check;
ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS ft_to_user_consistency_check;
ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS ft_from_venue_consistency_check;
ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS ft_to_venue_consistency_check;
ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS ft_external_label_consistency_check;
-- Старая итерация 48 могла создать CHECK на type:
ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS finance_transactions_type_check;
ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS finance_transactions_category_check;

-- 4) Дроп старых индексов из итераций 48 и 58.
DROP INDEX IF EXISTS finance_transactions_team_venue_idx;
DROP INDEX IF EXISTS finance_transactions_team_from_user_idx;
DROP INDEX IF EXISTS finance_transactions_team_to_user_idx;
DROP INDEX IF EXISTS finance_transactions_team_id_type_idx;
DROP INDEX IF EXISTS finance_transactions_team_type_idx;

-- 5) Дроп старых колонок-зеркал и FK-колонок.
ALTER TABLE finance_transactions
  DROP COLUMN type,
  DROP COLUMN category,
  DROP COLUMN user_id,
  DROP COLUMN from_user_id,
  DROP COLUMN from_venue_id,
  DROP COLUMN to_user_id,
  DROP COLUMN to_venue_id;

-- 6) Новые CHECK-инварианты для полиморфной схемы.
ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_kind_check
    CHECK (kind IN ('transfer','adjustment'));

ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_from_kind_check
    CHECK (from_kind IS NULL OR from_kind IN ('user','team','venue','external'));

ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_to_kind_check
    CHECK (to_kind IS NULL OR to_kind IN ('user','team','venue','external'));

-- transfer = обе стороны заполнены; adjustment = одна сторона, и она 'user'
ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_shape_check CHECK (
    (kind = 'transfer'   AND from_kind IS NOT NULL AND to_kind IS NOT NULL)
    OR
    (kind = 'adjustment' AND from_kind IS NULL AND to_kind = 'user')
  );

-- from_id: NULL при NULL или external; ID при user/team/venue
ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_from_id_consistency_check CHECK (
    (from_kind IS NULL AND from_id IS NULL)
    OR (from_kind = 'external' AND from_id IS NULL)
    OR (from_kind IN ('user','team','venue') AND from_id IS NOT NULL)
  );

-- to_id: то же
ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_to_id_consistency_check CHECK (
    (to_kind IS NULL AND to_id IS NULL)
    OR (to_kind = 'external' AND to_id IS NULL)
    OR (to_kind IN ('user','team','venue') AND to_id IS NOT NULL)
  );

-- external_kind заполнен ⇔ одна из сторон external; для adjustment NULL.
ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_external_kind_consistency_check CHECK (
    (kind = 'adjustment' AND external_kind IS NULL)
    OR (kind = 'transfer' AND (from_kind = 'external' OR to_kind = 'external') AND external_kind IS NOT NULL)
    OR (kind = 'transfer' AND from_kind <> 'external' AND to_kind <> 'external' AND external_kind IS NULL)
  );

-- 7) Новые индексы для агрегаций.
CREATE INDEX IF NOT EXISTS finance_transactions_team_to_idx
  ON finance_transactions (team_id, to_kind, to_id);
CREATE INDEX IF NOT EXISTS finance_transactions_team_from_idx
  ON finance_transactions (team_id, from_kind, from_id);