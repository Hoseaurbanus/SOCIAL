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
  media_url text not null,
  media_type text check (media_type in ('image', 'video')) not null,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone not null
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

-- Enable Row Level Security (safe to re-run)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

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
