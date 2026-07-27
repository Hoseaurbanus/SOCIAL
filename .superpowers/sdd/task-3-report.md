# Task 3: Fix setTimeout Memory Leaks — Complete

## What was done

Replaced bare `setTimeout` calls with `useEffect` hooks that include cleanup in two files:

### `src/pages/auth/signup.tsx`
- Added `useEffect` to imports
- Removed `setTimeout(() => navigate('/verify'), 2000)` from both `onStep2Email` and `onStep2Phone` handlers
- Added a `useEffect` that triggers when `step === 3`, sets a 2-second timer to navigate to `/verify`, and clears it on unmount

### `src/pages/auth/create-password.tsx`
- Removed `setTimeout(() => navigate('/home'), 2000)` from `onSubmit` handler
- Added a `useEffect` that triggers when `success` is true, sets a 2-second timer to navigate to `/home`, and clears it on unmount

## Verification
- `npx tsc --noEmit` — passed with no errors
- Commit: `6657c1b` — `fix: replace setTimeout with useEffect cleanup in signup and create-password`
