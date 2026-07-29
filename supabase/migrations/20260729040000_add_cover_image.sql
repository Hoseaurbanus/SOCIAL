-- Add cover_image to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_image TEXT;
