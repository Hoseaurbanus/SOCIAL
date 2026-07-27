# Task 11: Fix compose modal issues

## Status: Completed

## Changes Made

Modified `src/components/organisms/compose-modal.tsx` with the following improvements:

### 1. Escape Key to Close
- Added a `useEffect` that listens for the Escape key when the modal is open
- Properly cleans up the event listener on unmount or when modal closes

### 2. Content Reset on Close
- Created a `handleClose` function that resets both content and error state
- Updated the X button and backdrop onClick to use `handleClose` instead of `onClose`

### 3. ARIA Accessibility Attributes
- Added `role="dialog"`, `aria-modal="true"`, and `aria-label="Create post"` to the modal container

### 4. Error Feedback for Failed Post Creation
- Added `error` state to track and display errors
- Added `onError` handler to `createPost.mutate` that captures and displays error messages
- Error banner displayed above the textarea with `role="alert"` for screen readers

## Verification
- TypeScript type check passed (`npx tsc --noEmit`)
- Committed: `45982d2`
