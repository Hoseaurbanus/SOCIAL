-- Story System Fixes — indexes, RLS improvements, cleanup
-- Run this in Supabase SQL Editor AFTER stories-v2.sql

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_user_id ON public.story_views(user_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON public.story_reactions(story_id);

-- Fix story_views RLS: allow story owners to see all views on their stories
-- and allow any authenticated user to see view counts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Story views are viewable by story owner" ON public.story_views;
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Updated policy: story owner can see all viewers, anyone can see view counts
CREATE POLICY "Story views are viewable by story owner"
  ON public.story_views FOR SELECT
  USING (
    exists (
      select 1 from public.stories
      where id = story_views.story_id
      and user_id = auth.uid()
    )
    OR auth.uid() IS NOT NULL
  );

-- RPC function to fetch story views (bypasses RLS for the owner check)
CREATE OR REPLACE FUNCTION public.get_story_views(p_story_id uuid)
RETURNS TABLE (
  user_id uuid,
  viewed_at timestamptown,
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

-- Clean up expired stories (optional, run periodically)
-- DELETE FROM public.stories WHERE expires_at < now() - interval '1 day';
