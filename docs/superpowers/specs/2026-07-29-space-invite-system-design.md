# Space Invite System Design

**Date:** 2026-07-29
**Status:** Approved
**Author:** opencode

---

## Overview

Add a complete invite system to SMUGFLEX Spaces, enabling owners/admins to invite specific members via direct invite or shareable invite links with expiry dates and usage limits. Also adds a join approval workflow.

---

## Requirements

1. **Direct invites:** Owner/admin searches users and invites them directly
2. **Link invites:** Generate unique invite links with configurable expiry and usage limits
3. **Multiple links:** Each link is independent with its own token, expiry, and usage tracking
4. **Approval workflow:** Space owners can toggle between auto-join and approval-required
5. **Pre-approved invites:** Direct invites bypass approval (invited users are auto-approved)
6. **Public link sharing:** Both public and private spaces can generate invite links
7. **Notifications:** In-app notification + email for direct invites
8. **Join page:** Public `/join/{token}` page for link invites

---

## Database Schema

### New table: `space_invites`

```sql
CREATE TABLE space_invites (
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
```

### New column on `spaces`

```sql
ALTER TABLE spaces ADD COLUMN require_approval BOOLEAN DEFAULT false;
```

### RLS Policies

- **SELECT:** Members can see invites they created; anyone can validate by token (for join page)
- **INSERT:** Owner/admin can create invites
- **UPDATE:** Creator or owner/admin can revoke
- **DELETE:** Owner/admin can delete

### Indexes

- `space_invites(space_id)` — fast lookup per space
- `space_invites(token)` — fast lookup for join page
- `space_invites(invited_user_id)` — fast lookup for user's pending invites

---

## API Functions

### New file: `src/api/invites.ts`

| Function | Purpose |
|----------|---------|
| `createInvite({ spaceId, inviteType, email?, userId?, expiresAt, maxUses })` | Generate an invite (direct or link) |
| `revokeInvite(inviteId)` | Mark an invite as revoked |
| `fetchSpaceInvites(spaceId)` | List all invites for a space |
| `validateInviteToken(token)` | Check if token is valid, not expired, under usage limit |
| `acceptInvite(token)` | Join space via invite — handles approval logic |
| `fetchPendingApprovals(spaceId)` | List users with `pending` status |
| `approveMember(spaceId, userId)` | Change pending → active |
| `rejectMember(spaceId, userId)` | Remove pending member |

### Modified functions

| Function | Change |
|----------|--------|
| `joinSpace(spaceId)` | Add visibility check — private spaces reject direct join |
| `createSpace()` | Add `requireApproval` field |
| `updateSpace()` | Allow toggling `requireApproval` |

---

## UI Components

### New components

| Component | Location | Purpose |
|-----------|----------|---------|
| `InviteModal` | `src/components/organisms/invite-modal.tsx` | Search users to invite + generate link invites |
| `InviteLinkCard` | `src/components/molecules/invite-link-card.tsx` | Shows link with copy, expiry, usage, revoke |
| `PendingApprovals` | `src/components/molecules/pending-approvals.tsx` | Pending members with approve/reject buttons |
| `JoinPage` | `src/pages/core/join-page.tsx` | Public page for invite links |

### Modified pages

| Page | Changes |
|------|---------|
| `space-detail.tsx` | Add "Invite" button (owner/admin), pending count badge |
| `space-settings.tsx` | Add `require_approval` toggle |
| `space-detail.tsx` Members tab | Approve/reject for pending, remove/ban for active |

---

## Data Flow

### Direct invite flow

1. Owner/admin searches user in InviteModal
2. Clicks "Invite" → `createInvite({ inviteType: 'direct', invited_user_id })`
3. Creates `space_invites` row + `notifications` row (type: `space_invite`) + sends email
4. Invited user sees notification with "Accept" / "Decline"
5. If `require_approval = false` → Accept → active member
6. If `require_approval = true` → user is pre-approved → active member (skips pending)

### Link invite flow

1. Owner/admin opens InviteModal → "Create Link" tab
2. Sets expiry + max uses → clicks "Generate Link"
3. `createInvite({ inviteType: 'link', expiresAt, maxUses })` → returns token
4. Link displayed as `{origin}/join/{token}` with copy button
5. Anyone visits `/join/{token}` → `validateInviteToken(token)`
6. If valid → shows space info + "Join Space" button
7. User clicks Join → `acceptInvite(token)`:
   - `require_approval = false` → joins as active
   - `require_approval = true` → joins as pending

### Edge cases

- User already a member → "Already a member" with link to space
- Token expired → "This invite has expired"
- Token max uses reached → "This invite has reached its usage limit"
- Space deleted → cascade deletes all invites
- User banned → cannot rejoin via invite
- Direct invite to existing member → "Already a member"
- Multiple invites for same space → each is independent

---

## Invite Link Format

```
{origin}/join/{token}
```

Token is a random 32-character alphanumeric string generated via `crypto.randomUUID()`.

---

## Email Template

```
Subject: {inviter_name} invited you to {space_name}

{inviter_name} has invited you to join {space_name} on SMUGFLEX.

[Join {space_name}]

This invite expires on {expires_at}.
```

---

## Implementation Order

1. Database migration (new table, new column, RLS, indexes)
2. Types (`src/types/invites.ts`)
3. API functions (`src/api/invites.ts`)
4. Hooks (`src/hooks/use-invites.ts`)
5. JoinPage (`src/pages/core/join-page.tsx`)
6. InviteModal (`src/components/organisms/invite-modal.tsx`)
7. InviteLinkCard (`src/components/molecules/invite-link-card.tsx`)
8. PendingApprovals (`src/components/molecules/pending-approvals.tsx`)
9. Update space-detail.tsx (invite button, pending badge, member actions)
10. Update space-settings.tsx (require_approval toggle)
11. Update router.tsx (add /join/:token route)
12. Update joinSpace() RLS and API
