-- Data Migration: legacy tables → new platform tables
-- Run AFTER 20260729000000_platform_foundation.sql

-- ============================================================
-- 1. communities → spaces
-- ============================================================
INSERT INTO public.spaces (id, name, description, icon, slug, space_type, visibility, created_by, member_count, created_at, updated_at)
SELECT
  c.id,
  c.name,
  COALESCE(c.description, ''),
  COALESCE(c.icon, '🌐'),
  LOWER(REGEXP_REPLACE(c.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(c.id::text, 1, 8),
  'community',
  'public',
  c.created_by,
  COALESCE(c.member_count, 1),
  c.created_at,
  NOW()
FROM public.communities c
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. community_members → space_members (as 'member' role)
-- ============================================================
INSERT INTO public.space_members (space_id, user_id, role, role_id, joined_at)
SELECT
  cm.community_id,
  cm.user_id,
  CASE
    WHEN cm.user_id = c.created_by THEN 'owner'
    ELSE 'member'
  END,
  (SELECT id FROM public.roles WHERE name = CASE WHEN cm.user_id = c.created_by THEN 'owner' ELSE 'member' END LIMIT 1),
  NOW()
FROM public.community_members cm
JOIN public.communities c ON c.id = cm.community_id
ON CONFLICT (space_id, user_id) DO NOTHING;

-- ============================================================
-- 3. posts → content_items
-- ============================================================
INSERT INTO public.content_items (
  id, author_id, space_id, content_type, title, body, media, visibility,
  is_pinned, reaction_count, comment_count, share_count,
  created_at, updated_at
)
SELECT
  p.id,
  p.user_id,
  CASE WHEN p.community_id IS NOT NULL THEN p.community_id ELSE NULL END,
  'post',
  NULL,
  COALESCE(p.content, ''),
  CASE
    WHEN p.video_url IS NOT NULL THEN
      json_build_array(json_build_object('type', 'video', 'url', p.video_url))::jsonb
    WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 THEN
      (SELECT json_agg(json_build_object('type', 'image', 'url', img)) FROM unnest(p.images) AS img)::jsonb
    ELSE '[]'::jsonb
  END,
  'public',
  FALSE,
  COALESCE(p.likes_count, 0),
  COALESCE(p.comments_count, 0),
  0,
  p.created_at,
  p.created_at
FROM public.posts p
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. likes → reactions (emoji = '👍')
-- ============================================================
INSERT INTO public.reactions (content_item_id, user_id, emoji, created_at)
SELECT
  l.post_id,
  l.user_id,
  '👍',
  l.created_at
FROM public.likes l
WHERE EXISTS (SELECT 1 FROM public.content_items ci WHERE ci.id = l.post_id)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. comments → comments_v2
-- ============================================================
INSERT INTO public.comments_v2 (id, content_item_id, author_id, parent_comment_id, body, reaction_count, is_deleted, created_at, updated_at)
SELECT
  c.id,
  c.post_id,
  c.user_id,
  NULL,
  COALESCE(c.content, ''),
  0,
  FALSE,
  c.created_at,
  c.created_at
FROM public.comments c
WHERE EXISTS (SELECT 1 FROM public.content_items ci WHERE ci.id = c.post_id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. follows → relationships (type = 'follow')
-- ============================================================
INSERT INTO public.relationships (source_user_id, target_user_id, relationship_type, created_at)
SELECT
  f.follower_id,
  f.following_id,
  'follow',
  f.created_at
FROM public.follows f
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. Update content_items counters from reactions/comments tables
-- ============================================================
UPDATE public.content_items ci
SET reaction_count = (
  SELECT COUNT(*) FROM public.reactions r WHERE r.content_item_id = ci.id
),
comment_count = (
  SELECT COUNT(*) FROM public.comments_v2 cv WHERE cv.content_item_id = ci.id AND NOT cv.is_deleted
);

-- ============================================================
-- 8. Recalculate space member counts from space_members
-- ============================================================
UPDATE public.spaces s
SET member_count = (
  SELECT COUNT(*) FROM public.space_members sm WHERE sm.space_id = s.id
);
