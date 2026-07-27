## Task 5: Persist privacy and security settings

### Changes made:

1. **Privacy page** (`src/pages/social/privacy.tsx`):
   - Added imports for `useProfile`, `useUpdateProfile`, `useAuthStore`.
   - Load `is_private` from user profile via Supabase on component mount.
   - Save `is_private` to Supabase via `updateProfile.mutate()` when toggle changes.
   - Store `show_activity` and `allow_mentions` in localStorage (database columns not yet added).
   - Sync local state with profile data using `useEffect`.

2. **Security page** (`src/pages/social/security.tsx`):
   - Added inline password change form with current password, new password, confirm password fields.
   - Implement password change via `supabase.auth.updateUser({ password: newPassword })`.
   - Added validation (required fields, matching passwords, minimum length).
   - Added success/error feedback.
   - Updated "Two-Factor Authentication" and "Active Sessions" descriptions to "Coming soon".

3. **Verification**:
   - Ran `npx tsc --noEmit` – no TypeScript errors.
   - Committed changes with message: `feat: persist privacy and security settings via Supabase`.