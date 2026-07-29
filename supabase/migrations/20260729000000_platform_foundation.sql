-- SMUGFLEX Platform Foundation Migration
-- Consolidates: schema.sql, fix-rls.sql, stories-v2.sql, story-fixes.sql, complete-migration.sql
-- Run this ONCE on a fresh database or after dropping all existing tables

BEGIN;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  avatar TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  is_private BOOLEAN DEFAULT false,
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  show_activity BOOLEAN DEFAULT true,
  allow_mentions BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- POSTS (legacy, will be replaced by content_items in Phase 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  images TEXT[],
  video_url TEXT,
  link_preview JSONB,
  community_id UUID,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.likes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- ============================================================
-- BOOKMARKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- ============================================================
-- FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- ============================================================
-- STORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'text' CHECK (media_type IN ('image', 'video', 'text')),
  text_content TEXT,
  background_style JSONB,
  text_color TEXT DEFAULT '#FFFFFF',
  font_style TEXT DEFAULT 'sans',
  music_url TEXT,
  music_title TEXT,
  stickers JSONB DEFAULT '[]'::jsonb,
  text_overlays JSONB DEFAULT '[]'::jsonb,
  view_count INT DEFAULT 0,
  reaction_count INT DEFAULT 0,
  audience TEXT DEFAULT 'public' CHECK (audience IN ('public', 'followers')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

-- ============================================================
-- STORY REACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- ============================================================
-- STORY VIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.story_views (
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (story_id, user_id)
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CONVERSATION PARTICIPANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention', 'message')),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SPACES (replaces communities)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🌐',
  cover_image TEXT,
  slug TEXT NOT NULL UNIQUE,
  space_type TEXT NOT NULL DEFAULT 'community' CHECK (space_type IN (
    'community', 'classroom', 'organization', 'project', 'event', 'creator_hub', 'research_group'
  )),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'hidden')),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{"modules":{"feed":true,"chat":true,"events":false,"assignments":false,"resources":false,"grades":false,"live_sessions":false,"polls":true,"announcements":true}}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  member_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SPACE MEMBERS (replaces community_members)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.space_members (
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'banned', 'muted')),
  role_id UUID REFERENCES public.roles(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (space_id, user_id)
);

-- ============================================================
-- ROLES (RBAC)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT false
);

-- Insert system roles
INSERT INTO public.roles (name, permissions, is_system) VALUES
  ('owner', ARRAY['space.edit', 'space.delete', 'member.remove', 'member.ban', 'content.pin', 'content.delete', 'content.lock', 'module.manage'], true),
  ('admin', ARRAY['space.edit', 'member.remove', 'member.ban', 'content.pin', 'content.delete'], true),
  ('moderator', ARRAY['content.pin', 'content.delete', 'member.mute'], true),
  ('member', ARRAY['content.create', 'content.read', 'content.react', 'content.comment'], true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- CONTENT ITEMS (unified content model)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL DEFAULT 'post' CHECK (content_type IN (
    'post', 'article', 'announcement', 'assignment', 'poll', 'resource', 'event'
  )),
  title TEXT,
  body TEXT NOT NULL DEFAULT '',
  media JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'members', 'private')),
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  reaction_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- REACTIONS (replaces likes, supports multiple emoji types)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL DEFAULT '👍',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_item_id, emoji)
);

-- ============================================================
-- COMMENTS V2 (references content_items instead of posts)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.comments_v2(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  reaction_count INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RELATIONSHIPS (replaces follows, adds block/mute)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('follow', 'block', 'mute')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_user_id, target_user_id, relationship_type)
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON public.posts(community_id) WHERE community_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_user_id ON public.story_views(user_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON public.story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_spaces_slug ON public.spaces(slug);
CREATE INDEX IF NOT EXISTS idx_spaces_type ON public.spaces(space_type);
CREATE INDEX IF NOT EXISTS idx_spaces_created_by ON public.spaces(created_by);
CREATE INDEX IF NOT EXISTS idx_space_members_user_id ON public.space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_space_members_space_id ON public.space_members(space_id);
CREATE INDEX IF NOT EXISTS idx_content_items_author_id ON public.content_items(author_id);
CREATE INDEX IF NOT EXISTS idx_content_items_space_id ON public.content_items(space_id) WHERE space_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_items_type ON public.content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON public.content_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_content_item_id ON public.reactions(content_item_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_v2_content_item_id ON public.comments_v2(content_item_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON public.relationships(source_user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON public.relationships(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_content_items_visibility ON public.content_items(visibility);
CREATE INDEX IF NOT EXISTS idx_content_items_is_pinned ON public.content_items(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_comments_v2_author_id ON public.comments_v2(author_id);
CREATE INDEX IF NOT EXISTS idx_notifications_from_user_id ON public.notifications(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON public.relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_stories_audience ON public.stories(audience);
CREATE INDEX IF NOT EXISTS idx_space_members_role ON public.space_members(role);
CREATE INDEX IF NOT EXISTS idx_space_members_status ON public.space_members(status);

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- Counter functions for posts (legacy)
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

-- Story functions
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
RETURNS TABLE(user_id uuid, viewed_at timestamptz, user_name text, user_username text, user_avatar text)
AS $$
BEGIN
  RETURN QUERY
  SELECT sv.user_id, sv.viewed_at, p.name, p.username, p.avatar
  FROM public.story_views sv
  JOIN public.profiles p ON sv.user_id = p.id
  WHERE sv.story_id = p_story_id
  ORDER BY sv.viewed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Space member functions
CREATE OR REPLACE FUNCTION public.increment_space_members(space_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.spaces SET member_count = member_count + 1 WHERE id = space_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_space_members(space_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.spaces SET member_count = GREATEST(member_count - 1, 0) WHERE id = space_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Content items counter functions
CREATE OR REPLACE FUNCTION public.increment_content_reactions(content_item_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.content_items SET reaction_count = reaction_count + 1 WHERE id = content_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_content_reactions(content_item_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.content_items SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = content_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_content_comments(content_item_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.content_items SET comment_count = comment_count + 1 WHERE id = content_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_content_comments(content_item_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.content_items SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = content_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Counter functions for communities (legacy)
CREATE OR REPLACE FUNCTION public.increment_community_members(community_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.communities SET member_count = member_count + 1 WHERE id = community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_community_members(community_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conversation helper
CREATE OR REPLACE FUNCTION public.create_conversation_with_participant(other_user_id uuid)
RETURNS uuid AS $$
DECLARE
  new_conversation_id uuid;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO new_conversation_id;
  
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (new_conversation_id, current_user_id), (new_conversation_id, other_user_id);
  
  RETURN new_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification helper
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_from_user_id uuid,
  p_type text,
  p_post_id uuid DEFAULT NULL,
  p_message text DEFAULT ''
)
RETURNS void AS $$
BEGIN
  IF p_user_id = p_from_user_id THEN
    RETURN;
  END IF;
  
  INSERT INTO public.notifications (user_id, from_user_id, type, post_id, message)
  VALUES (p_user_id, p_from_user_id, p_type, p_post_id, p_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Story expiration
CREATE OR REPLACE FUNCTION public.delete_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM public.stories WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Slug generation helper
CREATE OR REPLACE FUNCTION public.generate_space_slug(space_name text)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  base_slug := lower(regexp_replace(space_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.spaces WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Posts (legacy)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create own posts" ON public.posts;
CREATE POLICY "Users can create own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Comments (legacy)
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Likes
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can like" ON public.likes;
CREATE POLICY "Users can like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unlike" ON public.likes;
CREATE POLICY "Users can unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can bookmark" ON public.bookmarks;
CREATE POLICY "Users can bookmark" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unbookmark" ON public.bookmarks;
CREATE POLICY "Users can unbookmark" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Follows
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can follow" ON public.follows;
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Stories
DROP POLICY IF EXISTS "Stories are viewable based on audience" ON public.stories;
CREATE POLICY "Stories are viewable based on audience" ON public.stories FOR SELECT USING (
  auth.uid() = user_id
  OR (audience = 'public' AND expires_at > now())
  OR (audience = 'followers' AND expires_at > now() AND EXISTS (
    SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = user_id
  ))
);
DROP POLICY IF EXISTS "Users can create own stories" ON public.stories;
CREATE POLICY "Users can create own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own stories" ON public.stories;
CREATE POLICY "Users can update own stories" ON public.stories FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;
CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- Story reactions
DROP POLICY IF EXISTS "Story reactions are viewable by everyone" ON public.story_reactions;
CREATE POLICY "Story reactions are viewable by everyone" ON public.story_reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can react to stories" ON public.story_reactions;
CREATE POLICY "Users can react to stories" ON public.story_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove own reactions" ON public.story_reactions;
CREATE POLICY "Users can remove own reactions" ON public.story_reactions FOR DELETE USING (auth.uid() = user_id);

-- Story views
DROP POLICY IF EXISTS "Story owner can see views" ON public.story_views;
CREATE POLICY "Story owner can see views" ON public.story_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can view stories" ON public.story_views;
CREATE POLICY "Users can view stories" ON public.story_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations
DROP POLICY IF EXISTS "Users can see own conversations" ON public.conversations;
CREATE POLICY "Users can see own conversations" ON public.conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = id AND user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (true);

-- Conversation participants
DROP POLICY IF EXISTS "Participants can see conversation members" ON public.conversation_participants;
CREATE POLICY "Participants can see conversation members" ON public.conversation_participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can add themselves to conversations" ON public.conversation_participants;
CREATE POLICY "Users can add themselves to conversations" ON public.conversation_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages
DROP POLICY IF EXISTS "Conversation participants can see messages" ON public.messages;
CREATE POLICY "Conversation participants can see messages" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Sender can update own messages" ON public.messages;
CREATE POLICY "Sender can update own messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id);

-- Notifications
DROP POLICY IF EXISTS "Users can see own notifications" ON public.notifications;
CREATE POLICY "Users can see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = from_user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Spaces
DROP POLICY IF EXISTS "Public spaces are viewable by everyone" ON public.spaces;
CREATE POLICY "Public spaces are viewable by everyone" ON public.spaces FOR SELECT USING (
  visibility = 'public'
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.space_members
    WHERE space_id = spaces.id AND user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can create spaces" ON public.spaces;
CREATE POLICY "Users can create spaces" ON public.spaces FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Space owners and admins can update" ON public.spaces;
CREATE POLICY "Space owners and admins can update" ON public.spaces FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.space_members sm
    JOIN public.roles r ON sm.role_id = r.id
    WHERE sm.space_id = spaces.id
    AND sm.user_id = auth.uid()
    AND ('space.edit' = ANY(r.permissions))
  )
);
DROP POLICY IF EXISTS "Space owners can delete" ON public.spaces;
CREATE POLICY "Space owners can delete" ON public.spaces FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.space_members sm
    JOIN public.roles r ON sm.role_id = r.id
    WHERE sm.space_id = spaces.id
    AND sm.user_id = auth.uid()
    AND ('space.delete' = ANY(r.permissions))
  )
);

-- Space members
DROP POLICY IF EXISTS "Space members are viewable by space members" ON public.space_members;
CREATE POLICY "Space members are viewable by space members" ON public.space_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.space_members sm
    WHERE sm.space_id = space_members.space_id AND sm.user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can join spaces" ON public.space_members;
CREATE POLICY "Users can join spaces" ON public.space_members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can leave spaces" ON public.space_members;
CREATE POLICY "Users can leave spaces" ON public.space_members FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can update member roles" ON public.space_members;
CREATE POLICY "Admins can update member roles" ON public.space_members FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.space_members sm
    JOIN public.roles r ON sm.role_id = r.id
    WHERE sm.space_id = space_members.space_id
    AND sm.user_id = auth.uid()
    AND ('member.remove' = ANY(r.permissions))
  )
);

-- Roles (read-only for everyone)
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.roles;
CREATE POLICY "Roles are viewable by everyone" ON public.roles FOR SELECT USING (true);

-- Content Items
DROP POLICY IF EXISTS "Public content is viewable by everyone" ON public.content_items;
CREATE POLICY "Public content is viewable by everyone" ON public.content_items FOR SELECT USING (
  visibility = 'public'
  OR author_id = auth.uid()
  OR (visibility = 'members' AND space_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.space_members WHERE space_id = content_items.space_id AND user_id = auth.uid()
  ))
);
DROP POLICY IF EXISTS "Users can create content" ON public.content_items;
CREATE POLICY "Users can create content" ON public.content_items FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Authors can update own content" ON public.content_items;
CREATE POLICY "Authors can update own content" ON public.content_items FOR UPDATE USING (
  auth.uid() = author_id
  OR (space_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.space_members sm
    JOIN public.roles r ON sm.role_id = r.id
    WHERE sm.space_id = content_items.space_id
    AND sm.user_id = auth.uid()
    AND ('content.edit' = ANY(r.permissions))
  ))
);
DROP POLICY IF EXISTS "Authors can delete own content" ON public.content_items;
CREATE POLICY "Authors can delete own content" ON public.content_items FOR DELETE USING (
  auth.uid() = author_id
  OR (space_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.space_members sm
    JOIN public.roles r ON sm.role_id = r.id
    WHERE sm.space_id = content_items.space_id
    AND sm.user_id = auth.uid()
    AND ('content.delete' = ANY(r.permissions))
  ))
);

-- Reactions
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.reactions;
CREATE POLICY "Reactions are viewable by everyone" ON public.reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can react" ON public.reactions;
CREATE POLICY "Users can react" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove own reactions" ON public.reactions;
CREATE POLICY "Users can remove own reactions" ON public.reactions FOR DELETE USING (auth.uid() = user_id);

-- Comments v2
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments_v2;
CREATE POLICY "Comments are viewable by everyone" ON public.comments_v2 FOR SELECT USING (NOT is_deleted OR author_id = auth.uid());
DROP POLICY IF EXISTS "Users can create comments" ON public.comments_v2;
CREATE POLICY "Users can create comments" ON public.comments_v2 FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Authors can update own comments" ON public.comments_v2;
CREATE POLICY "Authors can update own comments" ON public.comments_v2 FOR UPDATE USING (auth.uid() = author_id);

-- Relationships
DROP POLICY IF EXISTS "Relationships are viewable by everyone" ON public.relationships;
CREATE POLICY "Relationships are viewable by everyone" ON public.relationships FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create relationships" ON public.relationships;
CREATE POLICY "Users can create relationships" ON public.relationships FOR INSERT WITH CHECK (auth.uid() = source_user_id);
DROP POLICY IF EXISTS "Users can remove own relationships" ON public.relationships;
CREATE POLICY "Users can remove own relationships" ON public.relationships FOR DELETE USING (auth.uid() = source_user_id);

-- Audit log (users can see own entries)
DROP POLICY IF EXISTS "Users can see own audit entries" ON public.audit_log;
CREATE POLICY "Users can see own audit entries" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can create audit entries" ON public.audit_log;
CREATE POLICY "System can create audit entries" ON public.audit_log FOR INSERT WITH CHECK (true);

-- ============================================================
-- GRANTS
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Avatar uploads are viewable by everyone" ON storage.objects;
CREATE POLICY "Avatar uploads are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
CREATE POLICY "Anyone can upload an avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Post media is viewable by everyone" ON storage.objects;
CREATE POLICY "Post media is viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');

DROP POLICY IF EXISTS "Authenticated users can upload post media" ON storage.objects;
CREATE POLICY "Authenticated users can upload post media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own post media" ON storage.objects;
CREATE POLICY "Users can delete own post media" ON storage.objects
  FOR DELETE USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Story media is viewable by everyone" ON storage.objects;
CREATE POLICY "Story media is viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'stories');

DROP POLICY IF EXISTS "Authenticated users can upload story media" ON storage.objects;
CREATE POLICY "Authenticated users can upload story media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own story media" ON storage.objects;
CREATE POLICY "Users can delete own story media" ON storage.objects
  FOR DELETE USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, username)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only trigger if the function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON public.spaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_comments_v2_updated_at BEFORE UPDATE ON public.comments_v2
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMIT;
