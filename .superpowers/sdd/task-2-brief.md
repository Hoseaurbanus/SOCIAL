### Task 2: Fix forgot password flow

**Files:**
- Modify: `src/pages/auth/forgot-password.tsx:45` — change `redirectTo`
- Create: `src/pages/auth/reset-password.tsx` — new page to handle reset token
- Modify: `src/router.tsx` — add reset-password route

**The bug:** `redirectTo` points to `/login`. User clicks reset link, lands on `/login` with tokens in URL hash, session is established but password is never changed.

- [ ] **Step 1: Fix redirectTo in forgot-password.tsx**

Change the `redirectTo` in the `resetPasswordForEmail` call:

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
})
```

- [ ] **Step 2: Create reset-password.tsx**

Create `src/pages/auth/reset-password.tsx` with:
- Session check via `supabase.auth.getSession()`
- Password + confirm password inputs with show/hide toggle
- Zod validation (min 8 chars, match)
- `supabase.auth.updateUser({ password })` on submit
- Success state with 2s redirect to `/home`
- Invalid session state with "Request New Link" button

- [ ] **Step 3: Add route to router.tsx**

```typescript
const ResetPasswordPage = lazy(() => import('./pages/auth/reset-password'))
```

Add to AuthLayout children:

```typescript
{ path: 'reset-password', element: <Suspense fallback={<SuspenseLoader />}><ResetPasswordPage /></Suspense> },
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/auth/forgot-password.tsx src/pages/auth/reset-password.tsx src/router.tsx
git commit -m "fix: add reset-password page and fix forgot-password redirect flow"
```

---


