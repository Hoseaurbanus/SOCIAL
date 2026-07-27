### Task 1: Fix OTP vs Magic Link mismatch in auth store

**Status:** ✅ Complete

**Commits:**
- `124becb` - fix: change OTP verification type from magiclink to email/sms

**Test Summary:** TypeScript compilation passes (`npx tsc --noEmit`).

**Concerns:**
- User must also update Supabase dashboard setting: Authentication > Email Templates from "Magic Link" to "OTP" for email verification to work correctly.

**Report File:** C:\New folder (2)\GG (10)\SOCIAL\.superpowers\sdd\task-1-report.md