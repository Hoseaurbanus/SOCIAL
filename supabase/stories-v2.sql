-- SMUGFLEX Stories 2.0 Migration
-- Run this in Supabase SQL Editor AFTER the base schema

-- Add new columns to stories table
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS text_content text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS background_style jsonb;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#FFFFFF';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS font_style text DEFAULT 'sans';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music_url text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS music_title text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS stickers jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS text_overlays jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS view_count int DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS reaction_count int DEFAULT 0;

-- Make media_url nullable for text stories
ALTER TABLE public.stories ALTER COLUMN media_url DROP NOT NULL;

-- Update media_type check to include 'text'
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_media_type_check;
ALTER TABLE public.stories ADD CONSTRAINT stories_media_type_check CHECK (media_type in ('image', 'video', 'text'));

-- Story reactions table
CREATE TABLE IF NOT EXISTS public.story_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid REFERENCES public.stories ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Story views table
CREATE TABLE IF NOT EXISTS public.story_views (
  story_id uuid REFERENCES public.stories ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  viewed_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (story_id, user_id)
);

-- Enable RLS
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Story reactions are viewable by everyone" ON public.story_reactions;
  DROP POLICY IF EXISTS "Users can react to stories" ON public.story_reactions;
  DROP POLICY IF EXISTS "Users can remove own reactions" ON public.story_reactions;
  DROP POLICY IF EXISTS "Story views are viewable by story owner" ON public.story_views;
  DROP POLICY IF EXISTS "Users can mark stories as viewed" ON public.story_views;
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- RLS Policies: Story reactions
CREATE POLICY "Story reactions are viewable by everyone"
  ON public.story_reactions FOR SELECT USING (true);
CREATE POLICY "Users can react to stories"
  ON public.story_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions"
  ON public.story_reactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Story views
CREATE POLICY "Story views are viewable by story owner"
  ON public.story_views FOR SELECT
  USING (exists (
    select 1 from public.stories where id = story_views.story_id and user_id = auth.uid()
  ));
CREATE POLICY "Users can mark stories as viewed"
  ON public.story_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- GRANTs
GRANT SELECT, INSERT, DELETE ON public.story_reactions TO authenticated;
GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT SELECT ON public.story_reactions TO anon;
GRANT SELECT ON public.story_views TO anon;

-- Reaction count functions
CREATE OR REPLACE FUNCTION public.increment_story_reactions(story_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.stories SET reaction_count = reaction_count + 1 WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_story_reactions(story_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.stories SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View count function
CREATE OR REPLACE FUNCTION public.increment_story_views(story_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.stories SET view_count = view_count + 1 WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
