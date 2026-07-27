# Task 12 Report: Add error handling to auth store logout

## Summary

Added error handling and loading state to the logout flow to prevent silent failures and double-click issues.

## Changes Made

### 1. `src/stores/auth-store.ts`

- Wrapped the `logout` action's `supabase.auth.signOut()` call in a try/catch block.
- The catch block is intentionally empty to ensure local state is cleared even if Supabase fails.
- After the try/catch, the store state is reset to logged-out defaults regardless of Supabase outcome.

### 2. `src/pages/social/settings.tsx`

- Imported `useState` from React.
- Added `loggingOut` state variable to track logout in progress.
- Updated `handleLogout` to set `loggingOut` to `true` before calling `logout()`.
- Added `disabled` prop to the `SettingsItem` component interface.
- Updated the logout button to be disabled when `loggingOut` is true, with appropriate disabled styles.
- Added `disabled={loggingOut}` to the logout button.

## Verification

- TypeScript compilation passes with no errors.
- Git commit created: `fix: add error handling and loading state to logout flow`

## Files Modified

- `src/stores/auth-store.ts` - Added try/catch around signOut
- `src/pages/social/settings.tsx` - Added loading state and disabled button