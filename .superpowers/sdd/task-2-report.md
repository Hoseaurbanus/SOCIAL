# Task 2 Report: Fix forgot password flow

## Summary

Fixed the broken forgot-password flow where users were redirected to `/login` instead of a page to actually set a new password.

## Changes Made

### 1. Modified `src/pages/auth/forgot-password.tsx:23`
- Changed `redirectTo` from `${window.location.origin}/login` to `${window.location.origin}/reset-password`

### 2. Created `src/pages/auth/reset-password.tsx`
New page following the `create-password.tsx` pattern:
- Session check via `supabase.auth.getSession()`
- Loading spinner while checking session
- Invalid session state with "Request New Link" button → `/forgot-password`
- Password form with show/hide toggles, Zod validation (min 8 chars, match)
- On submit: `supabase.auth.updateUser({ password })`
- Success state with 2s redirect to `/home` using `useEffect` cleanup
- Error banner with `role="alert"` and proper styling

### 3. Modified `src/router.tsx`
- Added lazy import: `const ResetPasswordPage = lazy(() => import('./pages/auth/reset-password'))`
- Added route to AuthLayout children: `{ path: 'reset-password', element: ... }`

## Verification

- `npx tsc --noEmit` — passed with no errors
- Commit: `dc1ad83` — "fix: add reset-password page and fix forgot-password redirect flow"
