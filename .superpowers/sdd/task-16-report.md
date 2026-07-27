# Task 16: Add tab filtering to Home page

**Status:** Complete  
**Commit:** `ada04ae` - `feat: add tab filtering to Home feed (For You, Following)`

## Changes Made

### 1. `src/api/posts.ts`
- Added `fetchFollowingPosts(page, pageSize)` function
- Queries `follows` table to get followed user IDs, then fetches posts from those users
- Returns empty result if user follows nobody

### 2. `src/hooks/use-posts.ts`
- Added `useFollowingPosts()` hook using `useInfiniteQuery`
- Query key: `['posts', 'following']` (invalidated with other post mutations)

### 3. `src/pages/core/home.tsx`
- Imported `useFollowingPosts` hook
- Added `activeQuery` logic: uses `followingQuery` for "Following" tab, `feedQuery` for others
- Added empty state for "Communities" tab: "Communities are coming soon."

## Tab Behavior

| Tab | Data Source |
|-----|------------|
| For You | `useFeedPosts` (all posts) |
| Following | `useFollowingPosts` (only followed users) |
| Chronological | `useFeedPosts` (same data, already chronological) |
| Trending | `useFeedPosts` (placeholder, same data) |
| Communities | Empty state placeholder |

## Verification
- TypeScript: `npx tsc --noEmit` passed (no errors)
