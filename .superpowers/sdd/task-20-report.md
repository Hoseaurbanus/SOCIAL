# Task 20: Add Post Delete and More Options

## Summary
Added a dropdown menu to the PostCard "More options" button with Delete (for own posts) and Report (for other users' posts).

## Changes Made

### 1. `src/hooks/use-posts.ts`
- Added `useDeletePost` hook that calls `deletePost` API and invalidates post queries on success

### 2. `src/components/molecules/post-card.tsx`
- Added `isOwnPost` and `onDelete` props to `PostCardProps`
- Added `showMenu` state for dropdown toggle
- Replaced the static MoreHorizontal button with a dropdown menu containing:
  - **Delete post** (shown only when `isOwnPost` is true, styled with `text-error`)
  - **Report post** (shown for other users' posts)
- Added backdrop overlay to close menu on outside click

### 3. `src/pages/core/home.tsx`
- Imported `useDeletePost`
- Wired delete mutation to PostCard with `isOwnPost={post.user_id === user?.id}`

### 4. `src/pages/core/profile.tsx`
- Imported `useDeletePost`
- Wired delete mutation to PostCard with `isOwnPost={isOwnProfile}`

## Verification
- TypeScript compiles with no errors (`npx tsc --noEmit` passed)
- Committed as: `feat: add post delete via more options menu`
