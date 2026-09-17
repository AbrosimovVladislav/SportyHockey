ALTER TABLE public.media_items
  ADD COLUMN IF NOT EXISTS mime_type TEXT;