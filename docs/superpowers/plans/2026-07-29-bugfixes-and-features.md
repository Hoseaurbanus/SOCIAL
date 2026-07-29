# Bug Fixes & Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 issues across settings persistence, bug fixes, feature completion, and performance optimization.

**Architecture:** Extend the existing `profiles` table with settings columns, add `community_id` to posts for community feeds, fix comment deletion count, add avatar cleanup, and optimize conversation queries with batch loading.

**Tech Stack:** Supabase (PostgreSQL, RLS, Storage), React + React Query, Zustand, TypeScript

## Global Constraints

- Brand name: **SMUGFLEX** (never "S.S")
- Accent color: Teal `#0D9488`, Secondary: Amber `#F59E0B`
- Dark theme accent: `#5EEAD4`
- Font: Inter (variable weight 100-900)
- 8-point grid system
- Types use snake_case to match Supabase schema
- All API functions must handle missing table errors gracefully (`42P01`, `42501`, `PGRST301`)
- Supabase queries use explicit FK hints (e.g., `profiles!posts_user_id_fkey(...)`)
- Vercel build: `tsc -b` (not `tsc --noEmit`)

---

## File Structure

| File | Action | Purpose |
|---|---|---|
| `supabase/complete-migration.sql` | Modify | Add settings columns to profiles, community_id to posts, indexes |
| `src/types/api.ts` | Modify | Add `notification_preferences` to User type |
| `src/api/posts.ts` | Modify | Add `deleteComment`, `fetchCommunityPosts` |
| `src/api/profile.ts` | Modify | Add `deleteOldAvatar` helper |
| `src/api/messages.ts` | Modify | Rewrite `fetchConversations` with batch queries |
| `src/hooks/use-posts.ts` | Modify | Add `useDeleteComment`, `useCommunityPosts` |
| `src/pages/social/notification-settings.tsx` | Modify | Read/write via Supabase instead of localStorage |
| `src/pages/social/privacy.tsx` | Modify | Read/write `show_activity`, `allow_mentions` via Supabase |
| `src/pages/social/account-settings.tsx` | Modify | Add avatar cleanup on save |
| `src/components/molecules/post-card.tsx` | Modify | Add delete button for own comments |
| `src/pages/core/home.tsx` | Modify | Wire up community posts feed |

---

## Task 1: Database Migration — Add Columns

**Files:**
- Modify: `supabase/complete-migration.sql`

**Interfaces:**
- Produces: New columns on `profiles` and `posts` tables, new indexes

- [ ] **Step 1: Add settings columns to profiles table**

Append to `complete-migration.sql` after the stories section:

```sql
-- ============================================================
-- SETTINGS: Add notification and privacy preference columns
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_activity boolean DEFAULT true;
ALTER TABLE public.profiles ADD IF NOT EXISTS allow_mentions boolean DEFAULT true;
```

- [ ] **Step 2: Add community_id to posts table**

```sql
-- ============================================================
-- COMMUNITY POSTS: Add community_id to posts table
-- ============================================================

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON public.posts(community_id) WHERE community_id IS NOT NULL;
```

- [ ] **Step 3: Add performance indexes**

```sql
-- ============================================================
-- PERFORMANCE: Additional indexes for common queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
```

- [ ] **Step 4: Commit**

```bash
git add supabase/complete-migration.sql
git commit -m "migration: add settings columns, community_id on posts, performance indexes"
```

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/api.ts:5-18`

**Interfaces:**
- Consumes: Migration from Task 1
- Produces: Updated `User` type with new fields

- [ ] **Step 1: Add notification_preferences to User type**

In `src/types/api.ts`, update the `User` interface:

```typescript
export interface User {
  id: string
  email: string
  phone?: string
  name: string
  username: string
  avatar?: string
  bio?: string
  website?: string
  location?: string
  is_private: boolean
  notification_preferences?: {
    push?: boolean
    email?: boolean
    likes?: boolean
    comments?: boolean
    follows?: boolean
    messages?: boolean
  }
  show_activity?: boolean
  allow_mentions?: boolean
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2: Add community_id to Post type**

Update the `Post` interface:

```typescript
export interface Post {
  id: string
  user_id: string
  community_id?: string | null
  content: string
  images?: string[]
  video_url?: string | null
  link_preview?: LinkPreview | null
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  user: Pick<User, 'id' | 'name' | 'username' | 'avatar'>
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/api.ts
git commit -m "types: add notification_preferences, show_activity, allow_mentions, community_id"
```

---

## Task 3: Fix Comment Deletion — Add deleteComment API

**Files:**
- Modify: `src/api/posts.ts:138-166`
- Modify: `src/hooks/use-posts.ts`

**Interfaces:**
- Consumes: `decrement_comments` RPC (already exists in migration)
- Produces: `deleteComment(postId, commentId)` function, `useDeleteComment` hook

- [ ] **Step 1: Add deleteComment function to posts.ts**

Add after the `addComment` function in `src/api/posts.ts`:

```typescript
export async function deleteComment(commentId: string, postId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) throw error

  await supabase.rpc('decrement_comments', { post_id: postId })
}
```

- [ ] **Step 2: Add useDeleteComment hook to use-posts.ts**

Add after the `useAddComment` hook:

```typescript
export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient()
  const toast = useToast((s) => s.toast)

  return useMutation({
    mutationFn: ({ commentId }: { commentId: string }) => deleteComment(commentId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast({ title: 'Comment deleted', variant: 'success' })
    },
    onError: () => {
      toast({ title: 'Failed to delete comment', variant: 'error' })
    },
  })
}
```

- [ ] **Step 3: Update post-card.tsx to show delete button for own comments**

In `src/components/molecules/post-card.tsx`, add `useAuthStore` import and update the comment rendering:

Add import at top:
```typescript
import { useAuthStore } from '@/stores/auth-store'
import { Trash2 } from 'lucide-react'
```

Inside the component, add:
```typescript
const currentUser = useAuthStore((s) => s.user)
const deleteCommentMutation = useDeleteComment(postId || '')
```

Update the comment rendering section (around line 190-206) to add delete button:

```tsx
{postComments.map((comment) => (
  <div key={comment.id} className="flex gap-3">
    <Link to={`/profile/${comment.user.username}`}>
      <Avatar src={comment.user.avatar} alt={comment.user.name} size="sm" />
    </Link>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <Link to={`/profile/${comment.user.username}`} className="text-sm font-semibold text-text-primary hover:text-accent transition-colors">{comment.user.name}</Link>
        <span className="text-xs text-text-tertiary">@{comment.user.username}</span>
        <span className="text-xs text-text-tertiary">·</span>
        <span className="text-xs text-text-tertiary">{timeAgo(comment.created_at)}</span>
        {comment.user_id === currentUser?.id && (
          <button
            onClick={() => deleteCommentMutation.mutate({ commentId: comment.id })}
            className="ml-auto p-1 rounded-lg text-text-tertiary hover:text-error hover:bg-error-light transition-colors"
            aria-label="Delete comment"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="text-sm text-text-primary mt-0.5">{comment.content}</p>
    </div>
  </div>
))}
```

- [ ] **Step 4: Verify imports in use-posts.ts**

Ensure `deleteComment` is imported at the top of `use-posts.ts`:

```typescript
import { 
  fetchFeedPosts, fetchPostsByUser, fetchFollowingPosts, fetchTrendingPosts,
  createPost, deletePost, toggleLike, toggleBookmark, addComment, deleteComment,
  checkLikeStatus, checkBookmarkStatus, fetchPostComments, fetchPostById,
  fetchLikedPosts, fetchBookmarkedPosts, fetchUserReplies
} from '@/api/posts'
```

- [ ] **Step 5: Commit**

```bash
git add src/api/posts.ts src/hooks/use-posts.ts src/components/molecules/post-card.tsx
git commit -m "fix: decrement comments_count when comment is deleted"
```

---

## Task 4: Avatar Cleanup on Upload

**Files:**
- Modify: `src/pages/social/account-settings.tsx:46-67`

**Interfaces:**
- Consumes: `profile.avatar` (current avatar URL)
- Produces: Old avatar deleted from Supabase Storage before new upload

- [ ] **Step 1: Add avatar cleanup helper to profile.ts**

Add after the `uploadAvatar` function in `src/api/profile.ts`:

```typescript
export async function deleteOldAvatar(avatarUrl: string | null | undefined) {
  if (!avatarUrl) return

  // Only delete if it's from our Supabase storage
  if (!avatarUrl.includes('/storage/v1/object/public/avatars/')) return

  // Extract file path from URL
  const urlParts = avatarUrl.split('/storage/v1/object/public/avatars/')
  if (urlParts.length < 2) return

  const filePath = urlParts[1]

  await supabase.storage.from('avatars').remove([filePath])
}
```

- [ ] **Step 2: Update handleSave in account-settings.tsx**

Replace the `handleSave` function in `src/pages/social/account-settings.tsx`:

```typescript
const handleSave = async () => {
  setSaving(true)
  try {
    let avatarUrl = profile?.avatar
    if (avatarFile) {
      // Delete old avatar first
      await deleteOldAvatar(profile?.avatar)

      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`
      const { error } = await supabase.storage.from('avatars').upload(filePath, avatarFile)
      if (error) throw error
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      avatarUrl = urlData.publicUrl
    }
    await updateProfile.mutateAsync({ name, username, bio, website, location, avatar: avatarUrl })
    toast({ title: 'Account updated!', variant: 'success' })
    navigate(-1)
  } catch (err: any) {
    toast({ title: err.message || 'Failed to update account', variant: 'error' })
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 3: Add import for deleteOldAvatar**

Add to imports in `account-settings.tsx`:

```typescript
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'
import { deleteOldAvatar } from '@/api/profile'
```

- [ ] **Step 4: Commit**

```bash
git add src/api/profile.ts src/pages/social/account-settings.tsx
git commit -m "fix: delete old avatar from storage when uploading new one"
```

---

## Task 5: Notification Settings — Persist to Supabase

**Files:**
- Modify: `src/pages/social/notification-settings.tsx`

**Interfaces:**
- Consumes: `useProfile()`, `useUpdateProfile()`
- Produces: Settings read/written to `profiles.notification_preferences`

- [ ] **Step 1: Rewrite notification-settings.tsx**

Replace the entire file:

```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

interface ToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div>
        <div className="text-text-primary">{label}</div>
        <div className="text-sm text-text-secondary">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-bg-tertiary'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

const DEFAULT_PREFS = {
  push: true,
  email: false,
  likes: true,
  comments: true,
  follows: true,
  messages: true,
}

export default function NotificationSettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: profile } = useProfile(user?.username || '')
  const updateProfile = useUpdateProfile()
  const { toast } = useToast()

  const [settings, setSettings] = useState(DEFAULT_PREFS)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (profile && !initialized) {
      const saved = profile.notification_preferences
      if (saved && typeof saved === 'object') {
        setSettings({ ...DEFAULT_PREFS, ...saved })
      }
      setInitialized(true)
    }
  }, [profile, initialized])

  const update = (key: keyof typeof settings, value: boolean) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    updateProfile.mutate(
      { notification_preferences: next },
      {
        onError: () => toast({ title: 'Failed to save setting', variant: 'error' }),
      }
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
      </div>

      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Channels</h3>
      </div>
      <Toggle label="Push notifications" description="Receive push notifications" checked={settings.push} onChange={(v) => update('push', v)} />
      <Toggle label="Email notifications" description="Receive email updates" checked={settings.email} onChange={(v) => update('email', v)} />

      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Types</h3>
      </div>
      <Toggle label="Likes" description="When someone likes your post" checked={settings.likes} onChange={(v) => update('likes', v)} />
      <Toggle label="Comments" description="When someone comments on your post" checked={settings.comments} onChange={(v) => update('comments', v)} />
      <Toggle label="New followers" description="When someone follows you" checked={settings.follows} onChange={(v) => update('follows', v)} />
      <Toggle label="Messages" description="When you receive a message" checked={settings.messages} onChange={(v) => update('messages', v)} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/social/notification-settings.tsx
git commit -m "fix: persist notification settings to Supabase profiles table"
```

---

## Task 6: Privacy Settings — Persist to Supabase

**Files:**
- Modify: `src/pages/social/privacy.tsx`

**Interfaces:**
- Consumes: `useProfile()`, `useUpdateProfile()`
- Produces: `show_activity` and `allow_mentions` read/written to Supabase

- [ ] **Step 1: Rewrite privacy.tsx**

Replace the entire file:

```tsx
import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-accent' : 'bg-bg-tertiary'
      )}
    >
      <span className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
        checked ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  )
}

export default function PrivacyPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: profile } = useProfile(user?.username || '')
  const updateProfile = useUpdateProfile()
  const { toast } = useToast()

  const [privateAccount, setPrivateAccount] = useState(false)
  const [showActivity, setShowActivity] = useState(true)
  const [allowMentions, setAllowMentions] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (profile && !initialized) {
      setPrivateAccount(profile.is_private ?? false)
      setShowActivity(profile.show_activity ?? true)
      setAllowMentions(profile.allow_mentions ?? true)
      setInitialized(true)
    }
  }, [profile, initialized])

  const handleTogglePrivate = () => {
    const newValue = !privateAccount
    setPrivateAccount(newValue)
    updateProfile.mutate(
      { is_private: newValue },
      { onError: () => toast({ title: 'Failed to update', variant: 'error' }) }
    )
  }

  const handleToggleActivity = () => {
    const newValue = !showActivity
    setShowActivity(newValue)
    updateProfile.mutate(
      { show_activity: newValue },
      { onError: () => toast({ title: 'Failed to update', variant: 'error' }) }
    )
  }

  const handleToggleMentions = () => {
    const newValue = !allowMentions
    setAllowMentions(newValue)
    updateProfile.mutate(
      { allow_mentions: newValue },
      { onError: () => toast({ title: 'Failed to update', variant: 'error' }) }
    )
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Privacy</h1>
      </div>

      <div className="bg-bg-primary divide-y divide-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-text-primary font-medium">Private Account</div>
              <div className="text-sm text-text-secondary">Only followers can see your posts</div>
            </div>
            <Toggle checked={privateAccount} onChange={handleTogglePrivate} />
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-text-primary font-medium">Show Activity Status</div>
              <div className="text-sm text-text-secondary">Let others see when you are active</div>
            </div>
            <Toggle checked={showActivity} onChange={handleToggleActivity} />
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-text-primary font-medium">Allow Mentions</div>
              <div className="text-sm text-text-secondary">Let people mention you in comments</div>
            </div>
            <Toggle checked={allowMentions} onChange={handleToggleMentions} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/social/privacy.tsx
git commit -m "fix: persist privacy settings (show_activity, allow_mentions) to Supabase"
```

---

## Task 7: Community Posts Feed

**Files:**
- Modify: `src/api/posts.ts`
- Modify: `src/hooks/use-posts.ts`
- Modify: `src/pages/core/home.tsx`

**Interfaces:**
- Consumes: `community_id` column on posts (Task 1), `community_members` table
- Produces: `fetchCommunityPosts()` API function, `useCommunityPosts()` hook, working Communities tab

- [ ] **Step 1: Add fetchCommunityPosts to posts.ts**

Add after `fetchTrendingPosts` in `src/api/posts.ts`:

```typescript
export async function fetchCommunityPosts(page = 1, pageSize = 20) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { posts: [] as Post[], total: 0 }

  // Get user's joined communities
  const { data: memberships, error: mError } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', user.id)

  if (mError) {
    if (TABLE_MISSING.includes(mError.code)) return { posts: [], total: 0 }
    throw mError
  }

  const communityIds = memberships?.map((m) => m.community_id) || []
  if (communityIds.length === 0) return { posts: [], total: 0 }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('posts')
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)', { count: 'exact' })
    .in('community_id', communityIds)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return { posts: [], total: 0 }
    throw error
  }
  return { posts: (data || []) as Post[], total: count || 0 }
}
```

- [ ] **Step 2: Add useCommunityPosts hook to use-posts.ts**

Add after `useTrendingPosts`:

```typescript
export function useCommunityPosts() {
  return useInfiniteQuery({
    queryKey: ['posts', 'community'],
    queryFn: ({ pageParam = 1 }) => fetchCommunityPosts(pageParam),
    getNextPageParam: (lastPage, allPages) => {
      const loadedPosts = allPages.reduce((acc, page) => acc + page.posts.length, 0)
      return loadedPosts < lastPage.total ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
  })
}
```

- [ ] **Step 3: Add import to use-posts.ts**

Update the import at the top of `use-posts.ts`:

```typescript
import {
  fetchFeedPosts, fetchPostsByUser, fetchFollowingPosts, fetchTrendingPosts, fetchCommunityPosts,
  createPost, deletePost, toggleLike, toggleBookmark, addComment, deleteComment,
  checkLikeStatus, checkBookmarkStatus, fetchPostComments, fetchPostById,
  fetchLikedPosts, fetchBookmarkedPosts, fetchUserReplies
} from '@/api/posts'
```

- [ ] **Step 4: Update home.tsx to use community posts**

In `src/pages/core/home.tsx`, add the import:

```typescript
import { useFeedPosts, useFollowingPosts, useTrendingPosts, useCommunityPosts, useToggleLike, useToggleBookmark, useLikeStatus, useBookmarkStatus, useDeletePost } from '@/hooks/use-posts'
```

Inside the component, add the hook:

```typescript
const communityQuery = useCommunityPosts()
```

Update the `activeQuery` line to include communities:

```typescript
const activeQuery = activeTab === 'following' ? followingQuery : activeTab === 'trending' ? trendingQuery : activeTab === 'communities' ? communityQuery : feedQuery
```

- [ ] **Step 5: Update the communities tab empty state**

Replace the communities tab placeholder (around line 206-213) with the same post feed pattern, but with a different empty state:

```tsx
{activeTab === 'communities' ? (
  communityQuery.isLoading ? (
    <div className="divide-y divide-border">
      {[1, 2, 3].map((i) => (
        <SkeletonPost key={i} />
      ))}
    </div>
  ) : posts.length === 0 ? (
    <div className="p-12 text-center">
      <div className="h-16 w-16 rounded-3xl bg-accent-light flex items-center justify-center mx-auto mb-4">
        <Grid3X3 className="h-8 w-8 text-accent" />
      </div>
      <p className="text-text-primary font-semibold mb-1">No community posts yet</p>
      <p className="text-text-tertiary text-sm">Join communities to see posts from them here.</p>
    </div>
  ) : (
    <div className="divide-y divide-border" aria-live="polite">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          postId={post.id}
          isOwnPost={post.user_id === user?.id}
          author={post.user}
          content={post.content}
          images={post.images}
          videoUrl={post.video_url}
          linkPreview={post.link_preview}
          timestamp={post.created_at}
          likes={post.likes_count}
          comments={post.comments_count}
          liked={!!likedMap?.[post.id]}
          saved={!!bookmarkedMap?.[post.id]}
          onLike={() => handleLike(post.id)}
          onComment={() => {}}
          onShare={() => handleShare(post.id)}
          onSave={() => handleBookmark(post.id)}
          onDelete={() => deletePostMutation.mutate(post.id)}
        />
      ))}
      <div ref={loadMoreRef} className="py-4">
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
          </div>
        )}
      </div>
    </div>
  )
) : isLoading ? (
```

- [ ] **Step 6: Commit**

```bash
git add src/api/posts.ts src/hooks/use-posts.ts src/pages/core/home.tsx
git commit -m "feat: community posts feed — show posts from joined communities"
```

---

## Task 8: Optimize Conversation Queries (N+1 Fix)

**Files:**
- Modify: `src/api/messages.ts:4-57`

**Interfaces:**
- Consumes: `conversation_participants`, `conversations`, `messages`, `profiles` tables
- Produces: Optimized `fetchConversations()` with 3 queries instead of 2N+2

- [ ] **Step 1: Rewrite fetchConversations in messages.ts**

Replace the entire `fetchConversations` function:

```typescript
export async function fetchConversations() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Step 1: Get all conversation IDs the user belongs to (1 query)
  const { data: participations, error: pError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  if (pError) {
    if (pError.code === '42P01' || pError.code === '42501') return []
    throw pError
  }
  if (!participations?.length) return []

  const convIds = participations.map((p) => p.conversation_id)

  // Step 2: Get all conversations with their participants in one query (1 query)
  const { data: conversations, error: cError } = await supabase
    .from('conversations')
    .select(`
      id,
      created_at,
      participants:conversation_participants(
        user:profiles!conversation_participants_user_id_fkey(id, name, username, avatar)
      )
    `)
    .in('id', convIds)
    .order('created_at', { ascending: false })

  if (cError) {
    if (cError.code === '42P01') return []
    throw cError
  }

  // Step 3: Get last message for each conversation in one batch (1 query)
  const { data: lastMessages } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })

  // Group last messages by conversation_id (take first per conversation)
  const lastMsgMap = new Map<string, Message>()
  lastMessages?.forEach((msg) => {
    if (!lastMsgMap.has(msg.conversation_id)) {
      lastMsgMap.set(msg.conversation_id, msg as Message)
    }
  })

  // Build results
  const results: Conversation[] = (conversations || []).map((conv: any) => ({
    id: conv.id,
    participants: (conv.participants || [])
      .map((p: any) => p.user)
      .filter((u: any) => u && u.id !== user.id),
    lastMessage: lastMsgMap.get(conv.id),
    updatedAt: conv.created_at,
  }))

  return results
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/messages.ts
git commit -m "perf: optimize fetchConversations — 3 queries instead of 2N+2"
```

---

## Task 9: Verify Build

**Files:**
- None (verification only)

- [ ] **Step 1: Run TypeScript build check**

```bash
npx tsc -b
```

Expected: No errors

- [ ] **Step 2: Run linter**

```bash
npx oxlint
```

Expected: No new errors

- [ ] **Step 3: Run dev server smoke test**

```bash
npm run dev
```

Open browser, verify:
- Settings pages load and save correctly
- Comment delete button appears on own comments
- Communities tab shows posts (or empty state if no joined communities)
- Conversation list loads without lag

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address build/lint issues from bugfix batch"
```

---

## Execution Notes

- **User must run `supabase/complete-migration.sql`** in Supabase SQL Editor after Task 1
- All tasks are independent and can be parallelized except Task 9 (depends on all others)
- Tasks 2-8 can be done in any order after Task 1
- Total estimated time: 30-45 minutes
