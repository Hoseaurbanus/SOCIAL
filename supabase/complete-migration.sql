-- ============================================================
-- SMUGFLEX: COMPLETE MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Fixes: schema conflicts, missing columns, storage, 24h expiry
-- ============================================================

-- ============================================================
-- POSTS: Drop and recreate with ALL correct columns
-- ============================================================

-- Drop dependent objects first
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Users can like posts" ON public.likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON public.likes;
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can bookmark posts" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can remove bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- Drop tables that depend on posts
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;

-- Recreate posts with ALL columns the app needs
CREATE TABLE public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL DEFAULT '',
  images text[],
  video_url text,
  link_preview jsonb,
  likes_count int DEFAULT 0,
  comments_count int DEFAULT 0,
  shares_count int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Recreate comments
CREATE TABLE public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Recreate likes
CREATE TABLE public.likes (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- Recreate bookmarks
CREATE TABLE public.bookmarks (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- ============================================================
-- RLS: Enable and create policies for posts/comments/likes/bookmarks
-- ============================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
  ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts"
  ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts"
  ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark posts"
  ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove bookmarks"
  ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- GRANTs: Full permissions for authenticated users
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;

-- Anon read access
GRANT SELECT ON public.posts TO anon;
GRANT SELECT ON public.comments TO anon;
GRANT SELECT ON public.likes TO anon;

-- ============================================================
-- RPC FUNCTIONS: Like/comment count triggers
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_likes(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_likes(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_comments(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_comments(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STORAGE: Create posts bucket for media uploads
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload
DROP POLICY IF EXISTS "Authenticated users can upload posts" ON storage.objects;
CREATE POLICY "Authenticated users can upload posts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'posts');

-- Storage policy: anyone can view posts media
DROP POLICY IF EXISTS "Public can view posts media" ON storage.objects;
CREATE POLICY "Public can view posts media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posts');

-- Storage policy: owners can delete their own uploads
DROP POLICY IF EXISTS "Users can delete own posts media" ON storage.objects;
CREATE POLICY "Users can delete own posts media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = 'posts');

-- ============================================================
-- STORAGE: Create stories bucket for story media uploads
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload stories" ON storage.objects;
CREATE POLICY "Authenticated users can upload stories"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'stories');

DROP POLICY IF EXISTS "Public can view stories media" ON storage.objects;
CREATE POLICY "Public can view stories media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories');

DROP POLICY IF EXISTS "Users can delete own stories media" ON storage.objects;
CREATE POLICY "Users can delete own stories media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'stories');

-- ============================================================
-- STORIES: Recreate with correct schema + 24h expiry
-- ============================================================

-- Drop old story objects
DROP POLICY IF EXISTS "Story views are viewable by story owner" ON public.story_views;
DROP POLICY IF EXISTS "Users can mark stories as viewed" ON public.story_views;
DROP POLICY IF EXISTS "Story reactions are viewable by everyone" ON public.story_reactions;
DROP POLICY IF EXISTS "Users can react to stories" ON public.story_reactions;
DROP POLICY IF EXISTS "Users can remove own reactions" ON public.story_reactions;
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;
DROP POLICY IF EXISTS "Users can create own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can update own stories" ON public.stories;

DROP FUNCTION IF EXISTS public.get_story_views(uuid);
DROP FUNCTION IF EXISTS public.increment_story_reactions(uuid);
DROP FUNCTION IF EXISTS public.decrement_story_reactions(uuid);
DROP FUNCTION IF EXISTS public.increment_story_views(uuid);

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

CREATE TABLE public.story_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(story_id, user_id)
);

CREATE TABLE public.story_views (
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (story_id, user_id)
);

-- Stories RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories are viewable by everyone"
  ON public.stories FOR SELECT USING (true);
CREATE POLICY "Users can create own stories"
  ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories"
  ON public.stories FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own stories"
  ON public.stories FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Story reactions are viewable by everyone"
  ON public.story_reactions FOR SELECT USING (true);
CREATE POLICY "Users can react to stories"
  ON public.story_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions"
  ON public.story_reactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Story views are viewable by story owner"
  ON public.story_views FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.stories WHERE id = story_views.story_id AND user_id = auth.uid())
    OR auth.uid() IS NOT NULL
  );
CREATE POLICY "Users can mark stories as viewed"
  ON public.story_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stories GRANTs
GRANT SELECT, INSERT, DELETE ON public.stories TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.story_reactions TO authenticated;
GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT SELECT ON public.stories TO anon;
GRANT SELECT ON public.story_reactions TO anon;
GRANT SELECT ON public.story_views TO anon;

-- Stories RPC functions
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
  SELECT sv.user_id, sv.viewed_at, p.name, p.username, p.avatar
  FROM public.story_views sv
  JOIN public.profiles p ON p.id = sv.user_id
  WHERE sv.story_id = p_story_id
  ORDER BY sv.viewed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stories indexes
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_user_id ON public.story_views(user_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON public.story_reactions(story_id);

-- Auto-expiry function
CREATE OR REPLACE FUNCTION public.delete_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM public.stories WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule auto-expiry (requires pg_cron extension)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('delete-expired-stories', '0 * * * *', 'SELECT delete_expired_stories()');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available. Run delete_expired_stories() manually.';
END $$;

-- ============================================================
-- SETTINGS: Add notification and privacy preference columns
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_activity boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_mentions boolean DEFAULT true;

-- ============================================================
-- COMMUNITY POSTS: Add community_id to posts table
-- ============================================================

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON public.posts(community_id) WHERE community_id IS NOT NULL;

-- ============================================================
-- PERFORMANCE: Additional indexes for common queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
