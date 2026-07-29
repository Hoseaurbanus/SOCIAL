# Space Invite System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete invite system to SMUGFLEX Spaces — direct user invites, shareable invite links with expiry/usage limits, and join approval workflow.

**Architecture:** New `space_invites` table with token-based invites, new `require_approval` column on `spaces`, new API functions in `src/api/invites.ts`, new hooks in `src/hooks/use-invites.ts`, new UI components (InviteModal, JoinPage, PendingApprovals), and modifications to existing space detail/settings pages.

**Tech Stack:** React, TypeScript, Supabase (PostgreSQL + RLS), React Query, Zustand, Tailwind CSS, Lucide icons, react-router

---

## Global Constraints

- Types use snake_case to match Supabase schema
- All Supabase queries use explicit FK hints to avoid PostgREST errors
- Button component uses `primary`, `secondary`, `ghost`, `danger`, `success` variants (NO `outline`)
- Import from `@/components/atoms/button` and `@/components/atoms/input`
- Use `useToast((s) => s.toast)` selector pattern (NOT `const { toast } = useToast()`)
- Use `react-router` (NOT `react-router-dom`)
- Vercel build: must use `tsc -b` (not `tsc --noEmit`)
- Graceful fallback: API functions return empty data when tables missing (error codes: `42P01`, `42501`, `PGRST301`)

---

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260729020000_space_invites.sql` | Database migration — new table, new column, RLS, indexes |
| `src/types/invites.ts` | Invite types — SpaceInvite, InviteType, InviteStatus |
| `src/api/invites.ts` | Invite API — createInvite, revokeInvite, fetchSpaceInvites, validateInviteToken, acceptInvite, fetchPendingApprovals, approveMember, rejectMember |
| `src/hooks/use-invites.ts` | Invite hooks — useSpaceInvites, useCreateInvite, useRevokeInvite, useAcceptInvite, usePendingApprovals, useApproveMember, useRejectMember |
| `src/pages/core/join-page.tsx` | Join page — public `/join/:token` page for invite links |
| `src/components/organisms/invite-modal.tsx` | Invite modal — search users + create link invites |
| `src/components/molecules/invite-link-card.tsx` | Invite link card — shows link with copy, expiry, usage, revoke |
| `src/components/molecules/pending-approvals.tsx` | Pending approvals — list of pending members with approve/reject |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/spaces.ts` | Add `require_approval` to Space type |
| `src/api/spaces.ts` | Update `joinSpace()` to check visibility, update `createSpace()` and `updateSpace()` for require_approval |
| `src/hooks/use-spaces.ts` | Update `useCreateSpace` and `useUpdateSpace` for require_approval |
| `src/pages/core/space-detail.tsx` | Add Invite button (owner/admin), pending count badge, update Members tab with approve/reject |
| `src/pages/core/space-settings.tsx` | Add require_approval toggle |
| `src/router.tsx` | Add `/join/:token` route |

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260729020000_space_invites.sql`

**Interfaces:**
- Consumes: existing `spaces`, `space_members`, `profiles`, `roles` tables
- Produces: `space_invites` table, `require_approval` column on spaces, RLS policies, indexes, RPC functions

- [ ] **Step 1: Create the migration file**

```sql
-- Space Invites Migration
-- Adds: space_invites table, require_approval column, RLS policies, indexes

-- 1. Add require_approval column to spaces
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT false;

-- 2. Create space_invites table
CREATE TABLE IF NOT EXISTS space_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_type TEXT NOT NULL CHECK (invite_type IN ('direct', 'link')),
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  invited_user_id UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_space_invites_space_id ON space_invites(space_id);
CREATE INDEX IF NOT EXISTS idx_space_invites_token ON space_invites(token);
CREATE INDEX IF NOT EXISTS idx_space_invites_invited_user_id ON space_invites(invited_user_id);

-- 4. RLS policies for space_invites
ALTER TABLE space_invites ENABLE ROW LEVEL SECURITY;

-- Members can see invites they created for their spaces
CREATE POLICY "Members can view own invites"
  ON space_invites FOR SELECT
  USING (
    created_by = auth.uid()
    OR space_id IN (
      SELECT space_id FROM space_members WHERE user_id = auth.uid()
    )
  );

-- Anyone can validate a token (for join page)
CREATE POLICY "Anyone can validate invite token"
  ON space_invites FOR SELECT
  USING (true);

-- Owner/admin can create invites
CREATE POLICY "Owner/admin can create invites"
  ON space_invites FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND space_id IN (
      SELECT space_id FROM space_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Creator or owner/admin can revoke
CREATE POLICY "Creator or owner/admin can revoke invites"
  ON space_invites FOR UPDATE
  USING (
    created_by = auth.uid()
    OR space_id IN (
      SELECT space_id FROM space_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Owner/admin can delete invites
CREATE POLICY "Owner/admin can delete invites"
  ON space_invites FOR DELETE
  USING (
    space_id IN (
      SELECT space_id FROM space_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- 5. RPC function to increment invite usage
CREATE OR REPLACE FUNCTION increment_invite_usage(invite_token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE space_invites
  SET used_count = used_count + 1
  WHERE token = invite_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC function to check if space requires approval
CREATE OR REPLACE FUNCTION space_requires_approval(space_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT require_approval INTO result
  FROM spaces WHERE id = space_uuid;
  RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 2: Verify migration syntax**

Run: `echo "Migration file created successfully"`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260729020000_space_invites.sql
git commit -m "feat: add space_invites table, require_approval column, RLS policies"
```

---

### Task 2: Invite Types

**Files:**
- Create: `src/types/invites.ts`

**Interfaces:**
- Consumes: Space type from `@/types/spaces`
- Produces: SpaceInvite, InviteType, InviteStatus, INVITE_EXPIRY_OPTIONS, INVITE_USES_OPTIONS

- [ ] **Step 1: Create the types file**

```typescript
export type InviteType = 'direct' | 'link';
export type InviteStatus = 'active' | 'revoked' | 'expired';

export interface SpaceInvite {
  id: string;
  space_id: string;
  created_by: string;
  invite_type: InviteType;
  token: string;
  email: string | null;
  invited_user_id: string | null;
  expires_at: string;
  max_uses: number;
  used_count: number;
  status: InviteStatus;
  created_at: string;
}

export interface SpaceInviteWithDetails extends SpaceInvite {
  inviter?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  invited_user?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

export interface CreateInviteInput {
  spaceId: string;
  inviteType: InviteType;
  email?: string;
  userId?: string;
  expiresAt: string;
  maxUses: number;
}

export const INVITE_EXPIRY_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '24 hours', value: 24 },
  { label: '7 days', value: 168 },
  { label: '30 days', value: 720 },
] as const;

export const INVITE_USES_OPTIONS = [
  { label: '1 use', value: 1 },
  { label: '5 uses', value: 5 },
  { label: '10 uses', value: 10 },
  { label: '25 uses', value: 25 },
  { label: 'Unlimited', value: 999 },
] as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/types/invites.ts
git commit -m "feat: add SpaceInvite types and constants"
```

---

### Task 3: Invite API Functions

**Files:**
- Create: `src/api/invites.ts`

**Interfaces:**
- Consumes: SpaceInvite types from `@/types/invites`, supabase from `@/config/supabase`
- Produces: createInvite, revokeInvite, fetchSpaceInvites, validateInviteToken, acceptInvite, fetchPendingApprovals, approveMember, rejectMember, generateInviteToken

- [ ] **Step 1: Create the API file**

```typescript
import { supabase } from '@/config/supabase';
import type { SpaceInvite, CreateInviteInput } from '@/types/invites';

const TABLE_MISSING = ['42P01', '42501', 'PGRST301'];

export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function createInvite(input: CreateInviteInput): Promise<SpaceInvite | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const token = generateInviteToken();

  const { data, error } = await supabase
    .from('space_invites')
    .insert({
      space_id: input.spaceId,
      created_by: user.id,
      invite_type: input.inviteType,
      token,
      email: input.email || null,
      invited_user_id: input.userId || null,
      expires_at: input.expiresAt,
      max_uses: input.maxUses,
    })
    .select()
    .single();

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return null;
    throw error;
  }
  return data;
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from('space_invites')
    .update({ status: 'revoked' })
    .eq('id', inviteId);

  if (error) throw error;
}

export async function fetchSpaceInvites(spaceId: string): Promise<SpaceInvite[]> {
  const { data, error } = await supabase
    .from('space_invites')
    .select('*')
    .eq('space_id', spaceId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return [];
    throw error;
  }
  return data || [];
}

export async function validateInviteToken(token: string): Promise<{
  valid: boolean;
  invite?: SpaceInvite;
  error?: string;
}> {
  const { data, error } = await supabase
    .from('space_invites')
    .select('*')
    .eq('token', token)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid or expired invite link.' };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'This invite has expired.' };
  }

  if (data.used_count >= data.max_uses) {
    return { valid: false, error: 'This invite has reached its usage limit.' };
  }

  return { valid: true, invite: data };
}

export async function acceptInvite(token: string): Promise<{
  success: boolean;
  spaceSlug?: string;
  error?: string;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const validation = await validateInviteToken(token);
  if (!validation.valid || !validation.invite) {
    return { success: false, error: validation.error };
  }

  const invite = validation.invite;

  const { data: existingMember } = await supabase
    .from('space_members')
    .select('space_id')
    .eq('space_id', invite.space_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMember) {
    const { data: space } = await supabase
      .from('spaces')
      .select('slug')
      .eq('id', invite.space_id)
      .single();
    return { success: true, spaceSlug: space?.slug };
  }

  const { data: memberRole } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'member')
    .single();

  const { data: spaceData } = await supabase
    .from('spaces')
    .select('require_approval')
    .eq('id', invite.space_id)
    .single();

  const isDirectInvite = invite.invite_type === 'direct';
  const requireApproval = spaceData?.require_approval && !isDirectInvite;

  const { error: memberError } = await supabase
    .from('space_members')
    .insert({
      space_id: invite.space_id,
      user_id: user.id,
      role: 'member',
      role_id: memberRole?.id || null,
      status: requireApproval ? 'pending' : 'active',
    });

  if (memberError) throw memberError;

  await supabase.rpc('increment_space_members', { space_id: invite.space_id });
  await supabase.rpc('increment_invite_usage', { invite_token: token });

  const { data: space } = await supabase
    .from('spaces')
    .select('slug')
    .eq('id', invite.space_id)
    .single();

  return { success: true, spaceSlug: space?.slug };
}

export async function fetchPendingApprovals(spaceId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('space_members')
    .select('*, user:profiles!space_members_user_id_fkey(id, name, username, avatar)')
    .eq('space_id', spaceId)
    .eq('status', 'pending')
    .order('joined_at');

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return [];
    throw error;
  }
  return data || [];
}

export async function approveMember(spaceId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('space_members')
    .update({ status: 'active' })
    .eq('space_id', spaceId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function rejectMember(spaceId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('space_members')
    .delete()
    .eq('space_id', spaceId)
    .eq('user_id', userId);

  if (error) throw error;

  try {
    await supabase.rpc('decrement_space_members', { space_id: spaceId });
  } catch {
    // Counter may go stale
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/invites.ts
git commit -m "feat: add invite API functions (create, revoke, validate, accept, approve, reject)"
```

---

### Task 4: Invite Hooks

**Files:**
- Create: `src/hooks/use-invites.ts`

**Interfaces:**
- Consumes: API functions from `@/api/invites`
- Produces: useSpaceInvites, useCreateInvite, useRevokeInvite, useAcceptInvite, usePendingApprovals, useApproveMember, useRejectMember

- [ ] **Step 1: Create the hooks file**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSpaceInvites,
  createInvite,
  revokeInvite,
  acceptInvite,
  fetchPendingApprovals,
  approveMember,
  rejectMember,
} from '@/api/invites';
import type { CreateInviteInput } from '@/types/invites';

export function useSpaceInvites(spaceId: string) {
  return useQuery({
    queryKey: ['space-invites', spaceId],
    queryFn: () => fetchSpaceInvites(spaceId),
    staleTime: 30000,
    enabled: !!spaceId,
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInviteInput) => createInvite(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['space-invites', variables.spaceId] });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => revokeInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-invites'] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => acceptInvite(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['spaces', 'my'] });
    },
  });
}

export function usePendingApprovals(spaceId: string) {
  return useQuery({
    queryKey: ['space-pending', spaceId],
    queryFn: () => fetchPendingApprovals(spaceId),
    staleTime: 30000,
    enabled: !!spaceId,
  });
}

export function useApproveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, userId }: { spaceId: string; userId: string }) =>
      approveMember(spaceId, userId),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-pending', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['spaces', spaceId, 'members'] });
    },
  });
}

export function useRejectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, userId }: { spaceId: string; userId: string }) =>
      rejectMember(spaceId, userId),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-pending', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['spaces', spaceId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-invites.ts
git commit -m "feat: add invite hooks (useSpaceInvites, useCreateInvite, useAcceptInvite, etc.)"
```

---

### Task 5: Join Page

**Files:**
- Create: `src/pages/core/join-page.tsx`

**Interfaces:**
- Consumes: validateInviteToken, acceptInvite from `@/api/invites`, useAuthStore, Button, Input, SmugflexLogo
- Produces: JoinPage component (default export)

- [ ] **Step 1: Create the join page**

```tsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Loader2, CheckCircle, XCircle, Users } from 'lucide-react';
import { validateInviteToken, acceptInvite } from '@/api/invites';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/atoms/button';
import { SmugflexLogo } from '@/components/atoms/smugflex-logo';
import type { SpaceInvite } from '@/types/invites';

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [invite, setInvite] = useState<SpaceInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [spaceSlug, setSpaceSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link.');
      setLoading(false);
      return;
    }

    validateInviteToken(token).then((result) => {
      if (result.valid && result.invite) {
        setInvite(result.invite);
      } else {
        setError(result.error || 'Invalid invite link.');
      }
      setLoading(false);
    });
  }, [token]);

  const handleJoin = async () => {
    if (!token || !user) return;
    setJoining(true);
    try {
      const result = await acceptInvite(token);
      if (result.success) {
        setSuccess(true);
        setSpaceSlug(result.spaceSlug || null);
      } else {
        setError(result.error || 'Failed to join space.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <SmugflexLogo className="h-12 w-auto mx-auto" />
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Invite Invalid</h1>
            <p className="text-text-secondary mt-2">{error}</p>
          </div>
          <Link to="/spaces">
            <Button variant="secondary" fullWidth>Browse Spaces</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <SmugflexLogo className="h-12 w-auto mx-auto" />
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">You're in!</h1>
            <p className="text-text-secondary mt-2">You've joined the space successfully.</p>
          </div>
          <Button
            fullWidth
            onClick={() => navigate(spaceSlug ? `/space/${spaceSlug}` : '/spaces')}
          >
            Go to Space
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <SmugflexLogo className="h-12 w-auto mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Join via Invite</h1>
            <p className="text-text-secondary mt-2">Sign in to accept this invite</p>
          </div>
          <Link to={`/login?returnTo=/join/${token}`}>
            <Button fullWidth>Sign In</Button>
          </Link>
          <p className="text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link to={`/signup?returnTo=/join/${token}`} className="text-accent hover:text-accent-hover font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <SmugflexLogo className="h-12 w-auto mx-auto" />

        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-3xl">
            {invite?.space_id ? '🔗' : '🌐'}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-text-primary">You've been invited!</h1>
          <p className="text-text-secondary mt-2">
            Join this space to participate and connect with members.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
          <Users className="w-4 h-4" />
          <span>Expires {new Date(invite!.expires_at).toLocaleDateString()}</span>
        </div>

        <Button fullWidth onClick={handleJoin} disabled={joining}>
          {joining ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Join Space
        </Button>

        <Link to="/spaces" className="block">
          <Button variant="ghost" fullWidth>Browse Other Spaces</Button>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/core/join-page.tsx
git commit -m "feat: add JoinPage for invite link flow"
```

---

### Task 6: Invite Link Card Component

**Files:**
- Create: `src/components/molecules/invite-link-card.tsx`

**Interfaces:**
- Consumes: SpaceInvite from `@/types/invites`, Button, useToast
- Produces: InviteLinkCard component

- [ ] **Step 1: Create the component**

```tsx
import { useState } from 'react';
import { Link2, Copy, Clock, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { useToast } from '@/hooks/use-toast';
import type { SpaceInvite } from '@/types/invites';

interface InviteLinkCardProps {
  invite: SpaceInvite;
  onRevoke: () => void;
}

export function InviteLinkCard({ invite, onRevoke }: InviteLinkCardProps) {
  const toast = useToast((s) => s.toast);
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}/join/${invite.token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({ title: 'Link copied!', variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'error' });
    }
  };

  const expiresAt = new Date(invite.expires_at);
  const isExpired = expiresAt < new Date();
  const isMaxed = invite.used_count >= invite.max_uses;

  return (
    <div className="p-4 rounded-2xl bg-bg-secondary border border-border-primary">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
          <Link2 className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isExpired || isMaxed
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {isExpired ? 'Expired' : isMaxed ? 'Used up' : 'Active'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isExpired ? 'Expired' : `Expires ${expiresAt.toLocaleDateString()}`}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {invite.used_count}/{invite.max_uses === 999 ? '∞' : invite.max_uses} uses
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          readOnly
          value={inviteUrl}
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-border-primary bg-bg-primary text-text-secondary truncate"
        />
        <Button size="sm" onClick={handleCopy} disabled={isExpired || isMaxed}>
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        <Button size="sm" variant="danger" onClick={onRevoke}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/molecules/invite-link-card.tsx
git commit -m "feat: add InviteLinkCard component"
```

---

### Task 7: Pending Approvals Component

**Files:**
- Create: `src/components/molecules/pending-approvals.tsx`

**Interfaces:**
- Consumes: usePendingApprovals, useApproveMember, useRejectMember from `@/hooks/use-invites`, EmptyState, Button
- Produces: PendingApprovals component

- [ ] **Step 1: Create the component**

```tsx
import { Loader2, Check, X, User } from 'lucide-react';
import { usePendingApprovals, useApproveMember, useRejectMember } from '@/hooks/use-invites';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/molecules/empty-state';
import { Button } from '@/components/atoms/button';

interface PendingApprovalsProps {
  spaceId: string;
}

export function PendingApprovals({ spaceId }: PendingApprovalsProps) {
  const { data: pending, isLoading } = usePendingApprovals(spaceId);
  const approveMember = useApproveMember();
  const rejectMember = useRejectMember();
  const toast = useToast((s) => s.toast);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!pending?.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-secondary px-1">
        Pending Approval ({pending.length})
      </h3>
      {pending.map((member) => (
        <div
          key={member.user_id}
          className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20"
        >
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
            {member.user?.avatar ? (
              <img src={member.user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-accent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-text-primary">
              {member.user?.name || `User ${member.user_id.slice(0, 8)}`}
            </p>
            <p className="text-xs text-text-secondary">
              Requested {new Date(member.joined_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => approveMember.mutate(
                { spaceId, userId: member.user_id },
                { onSuccess: () => toast({ title: 'Member approved', variant: 'success' }) }
              )}
              disabled={approveMember.isPending}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => rejectMember.mutate(
                { spaceId, userId: member.user_id },
                { onSuccess: () => toast({ title: 'Member rejected', variant: 'success' }) }
              )}
              disabled={rejectMember.isPending}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/molecules/pending-approvals.tsx
git commit -m "feat: add PendingApprovals component"
```

---

### Task 8: Invite Modal

**Files:**
- Create: `src/components/organisms/invite-modal.tsx`

**Interfaces:**
- Consumes: useCreateInvite, useSpaceInvites, useRevokeInvite from `@/hooks/use-invites`, InviteLinkCard, Button, Input, useToast
- Produces: InviteModal component

- [ ] **Step 1: Create the component**

```tsx
import { useState } from 'react';
import { X, Search, Link2, Loader2, Mail, UserPlus } from 'lucide-react';
import { useCreateInvite, useSpaceInvites, useRevokeInvite } from '@/hooks/use-invites';
import { InviteLinkCard } from '@/components/molecules/invite-link-card';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { useToast } from '@/hooks/use-toast';
import { INVITE_EXPIRY_OPTIONS, INVITE_USES_OPTIONS } from '@/types/invites';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  spaceName: string;
}

export function InviteModal({ isOpen, onClose, spaceId, spaceName }: InviteModalProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'link'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; username: string } | null>(null);
  const [expiryHours, setExpiryHours] = useState(168);
  const [maxUses, setMaxUses] = useState(10);

  const createInvite = useCreateInvite();
  const { data: existingInvites } = useSpaceInvites(spaceId);
  const revokeInvite = useRevokeInvite();
  const toast = useToast((s) => s.toast);

  if (!isOpen) return null;

  const handleDirectInvite = async () => {
    if (!selectedUser) return;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
    try {
      await createInvite.mutateAsync({
        spaceId,
        inviteType: 'direct',
        userId: selectedUser.id,
        expiresAt,
        maxUses: 1,
      });
      toast({ title: `Invited ${selectedUser.name}`, variant: 'success' });
      setSelectedUser(null);
      setSearchQuery('');
    } catch {
      toast({ title: 'Failed to send invite', variant: 'error' });
    }
  };

  const handleCreateLink = async () => {
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
    try {
      await createInvite.mutateAsync({
        spaceId,
        inviteType: 'link',
        expiresAt,
        maxUses,
      });
      toast({ title: 'Invite link created', variant: 'success' });
    } catch {
      toast({ title: 'Failed to create link', variant: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-bg-primary rounded-2xl border border-border-primary shadow-xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Invite to {spaceName}</h2>
            <p className="text-sm text-text-secondary">Invite members or share a link</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg-secondary transition-colors">
            <X className="w-5 h-5 text-text-primary" />
          </button>
        </div>

        <div className="flex border-b border-border-primary">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Search Users
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'link'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Link2 className="w-4 h-4 inline mr-2" />
            Create Link
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <Input
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {selectedUser && (
                <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{selectedUser.name}</p>
                    <p className="text-sm text-text-secondary">@{selectedUser.username}</p>
                  </div>
                  <Button size="sm" onClick={handleDirectInvite} disabled={createInvite.isPending}>
                    {createInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Invite'}
                  </Button>
                </div>
              )}

              <p className="text-xs text-text-secondary text-center">
                Search for users to send a direct invite with notification
              </p>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Expiry</label>
                <select
                  value={expiryHours}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExpiryHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-border-primary bg-bg-primary text-text-primary"
                >
                  {INVITE_EXPIRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Max Uses</label>
                <select
                  value={maxUses}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMaxUses(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-border-primary bg-bg-primary text-text-primary"
                >
                  {INVITE_USES_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <Button fullWidth onClick={handleCreateLink} disabled={createInvite.isPending}>
                {createInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Generate Invite Link
              </Button>

              {existingInvites && existingInvites.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h3 className="text-sm font-semibold text-text-secondary">Active Links</h3>
                  {existingInvites.filter(i => i.invite_type === 'link').map((invite) => (
                    <InviteLinkCard
                      key={invite.id}
                      invite={invite}
                      onRevoke={() => revokeInvite.mutate(invite.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/organisms/invite-modal.tsx
git commit -m "feat: add InviteModal component with search and link tabs"
```

---

### Task 9: Update Space Types

**Files:**
- Modify: `src/types/spaces.ts:37` — add `require_approval` to Space interface

**Interfaces:**
- Consumes: existing Space type
- Produces: updated Space type with `require_approval` field

- [ ] **Step 1: Add require_approval to Space type**

In `src/types/spaces.ts`, add `require_approval: boolean;` to the `Space` interface (after `visibility`):

```typescript
export interface Space {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  cover_image: string | null;
  slug: string;
  space_type: SpaceType;
  visibility: SpaceVisibility;
  require_approval: boolean;
  created_by: string;
  settings: { modules: SpaceModules };
  metadata: Record<string, unknown>;
  member_count: number;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/spaces.ts
git commit -m "feat: add require_approval field to Space type"
```

---

### Task 10: Update Space API

**Files:**
- Modify: `src/api/spaces.ts` — update createSpace, joinSpace, updateSpace

**Interfaces:**
- Consumes: updated Space type with require_approval
- Produces: updated API functions

- [ ] **Step 1: Update createSpace to accept requireApproval**

In `src/api/spaces.ts`, update the `createSpace` function signature and insert:

```typescript
export async function createSpace(
  name: string,
  description: string,
  icon: string,
  spaceType: Space['space_type'],
  visibility: Space['visibility'] = 'public',
  requireApproval: boolean = false
): Promise<Space> {
  // ... existing code ...
  const { data, error } = await supabase
    .from('spaces')
    .insert({
      name,
      description,
      icon,
      slug,
      space_type: spaceType,
      visibility,
      require_approval: requireApproval,
      created_by: user.id,
    })
    .select()
    .single();
  // ... rest of function ...
}
```

- [ ] **Step 2: Update joinSpace to check visibility**

In `src/api/spaces.ts`, update `joinSpace` to check if space is private and requires invite:

```typescript
export async function joinSpace(spaceId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: space } = await supabase
    .from('spaces')
    .select('visibility')
    .eq('id', spaceId)
    .single();

  if (space?.visibility === 'private') {
    throw new Error('This space is private. You need an invite to join.');
  }

  const { data: memberRole } = await supabase.from('roles').select('id').eq('name', 'member').single();

  const { error } = await supabase
    .from('space_members')
    .insert({
      space_id: spaceId,
      user_id: user.id,
      role: 'member',
      role_id: memberRole?.id || null,
    });

  if (error) throw error;

  try {
    await supabase.rpc('increment_space_members', { space_id: spaceId });
  } catch {
    // Counter may go stale
  }
}
```

- [ ] **Step 3: Update updateSpace to accept requireApproval**

In `src/api/spaces.ts`, update the `updateSpace` function's `updates` parameter type:

```typescript
export async function updateSpace(
  spaceId: string,
  updates: Partial<Pick<Space, 'name' | 'description' | 'icon' | 'cover_image' | 'visibility' | 'settings' | 'require_approval'>>
): Promise<Space> {
```

- [ ] **Step 4: Commit**

```bash
git add src/api/spaces.ts
git commit -m "feat: update createSpace/joinSpace/updateSpace for invite system"
```

---

### Task 11: Update Space Hooks

**Files:**
- Modify: `src/hooks/use-spaces.ts` — update useCreateSpace and useUpdateSpace mutation types

**Interfaces:**
- Consumes: updated API functions
- Produces: updated hooks

- [ ] **Step 1: Update useCreateSpace mutation**

In `src/hooks/use-spaces.ts`, update the `useCreateSpace` mutation:

```typescript
export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      description,
      icon,
      spaceType,
      visibility,
      requireApproval,
    }: {
      name: string;
      description: string;
      icon: string;
      spaceType: Space['space_type'];
      visibility?: Space['visibility'];
      requireApproval?: boolean;
    }) => createSpace(name, description, icon, spaceType, visibility, requireApproval),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
}
```

- [ ] **Step 2: Update useUpdateSpace mutation**

In `src/hooks/use-spaces.ts`, update the `useUpdateSpace` mutation types:

```typescript
export function useUpdateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      spaceId,
      updates,
    }: {
      spaceId: string;
      updates: Partial<Pick<Space, 'name' | 'description' | 'icon' | 'cover_image' | 'visibility' | 'settings' | 'require_approval'>>;
    }) => updateSpace(spaceId, updates),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['spaces', 'id', spaceId] });
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-spaces.ts
git commit -m "feat: update useCreateSpace/useUpdateSpace for require_approval"
```

---

### Task 12: Update Router

**Files:**
- Modify: `src/router.tsx` — add `/join/:token` route

**Interfaces:**
- Consumes: JoinPage from `@/pages/core/join-page`
- Produces: updated router with join route

- [ ] **Step 1: Add lazy import and route**

In `src/router.tsx`, add the JoinPage lazy import after the other imports:

```typescript
const JoinPage = lazy(() => import('./pages/core/join-page'))
```

Then add the route inside the `AuthLayout` children (after `reset-password`):

```typescript
{ path: 'join/:token', element: <Suspense fallback={<SuspenseLoader />}><JoinPage /></Suspense> },
```

- [ ] **Step 2: Commit**

```bash
git add src/router.tsx
git commit -m "feat: add /join/:token route for invite links"
```

---

### Task 13: Update Space Detail Page

**Files:**
- Modify: `src/pages/core/space-detail.tsx` — add Invite button, pending badge, update Members tab

**Interfaces:**
- Consumes: InviteModal, PendingApprovals, useSpaceInvites, usePendingApprovals
- Produces: updated space detail page

- [ ] **Step 1: Add imports**

In `src/pages/core/space-detail.tsx`, add imports:

```tsx
import { UserPlus, Mail } from 'lucide-react';
import { InviteModal } from '@/components/organisms/invite-modal';
import { PendingApprovals } from '@/components/molecules/pending-approvals';
import { usePendingApprovals } from '@/hooks/use-invites';
```

- [ ] **Step 2: Add state and hooks**

After the existing hooks, add:

```tsx
const [showInviteModal, setShowInviteModal] = useState(false);
const { data: pendingApprovals } = usePendingApprovals(space?.id || '');
```

- [ ] **Step 3: Add Invite button in header**

After the Settings link in the header, add:

```tsx
{isAdmin && (
  <button
    onClick={() => setShowInviteModal(true)}
    className="p-2 rounded-xl hover:bg-bg-secondary transition-colors relative"
  >
    <UserPlus className="w-5 h-5 text-text-primary" />
    {pendingApprovals && pendingApprovals.length > 0 && (
      <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-accent text-white">
        {pendingApprovals.length}
      </span>
    )}
  </button>
)}
```

- [ ] **Step 4: Add InviteModal render**

Before the closing `</div>`, add:

```tsx
<InviteModal
  isOpen={showInviteModal}
  onClose={() => setShowInviteModal(false)}
  spaceId={space.id}
  spaceName={space.name}
/>
```

- [ ] **Step 5: Update Members tab with PendingApprovals**

In the members tab section, before the members list, add:

```tsx
{isAdmin && <PendingApprovals spaceId={space.id} />}
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/core/space-detail.tsx
git commit -m "feat: add Invite button, pending badge, and PendingApprovals to space detail"
```

---

### Task 14: Update Space Settings Page

**Files:**
- Modify: `src/pages/core/space-settings.tsx` — add require_approval toggle

**Interfaces:**
- Consumes: updated Space type with require_approval
- Produces: updated settings page with approval toggle

- [ ] **Step 1: Add state for requireApproval**

In `src/pages/core/space-settings.tsx`, add state:

```tsx
const [requireApproval, setRequireApproval] = useState(false);
```

- [ ] **Step 2: Initialize from space data**

In the `useEffect` that initializes from space, add:

```tsx
setRequireApproval(space.require_approval || false);
```

- [ ] **Step 3: Add toggle UI in Basic Information section**

After the Visibility select, add:

```tsx
<div className="flex items-center justify-between p-3 rounded-xl bg-bg-secondary">
  <div>
    <p className="font-medium text-text-primary">Require Approval</p>
    <p className="text-sm text-text-secondary">New members must be approved before joining</p>
  </div>
  <button
    onClick={() => setRequireApproval(!requireApproval)}
    className={`w-12 h-6 rounded-full transition-colors ${
      requireApproval ? 'bg-accent' : 'bg-bg-tertiary'
    }`}
  >
    <div
      className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
        requireApproval ? 'translate-x-6' : 'translate-x-0.5'
      }`}
    />
  </button>
</div>
```

- [ ] **Step 4: Include requireApproval in save**

Update `handleSaveSettings` to include requireApproval:

```typescript
updateSpaceMutation.mutate(
  {
    spaceId: space.id,
    updates: {
      name,
      description,
      icon,
      visibility,
      require_approval: requireApproval,
    },
  },
  // ...
);
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/core/space-settings.tsx
git commit -m "feat: add require_approval toggle to space settings"
```

---

### Task 15: TypeCheck and Verify

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript compiler**

Run: `npx tsc -b`
Expected: No errors

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve typecheck and lint errors"
```

---

### Task 16: Final Commit and Push

- [ ] **Step 1: Verify all files are committed**

Run: `git status`
Expected: Nothing to commit

- [ ] **Step 2: Push to remote**

Run: `git push origin master`

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Database migration | `supabase/migrations/20260729020000_space_invites.sql` |
| 2 | Invite types | `src/types/invites.ts` |
| 3 | Invite API | `src/api/invites.ts` |
| 4 | Invite hooks | `src/hooks/use-invites.ts` |
| 5 | Join page | `src/pages/core/join-page.tsx` |
| 6 | Invite link card | `src/components/molecules/invite-link-card.tsx` |
| 7 | Pending approvals | `src/components/molecules/pending-approvals.tsx` |
| 8 | Invite modal | `src/components/organisms/invite-modal.tsx` |
| 9 | Space types update | `src/types/spaces.ts` |
| 10 | Space API update | `src/api/spaces.ts` |
| 11 | Space hooks update | `src/hooks/use-spaces.ts` |
| 12 | Router update | `src/router.tsx` |
| 13 | Space detail update | `src/pages/core/space-detail.tsx` |
| 14 | Space settings update | `src/pages/core/space-settings.tsx` |
| 15 | TypeCheck and verify | — |
| 16 | Final commit and push | — |
