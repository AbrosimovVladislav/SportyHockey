-- Ник Telegram уникален среди игроков (регистронезависимо). NULL разрешён (игроки без ника).
CREATE UNIQUE INDEX users_username_lower_uniq
ON public.users (lower(username))
WHERE username IS NOT NULL AND username <> '';