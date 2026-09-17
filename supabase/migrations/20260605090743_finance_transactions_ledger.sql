-- v0.5, итерация 58. Переводим finance_transactions в ledger-формат «кто → кому».
-- Старые колонки type/category/user_id/event_id оставлены как denormalized зеркало:
-- читалки переписываем на новые поля постепенно, в одну-две итерации.

-- 1) Новые колонки.
ALTER TABLE finance_transactions
  ADD COLUMN kind text NOT NULL DEFAULT 'transfer',
  ADD COLUMN from_kind text,
  ADD COLUMN to_kind text,
  ADD COLUMN from_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN to_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN from_venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  ADD COLUMN to_venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  ADD COLUMN external_label text;

-- 2) Бэкфилл по таблице маппинга. Старые записи — тестовые, на edge-cases не зацикливаемся.

-- player_payment: user → team
UPDATE finance_transactions
SET kind = 'transfer', from_kind = 'user', from_user_id = user_id, to_kind = 'team'
WHERE type = 'player_payment';

-- expense + category='arena' + event с venue_id: team → venue(events.venue_id)
UPDATE finance_transactions ft
SET kind = 'transfer', from_kind = 'team', to_kind = 'venue',
    to_venue_id = e.venue_id
FROM events e
WHERE ft.event_id = e.id AND e.venue_id IS NOT NULL
  AND ft.type = 'expense' AND ft.category = 'arena';

-- expense + category='arena', но venue не нашёлся: team → external(label='arena'),
-- чтобы CHECK не упал. В практике этого почти не бывает — оставляем как safety net.
UPDATE finance_transactions
SET kind = 'transfer', from_kind = 'team', to_kind = 'external', external_label = 'arena'
WHERE type = 'expense' AND category = 'arena' AND to_venue_id IS NULL AND from_kind IS NULL;

-- expense + category∈{inventory,uniform,other}: team → external(label=category)
UPDATE finance_transactions
SET kind = 'transfer', from_kind = 'team', to_kind = 'external', external_label = category
WHERE type = 'expense' AND category IN ('inventory', 'uniform', 'other');

-- refund: team → user
UPDATE finance_transactions
SET kind = 'transfer', from_kind = 'team', to_kind = 'user', to_user_id = user_id
WHERE type = 'refund';

-- adjustment: одна сторона to_user. from_kind/to_kind остаются NULL.
UPDATE finance_transactions
SET kind = 'adjustment', to_user_id = user_id
WHERE type = 'adjustment';

-- 3) Инварианты CHECK. NOT VALID + VALIDATE, чтобы при падении сразу увидеть «битую» запись.

ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_kind_check
    CHECK (kind IN ('transfer', 'adjustment')) NOT VALID;

ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_from_kind_check
    CHECK (from_kind IS NULL OR from_kind IN ('user', 'team', 'venue', 'external')) NOT VALID;

ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_to_kind_check
    CHECK (to_kind IS NULL OR to_kind IN ('user', 'team', 'venue', 'external')) NOT VALID;

-- transfer: обе стороны заполнены. adjustment: обе NULL.
ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_shape_check CHECK (
    (kind = 'transfer' AND from_kind IS NOT NULL AND to_kind IS NOT NULL)
    OR (kind = 'adjustment' AND from_kind IS NULL AND to_kind IS NULL)
  ) NOT VALID;

-- adjustment: только to_user_id, остальные FK NULL.
ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_adjustment_one_side_check CHECK (
    kind <> 'adjustment' OR (
      to_user_id IS NOT NULL
      AND from_user_id IS NULL
      AND from_venue_id IS NULL
      AND to_venue_id IS NULL
      AND external_label IS NULL
    )
  ) NOT VALID;

-- transfer: from_kind='user' ⇔ from_user_id IS NOT NULL.
ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_from_user_consistency_check CHECK (
    kind <> 'transfer' OR (
      (from_kind = 'user') = (from_user_id IS NOT NULL)
    )
  ) NOT VALID;

-- transfer: to_kind='user' ⇔ to_user_id IS NOT NULL.
ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_to_user_consistency_check CHECK (
    kind <> 'transfer' OR (
      (to_kind = 'user') = (to_user_id IS NOT NULL)
    )
  ) NOT VALID;

-- transfer: from_kind='venue' ⇔ from_venue_id IS NOT NULL.
ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_from_venue_consistency_check CHECK (
    kind <> 'transfer' OR (
      (from_kind = 'venue') = (from_venue_id IS NOT NULL)
    )
  ) NOT VALID;

-- transfer: to_kind='venue' ⇔ to_venue_id IS NOT NULL.
ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_to_venue_consistency_check CHECK (
    kind <> 'transfer' OR (
      (to_kind = 'venue') = (to_venue_id IS NOT NULL)
    )
  ) NOT VALID;

-- transfer: external_label IS NOT NULL ⇔ хотя бы одна сторона external.
ALTER TABLE finance_transactions
  ADD CONSTRAINT ft_external_label_consistency_check CHECK (
    kind <> 'transfer' OR (
      (from_kind = 'external' OR to_kind = 'external') = (external_label IS NOT NULL)
    )
  ) NOT VALID;

-- 4) Валидируем существующие данные. Если бэкфилл упустил какую-то ветку — упадёт здесь.
ALTER TABLE finance_transactions VALIDATE CONSTRAINT ft_kind_check;
ALTER TABLE finance_transactions VALIDATE CONSTRAINT ft_from_kind_check;
ALTER TABLE finance_transactions VALIDATE CONSTRAINT ft_to_kind_check;
ALTER TABLE finance_transactions VALIDATE CONSTRAINT ft_shape_check;
ALTER TABLE finance_transactions VALIDATE CONSTRAINT ft_adjustment_one_side_check;
ALTER TABLE finance_transactions VALIDATE CONSTRAINT ft_from_user_consistency_check;
ALTER TABLE finance_transactions VALIDATE CONSTRAINT ft_to_user_consistency_check;
ALTER TABLE finance_transactions VALIDATE CONSTRAINT ft_from_venue_consistency_check;
ALTER TABLE finance_transactions VALIDATE CONSTRAINT ft_to_venue_consistency_check;
ALTER TABLE finance_transactions VALIDATE CONSTRAINT ft_external_label_consistency_check;

-- 5) Индексы для агрегаций.
CREATE INDEX IF NOT EXISTS finance_transactions_team_venue_idx
  ON finance_transactions (team_id, to_venue_id) WHERE to_venue_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS finance_transactions_team_from_user_idx
  ON finance_transactions (team_id, from_user_id) WHERE from_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS finance_transactions_team_to_user_idx
  ON finance_transactions (team_id, to_user_id) WHERE to_user_id IS NOT NULL;