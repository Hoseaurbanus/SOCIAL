# Task 7: Fix auth page consistency - Completed

## Changes Made

### login.tsx
- Added show/hide password toggle (Eye/EyeOff icons)
- Added autoComplete attributes (email, current-password)
- Added redirect to /home if already authenticated
- Added useEffect hook for authentication check

### forgot-password.tsx
- Changed email input height from h-10 to h-12 for consistency

### welcome.tsx
- Added redirect to /home if already authenticated
- Added useAuthStore and useEffect hooks

## Verification
- TypeScript check passed with no errors
- All changes follow existing patterns in create-password.tsx
- Commit: `348297a` - "feat: improve auth page consistency (show/hide password, redirects, sizing)"