## Task 3: Add new conversation creation

**Status:** Complete

### What was done

1. Created `src/components/organisms/user-search-modal.tsx` - A modal component that:
   - Has a search input to search users by name/username
   - Queries the `profiles` table in Supabase with ILIKE matching
   - Displays matching users with avatar, name, and username
   - Clicking a user creates a conversation via `useCreateConversation` and navigates to it
   - Shows loading state while searching
   - Shows "No users found" when search returns empty results
   - Has a close button and backdrop click to dismiss

2. Wired the modal into `src/pages/core/messages.tsx`:
   - Added `UserSearchModal` import
   - Added `showNewMessage` state
   - Connected the "New Message" (Edit icon) button to open the modal
   - Rendered the modal at the bottom of the component

### Files changed
- `src/components/organisms/user-search-modal.tsx` (new)
- `src/pages/core/messages.tsx` (modified)

### Verification
- `npx tsc --noEmit` passed with no errors
