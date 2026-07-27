# Task 6: Wire unread count to header and bottom nav

## Status: Complete

## Changes Made

### `src/components/organisms/header.tsx`
- Removed `notificationCount` prop from interface and function signature
- Added `import { useUnreadCount } from '@/hooks/use-notifications'`
- Added `const { data: notificationCount = 0 } = useUnreadCount()` inside component
- Badge now driven by real data instead of always-defaulted-to-zero prop

### `src/components/organisms/bottom-nav.tsx`
- Added `import { useUnreadCount } from '@/hooks/use-notifications'`
- Added `const { data: unreadCount = 0 } = useUnreadCount()` inside component
- Added `relative` class to NavLink for badge positioning
- Added badge rendering on Notifications icon when `unreadCount > 0`

## Verification
- TypeScript: `npx tsc --noEmit` passed with no errors
- Commit: `7df4b99`
