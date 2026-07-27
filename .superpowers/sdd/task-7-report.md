# Task 7: Fix notifications auto-mark-read behavior

## What was done

**Problem:** The notifications page had a `useEffect` that automatically marked ALL notifications as read on page load, before the user had a chance to read them. It also created N individual mutation calls for N unread notifications.

**Changes in `src/pages/core/notifications.tsx`:**

1. **Removed the auto-mark-read `useEffect`** — the one that iterated all notifications and called `markRead.mutate(n.id)` for each unread one on mount.

2. **Made notifications clickable** — wrapped each notification `<div>` in a `<Link>` from `react-router` with type-based navigation:
   - `like` / `comment` / `mention` → navigates to `/home`
   - `follow` → navigates to `/profile/{username}`
   - `message` → navigates to `/messages`

3. **Added click handler** — `handleClick` marks a single notification as read only when the user actually clicks it and it's unread.

4. **Kept the "Mark all read" button** — this is the correct explicit UX.

## Verification

- `npx tsc --noEmit` passes with no errors.
- Commit: `cc4dd03` — `fix: remove auto-mark-read on load, make notifications clickable`
