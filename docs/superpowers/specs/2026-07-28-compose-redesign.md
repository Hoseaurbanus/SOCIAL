# Compose System Redesign — Video, Link Previews, Modern UI

**Date:** 2026-07-28
**Status:** Approved

## Media Rules
- Post = text + (images OR video OR nothing)
- Images: up to 4, `image/*`
- Video: 1 only, `video/*`
- No mixing images + video in same post
- Text is always optional (can post media-only)

## Database Changes
```sql
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS link_preview jsonb;
-- link_preview schema: { url, title, description, image, domain }
```

## Link Preview System
- Auto-detect URLs in text (regex: `https?://[^\s]+`)
- Fetch metadata via CORS proxy: `https://corsproxy.io/?url=<encoded-url>`
- Parse HTML response for og:title, og:description, og:image, title
- Show rich preview card below textarea (image + title + domain)
- User can dismiss preview (X button)
- Preview stored as `link_preview` JSONB in post

## Compose Modal Changes
- Toolbar: Image, Video, Emoji, Location icons
- Image picker: file input `image/*`, up to 4 files
- Video picker: file input `video/*`, 1 file only
- Selecting video when images exist → confirm → replace
- Selecting images when video exists → confirm → replace
- Media preview strip above textarea
- Link preview card below textarea (auto-detected)
- Character count as circular progress indicator
- Spring entrance animation (framer-motion)

## Post Card Changes
- Video: inline `<video>` with native controls, muted by default, playsinline
- Link preview: card with image (left) + title/domain/description (right), clickable
- Grid layout: 1 image = full width, 2+ = 2-column grid

## Files to Change
1. `supabase/complete-migration.sql` — add video_url + link_preview columns
2. `src/types/api.ts` — add LinkPreview interface, update Post type
3. `src/lib/link-preview.ts` — new: URL detection + metadata fetcher
4. `src/api/posts.ts` — update createPost to accept video_url + link_preview
5. `src/components/organisms/compose-modal.tsx` — rewrite with video + link + modern UI
6. `src/components/molecules/post-card.tsx` — add video player + link preview card
