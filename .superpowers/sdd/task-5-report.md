# Task 5: Wire liked/saved state to PostCard

## Status: COMPLETE

## Changes Made

### `src/pages/core/home.tsx`
- Added `useLikeStatus` and `useBookmarkStatus` to imports from `@/hooks/use-posts`
- Extracted `postIds` array from the posts query result
- Called `useLikeStatus(postIds)` and `useBookmarkStatus(postIds)` to query actual state
- Passed `liked={!!likedMap?.[post.id]}` and `saved={!!bookmarkedMap?.[post.id]}` to each `PostCard`

### `src/pages/core/profile.tsx`
- Added `useLikeStatus` and `useBookmarkStatus` to imports from `@/hooks/use-posts`
- Extracted `postIds` array from the posts query result
- Called `useLikeStatus(postIds)` and `useBookmarkStatus(postIds)` to query actual state
- Passed `liked={!!likedMap?.[post.id]}` and `saved={!!bookmarkedMap?.[post.id]}` to each `PostCard`

## Verification
- `npx tsc --noEmit` passed with no errors
- Committed: `feat: wire liked/saved state to PostCard via useLikeStatus/useBookmarkStatus`
