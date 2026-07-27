# Task 8: Add error states to all core pages — Complete

## What was done

Added error handling with retry to 4 core pages that previously showed nothing on query failure.

### Changes per file

**`src/pages/core/messages.tsx`**
- Added `error` destructured from `useConversations()`
- Added error state check before the main render: shows "Failed to load messages." with a "Try again" button that reloads the page

**`src/pages/core/notifications.tsx`**
- Added `error` destructured from `useNotifications()`
- Added error state check before the main render: shows "Failed to load notifications." with retry button

**`src/pages/core/conversation.tsx`**
- Added `messagesError` from `useMessages()` (renamed `isLoading` → `messagesLoading`)
- Added `participantError` state to catch Supabase participant load failures
- Added error UI for failed message load (shows in messages area with retry)
- Added error UI for failed participant load (shows "Unknown user" in header)
- Added inline error message below input when `sendMessage.isError` is true
- Added `Button` import

**`src/pages/core/profile.tsx`**
- Added `postsError` destructured from `useUserPosts()`
- Added error state check in the posts tab content area: shows "Failed to load posts." with retry button

## Verification

- `npx tsc --noEmit` passed with zero errors
- All error states follow the existing pattern from `home.tsx`
- Committed: `feat: add error states with retry to all core pages`
