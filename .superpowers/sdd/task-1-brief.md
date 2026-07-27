### Task 1: Fix OTP vs Magic Link mismatch in auth store

**Files:**
- Modify: `src/stores/auth-store.ts:76-121`

**The bug:** `signup()` calls `signInWithOtp({ email })` which sends a magic link by default. But the verify page expects a 6-digit OTP code. `verifyOtp()` uses `type: 'magiclink'` for email, which expects the user to have clicked a link, not typed a code.

**Fix:** Change the OTP type to `'email'` for email and keep `'sms'` for phone.

- [ ] **Step 1: Fix verifyOtp to use correct type**

In `src/stores/auth-store.ts`, change the `verifyOtp` method:

```typescript
verifyOtp: async (identifier, token, type) => {
  const { data, error } = await supabase.auth.verifyOtp({
    [type]: identifier,
    token,
    type: type === 'email' ? 'email' : 'sms',
  } as any)
  if (error) return { error: error.message }

  if (data.session && data.user) {
    set({
      user: buildProfile(data.user),
      token: data.session.access_token,
      isAuthenticated: true,
      isLoading: false,
      pendingVerification: null,
    })
  }
  return {}
},
```

- [ ] **Step 2: Verify Supabase dashboard setting**

The user must also set their Supabase project's Email Template from "Magic Link" to "OTP" in the Supabase dashboard under Authentication > Email Templates. This is a dashboard configuration, not code.

- [ ] **Step 3: Commit**

```bash
git add src/stores/auth-store.ts
git commit -m "fix: change OTP verification type from magiclink to email/sms"
```

---


