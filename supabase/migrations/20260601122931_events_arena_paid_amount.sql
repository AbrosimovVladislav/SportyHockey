-- Колонка фактически оплаченной суммы аренды события (v0.5, итерация 51.1).
-- Хранит ∑(amount) всех finance_transactions с type='expense', category='arena',
-- event_id = events.id. Поддерживается синхронной из API-роутов финансов.
ALTER TABLE events
  ADD COLUMN arena_paid_amount numeric NOT NULL DEFAULT 0;

-- Бэкфил из существующих транзакций аренды, привязанных к событиям.
UPDATE events e
SET arena_paid_amount = COALESCE(sub.total, 0)
FROM (
  SELECT event_id, SUM(amount) AS total
  FROM finance_transactions
  WHERE type = 'expense'
    AND category = 'arena'
    AND event_id IS NOT NULL
  GROUP BY event_id
) AS sub
WHERE e.id = sub.event_id;