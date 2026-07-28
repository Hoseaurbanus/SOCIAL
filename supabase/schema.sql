-- SMUGFLEX Database Schema
-- Run this in Supabase SQL Editor

-- Profiles (auto-created on signup via trigger)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  username text not null unique,
  avatar text,
  bio text,
  website text,
  location text,
  is_private boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Posts
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  content text not null,
  images text[],
  likes_count int default 0,
  comments_count int default 0,
  shares_count int default 0,
  created_at timestamp with time zone default now()
);

-- Comments
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Likes
create table if not exists public.likes (
  user_id uuid references public.profiles on delete cascade not null,
  post_id uuid references public.posts on delete cascade not null,
  created_at timestamp with time zone default now(),
  primary key (user_id, post_id)
);

-- Bookmarks
create table if not exists public.bookmarks (
  user_id uuid references public.profiles on delete cascade not null,
  post_id uuid references public.posts on delete cascade not null,
  created_at timestamp with time zone default now(),
  primary key (user_id, post_id)
);

-- Follows
create table if not exists public.follows (
  follower_id uuid references public.profiles on delete cascade not null,
  following_id uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default now(),
  primary key (follower_id, following_id)
);

-- Stories
create table if not exists public.stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  media_url text,
  media_type text check (media_type in ('image', 'video', 'text')) not null,
  text_content text,
  background_style jsonb,
  text_color text default '#FFFFFF',
  font_style text default 'sans',
  music_url text,
  music_title text,
  stickers jsonb default '[]'::jsonb,
  text_overlays jsonb default '[]'::jsonb,
  view_count int default 0,
  reaction_count int default 0,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone not null
);

-- Story reactions
create table if not exists public.story_reactions (
  id uuid default gen_random_uuid() primary key,
  story_id uuid references public.stories on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default now(),
  unique(story_id, user_id)
);

-- Story views
create table if not exists public.story_views (
  story_id uuid references public.stories on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  viewed_at timestamp with time zone default now(),
  primary key (story_id, user_id)
);

-- Conversations
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now()
);

-- Conversation participants
create table if not exists public.conversation_participants (
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  joined_at timestamp with time zone default now(),
  primary key (conversation_id, user_id)
);

-- Messages
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id uuid references public.profiles on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now(),
  read_at timestamp with time zone
);

-- Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  from_user_id uuid references public.profiles on delete cascade not null,
  type text check (type in ('like', 'comment', 'follow', 'mention', 'message')) not null,
  post_id uuid references public.posts on delete cascade,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Communities
create table if not exists public.communities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  icon text default '🌐',
  created_by uuid references public.profiles on delete cascade not null,
  member_count int default 1,
  created_at timestamp with time zone default now()
);

-- Community members
create table if not exists public.community_members (
  community_id uuid references public.communities on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  joined_at timestamp with time zone default now(),
  primary key (community_id, user_id)
);

-- Enable Row Level Security (safe to re-run)
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
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any, then recreate
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
  DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
  DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
  DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
  DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
  DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
  DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
  DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
  DROP POLICY IF EXISTS "Users can like posts" ON public.likes;
  DROP POLICY IF EXISTS "Users can unlike posts" ON public.likes;
  DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
  DROP POLICY IF EXISTS "Users can bookmark posts" ON public.bookmarks;
  DROP POLICY IF EXISTS "Users can remove bookmarks" ON public.bookmarks;
  DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
  DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
  DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
  DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;
  DROP POLICY IF EXISTS "Users can create own stories" ON public.stories;
  DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;
  DROP POLICY IF EXISTS "Story reactions are viewable by everyone" ON public.story_reactions;
  DROP POLICY IF EXISTS "Users can react to stories" ON public.story_reactions;
  DROP POLICY IF EXISTS "Users can remove own reactions" ON public.story_reactions;
  DROP POLICY IF EXISTS "Story views are viewable by story owner" ON public.story_views;
  DROP POLICY IF EXISTS "Users can mark stories as viewed" ON public.story_views;
  DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
  DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
  DROP POLICY IF EXISTS "Users can view participants of own conversations" ON public.conversation_participants;
  DROP POLICY IF EXISTS "Users can add themselves to conversations" ON public.conversation_participants;
  DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
  DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
  DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
  DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.notifications;
  DROP POLICY IF EXISTS "Communities are viewable by everyone" ON public.communities;
  DROP POLICY IF EXISTS "Users can create communities" ON public.communities;
  DROP POLICY IF EXISTS "Community members are viewable by everyone" ON public.community_members;
  DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
  DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
  EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- RLS Policies: Profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies: Posts
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Likes
CREATE POLICY "Likes are viewable by everyone"
  ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts"
  ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts"
  ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can bookmark posts"
  ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove bookmarks"
  ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Follows
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies: Stories
CREATE POLICY "Stories are viewable by everyone"
  ON public.stories FOR SELECT USING (true);
CREATE POLICY "Users can create own stories"
  ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories"
  ON public.stories FOR DELETE USING (auth.uid() = user_id);

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

-- RLS Policies: Conversations
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (exists (
    select 1 from public.conversation_participants
    where conversation_id = id and user_id = auth.uid()
  ));
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT WITH CHECK (true);

-- RLS Policies: Conversation participants
CREATE POLICY "Users can view participants of own conversations"
  ON public.conversation_participants FOR SELECT
  USING (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_participants.conversation_id
    and cp.user_id = auth.uid()
  ));
CREATE POLICY "Users can add themselves to conversations"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies: Messages
CREATE POLICY "Users can view messages in own conversations"
  ON public.messages FOR SELECT
  USING (exists (
    select 1 from public.conversation_participants
    where conversation_id = messages.conversation_id
    and user_id = auth.uid()
  ));
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE USING (auth.uid() = sender_id);

-- RLS Policies: Notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can mark own notifications as read"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies: Communities
CREATE POLICY "Communities are viewable by everyone"
  ON public.communities FOR SELECT USING (true);
CREATE POLICY "Users can create communities"
  ON public.communities FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies: Community members
CREATE POLICY "Community members are viewable by everyone"
  ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE USING (auth.uid() = user_id);

-- Community member count functions
create or replace function public.increment_community_members(community_id uuid)
returns void as $$
begin
  update public.communities set member_count = member_count + 1 where id = community_id;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_community_members(community_id uuid)
returns void as $$
begin
  update public.communities set member_count = GREATEST(member_count - 1, 0) where id = community_id;
end;
$$ language plpgsql security definer;

-- Like count functions
create or replace function public.increment_likes(post_id uuid)
returns void as $$
begin
  update public.posts set likes_count = likes_count + 1 where id = post_id;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_likes(post_id uuid)
returns void as $$
begin
  update public.posts set likes_count = GREATEST(likes_count - 1, 0) where id = post_id;
end;
$$ language plpgsql security definer;

-- Comment count functions
create or replace function public.increment_comments(post_id uuid)
returns void as $$
begin
  update public.posts set comments_count = comments_count + 1 where id = post_id;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_comments(post_id uuid)
returns void as $$
begin
  update public.posts set comments_count = GREATEST(comments_count - 1, 0) where id = post_id;
end;
$$ language plpgsql security definer;

-- Story reaction count functions
create or replace function public.increment_story_reactions(story_id uuid)
returns void as $$
begin
  update public.stories set reaction_count = reaction_count + 1 where id = story_id;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_story_reactions(story_id uuid)
returns void as $$
begin
  update public.stories set reaction_count = GREATEST(reaction_count - 1, 0) where id = story_id;
end;
$$ language plpgsql security definer;

-- Story view count function
create or replace function public.increment_story_views(story_id uuid)
returns void as $$
begin
  update public.stories set view_count = view_count + 1 where id = story_id;
end;
$$ language plpgsql security definer;

-- GRANTs for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.stories TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.story_reactions TO authenticated;
GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.communities TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.community_members TO authenticated;

-- GRANTs for anon (public read)
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.posts TO anon;
GRANT SELECT ON public.comments TO anon;
GRANT SELECT ON public.stories TO anon;
GRANT SELECT ON public.story_reactions TO anon;
GRANT SELECT ON public.story_views TO anon;
GRANT SELECT ON public.follows TO anon;
GRANT SELECT ON public.communities TO anon;
GRANT SELECT ON public.community_members TO anon;
