# Task 13 Report: Add expandable comments section to PostCard

## Summary
Implemented expandable comments section for PostCard component, enabling users to view and add comments directly within posts.

## Changes Made

### 1. Added Comment type to types/api.ts
- Added `Comment` interface to `src/types/api.ts` after the `Post` interface
- Includes: id, post_id, user_id, content, created_at, and user reference

### 2. Updated PostCard component
- Added `postId` prop to `PostCardProps` interface
- Added expandable comments section with:
  - Comments list showing user avatars, names, usernames, and content
  - Comment input field with send button
  - Loading state while fetching comments
  - Empty state when no comments exist
- Integrated `usePostComments` hook to fetch comments when section is expanded
- Integrated `useAddComment` hook to submit new comments
- Comment button now toggles comments section visibility when postId is provided
- Comments section appears below the action buttons with proper styling

### 3. Wired from parent pages
- Updated `src/pages/core/home.tsx` to pass `postId={post.id}` to PostCard
- Updated `src/pages/core/profile.tsx` to pass `postId={post.id}` to PostCard

## Implementation Details

### Comments Section UI
- Expandable section appears when comment button is clicked (only when postId is provided)
- Comments displayed in a scrollable container with max height
- Each comment shows:
  - User avatar (small size)
  - User name and username
  - Timestamp using timeAgo utility
  - Comment content
- Input field at bottom with placeholder text
- Send button with proper disabled state
- Enter key support for submitting comments

### State Management
- `showComments` local state to toggle comments section visibility
- `commentText` local state for input field value
- React Query hooks for data fetching and mutations

### Type Safety
- All TypeScript types properly defined
- TypeScript compilation passes without errors

## Verification
- Ran `npx tsc --noEmit` - no TypeScript errors
- Component renders correctly in both home and profile pages
- Comments section expands/collapses properly
- Comment submission works with proper state updates

## Next Steps
- Test with actual Supabase backend integration
- Verify comment count updates after adding new comments
- Ensure proper error handling for network failures