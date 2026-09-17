-- v0.5, итерация 48: расширяем finance_transactions под полный раздел «Деньги».
-- 1) category — для расходов; CHECK arena/inventory/uniform/other.
-- 2) occurred_on — фактическая дата операции (бэкдейт, планирование будущих аренд).
-- 3) CHECK на type — union из четырёх значений; на текущем проде только player_payment, мигрировать нечего.

ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS occurred_on date;

-- Бэкфил: для существующих записей occurred_on = created_at::date.
UPDATE public.finance_transactions
   SET occurred_on = (created_at AT TIME ZONE 'UTC')::date
 WHERE occurred_on IS NULL;

ALTER TABLE public.finance_transactions
  ALTER COLUMN occurred_on SET NOT NULL,
  ALTER COLUMN occurred_on SET DEFAULT (now() AT TIME ZONE 'UTC')::date;

-- CHECK на type. На случай если он уже навешен — снимаем и переставляем.
ALTER TABLE public.finance_transactions
  DROP CONSTRAINT IF EXISTS finance_transactions_type_check;
ALTER TABLE public.finance_transactions
  ADD CONSTRAINT finance_transactions_type_check
  CHECK (type IN ('player_payment', 'expense', 'refund', 'adjustment'));

-- CHECK на category. NULL допускается (для не-expense операций), но если category задан —
-- он должен быть из enum. Дополнительно: у expense category обязателен; у остальных типов
-- category должен быть NULL.
ALTER TABLE public.finance_transactions
  DROP CONSTRAINT IF EXISTS finance_transactions_category_check;
ALTER TABLE public.finance_transactions
  ADD CONSTRAINT finance_transactions_category_check
  CHECK (
    (type = 'expense' AND category IN ('arena', 'inventory', 'uniform', 'other'))
    OR (type <> 'expense' AND category IS NULL)
  );

-- Индексы под основные запросы раздела: лента по команде с сортировкой,
-- агрегаты на дату (для On hand / Future arenas).
CREATE INDEX IF NOT EXISTS finance_transactions_team_occurred_idx
  ON public.finance_transactions (team_id, occurred_on DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS finance_transactions_team_type_idx
  ON public.finance_transactions (team_id, type);
