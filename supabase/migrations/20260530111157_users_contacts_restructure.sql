-- Контакты пользователя живут только в users (один человек — один набор
-- контактов на все команды). До этой миграции дублировались в
-- team_memberships.contact_phone/contact_email. Также убираем e-mail
-- (в продукте три типа контактов: Telegram username, телефон, WhatsApp)
-- и добавляем contact_whatsapp.

-- 1) Переносим телефон из team_memberships в users, если в users пусто.
--    Берём самый свежий по joined_at.
UPDATE public.users u
SET contact_phone = sub.contact_phone
FROM (
  SELECT DISTINCT ON (user_id) user_id, contact_phone
  FROM public.team_memberships
  WHERE contact_phone IS NOT NULL
  ORDER BY user_id, joined_at DESC NULLS LAST
) sub
WHERE sub.user_id = u.id AND u.contact_phone IS NULL;

-- 2) Снимаем дублирующиеся колонки с team_memberships.
ALTER TABLE public.team_memberships DROP COLUMN IF EXISTS contact_phone;
ALTER TABLE public.team_memberships DROP COLUMN IF EXISTS contact_email;

-- 3) Убираем contact_email из users (поле не используется в продукте).
ALTER TABLE public.users DROP COLUMN IF EXISTS contact_email;

-- 4) Добавляем contact_whatsapp в users.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS contact_whatsapp text;