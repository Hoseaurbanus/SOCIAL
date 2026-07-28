-- ============================================================
-- SMUGFLEX: COMPLETE STORY SYSTEM MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Fixes: schema conflicts, missing columns, 24h auto-expiry
-- ============================================================

-- 1. DROP old stories-related objects (safe, cascades to views/reactions)
DROP POLICY IF EXISTS "Story views are viewable by story owner" ON public.story_views;
DROP POLICY IF EXISTS "Users can mark stories as viewed" ON public.story_views;
DROP POLICY IF EXISTS "Story reactions are viewable by everyone" ON public.story_reactions;
DROP POLICY IF EXISTS "Users can react to stories" ON public.story_reactions;
DROP POLICY IF EXISTS "Users can remove own reactions" ON public.story_reactions;
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;
DROP POLICY IF EXISTS "Users can create own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;

DROP FUNCTION IF EXISTS public.get_story_views(uuid);
DROP FUNCTION IF EXISTS public.increment_story_reactions(uuid);
DROP FUNCTION IF EXISTS public.decrement_story_reactions(uuid);
DROP FUNCTION IF EXISTS public.increment_story_views(uuid);

-- 2. RECREATE stories table with correct schema
DROP TABLE IF EXISTS public.story_reactions CASCADE;
DROP TABLE IF EXISTS public.story_views CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;

CREATE TABLE public.stories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_url text,
  media_type text CHECK (media_type IN ('image', 'video', 'text')) NOT NULL DEFAULT 'text',
  text_content text,
  background_style jsonb,
  text_color text DEFAULT '#FFFFFF',
  font_style text DEFAULT 'sans',
  music_url text,
  music_title text,
  stickers jsonb DEFAULT '[]'::jsonb,
  text_overlays jsonb DEFAULT '[]'::jsonb,
  view_count int DEFAULT 0,
  reaction_count int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours')
);

-- 3. Story reactions
CREATE TABLE public.story_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- 4. Story views
CREATE TABLE public.story_views (
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (story_id, user_id)
);

-- 5. Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: Stories
CREATE POLICY "Stories are viewable by everyone"
  ON public.stories FOR SELECT USING (true);
CREATE POLICY "Users can create own stories"
  ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories"
  ON public.stories FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own stories"
  ON public.stories FOR UPDATE USING (auth.uid() = user_id);

-- 7. RLS Policies: Story reactions
CREATE POLICY "Story reactions are viewable by everyone"
  ON public.story_reactions FOR SELECT USING (true);
CREATE POLICY "Users can react to stories"
  ON public.story_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions"
  ON public.story_reactions FOR DELETE USING (auth.uid() = user_id);

-- 8. RLS Policies: Story views (owner can see viewers, anyone authenticated can insert)
CREATE POLICY "Story views are viewable by story owner"
  ON public.story_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stories
      WHERE id = story_views.story_id AND user_id = auth.uid()
    )
    OR auth.uid() IS NOT NULL
  );
CREATE POLICY "Users can mark stories as viewed"
  ON public.story_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. GRANTs
GRANT SELECT, INSERT, DELETE ON public.stories TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.story_reactions TO authenticated;
GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT SELECT ON public.stories TO anon;
GRANT SELECT ON public.story_reactions TO anon;
GRANT SELECT ON public.story_views TO anon;

-- 10. RPC Functions
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

CREATE OR REPLACE FUNCTION public.increment_story_views(story_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.stories SET view_count = view_count + 1 WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_story_views(p_story_id uuid)
RETURNS TABLE (
  user_id uuid,
  viewed_at timestamptz,
  user_name text,
  user_username text,
  user_avatar text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sv.user_id,
    sv.viewed_at,
    p.name as user_name,
    p.username as user_username,
    p.avatar as user_avatar
  FROM public.story_views sv
  JOIN public.profiles p ON p.id = sv.user_id
  WHERE sv.story_id = p_story_id
  ORDER BY sv.viewed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Performance indexes
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_user_id ON public.story_views(user_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON public.story_reactions(story_id);

-- 12. Auto-expiry: function to delete expired stories
CREATE OR REPLACE FUNCTION public.delete_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM public.stories WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Schedule auto-expiry every hour using pg_cron
-- NOTE: pg_cron must be enabled in Supabase (Dashboard > Database > Extensions)
-- If pg_cron is not available, stories will still be filtered out by the app's
-- expires_at query, and you can manually run: SELECT delete_expired_stories();
DO $$
BEGIN
  -- Try to schedule with pg_cron (requires extension)
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'delete-expired-stories',
      '0 * * * *',  -- every hour at minute 0
      'SELECT delete_expired_stories()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron not available, skip silently
  RAISE NOTICE 'pg_cron not available. Run delete_expired_stories() manually or enable pg_cron extension.';
END $$;

-- 14. Cleanup: also delete story_views and story_reactions for expired stories
-- (handled by ON DELETE CASCADE, but explicit is better)
CREATE OR REPLACE FUNCTION public.cleanup_expired_story_data()
RETURNS void AS $$
BEGIN
  -- Delete views and reactions for stories that no longer exist
  DELETE FROM public.story_views WHERE story_id NOT IN (SELECT id FROM public.stories);
  DELETE FROM public.story_reactions WHERE story_id NOT IN (SELECT id FROM public.stories);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- POSTS: Add video + link preview support
-- ============================================================
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS link_preview jsonb;
