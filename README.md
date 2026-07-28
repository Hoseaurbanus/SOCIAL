# SMUGFLEX

A free social platform where communities thrive and ideas connect. No ads, no subscriptions.

**Live:** [social-omega-five.vercel.app](https://social-omega-five.vercel.app)  
**Docs:** [docs.smugflex.com](https://docs.smugflex.com)  
**Terms:** [smugflex.com/legal/terms-of-service](https://smugflex.com/legal/terms-of-service)  
**Privacy:** [smugflex.com/legal/privacy-policy](https://smugflex.com/legal/privacy-policy)

## Tech Stack

- **React 19** + TypeScript
- **Vite** (build, dev, HMR)
- **Tailwind CSS v4** (design tokens, dark/light themes)
- **React Router v7** (lazy-loaded routes, protected routes)
- **TanStack Query v5** (server state, infinite scroll, optimistic updates)
- **Zustand** (client state with localStorage persistence)
- **React Hook Form + Zod** (form validation)
- **Framer Motion** (animations)
- **Lucide React** (icons)
- **Supabase** (auth, database, storage, realtime)
- **Capacitor** (mobile builds)
- **Vite PWA** (service worker, offline support)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

### Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

Run `supabase/fix-rls.sql` in your Supabase SQL Editor to create all tables, RLS policies, and permissions.

## Design System

- **Font:** Inter (variable weight 100-900)
- **Grid:** 8-point system (4px half-unit)
- **Accent:** Blue (#3B82F6)
- **Themes:** Light / Dark / System (via `data-theme` attribute)
- **Breakpoints:** sm 640px, md 1024px, lg 1440px

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | TypeScript compile + Vite production build |
| `npm run preview` | Preview production build locally |
| `npm test` | Run Vitest tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | Run Oxlint (type-aware rules enabled) |

---

## Complete User Flow

### 1. Welcome Page `/`

The landing page for unauthenticated users. Shows the SMUGFLEX logo, tagline, and two CTAs: "Create Account" and "Sign In". Links to Terms of Service and Privacy Policy. Redirects to `/home` if already logged in.

### 2. Sign Up `/signup`

A 3-step signup flow:

1. **Step 1** - Enter your full name
2. **Step 2** - Enter email address (phone signup disabled — requires SMS provider)
3. **Step 3** - Confirmation screen: "Check your inbox!" with a verification code

Sends a 6-digit OTP via Supabase Auth. Step indicator dots show progress. Supports going back between steps.

### 3. Verify `/verify`

6-digit OTP verification page. Receives the code from email, auto-submits when all 6 digits are entered, supports paste. Has a 60-second resend cooldown timer. On success, navigates to `/create-password`.

### 4. Create Password `/create-password`

Set your account password after OTP verification. Features:

- Password input with show/hide toggle
- Confirm password input
- Real-time 5-level password strength meter (Weak / Fair / Good / Strong / Very strong)
- Validates Supabase session exists
- Redirects to `/home` on success

### 5. Onboarding `/onboarding`

A 3-step wizard for new users (each step skippable):

1. **Interests** - Choose from a grid of topic tags
2. **Follow People** - Suggested users from the community with follow buttons
3. **Profile Setup** - Upload a profile photo and write a bio (160 char limit)

### 6. Login `/login`

Email/password login with:

- Email input with icon
- Password input with show/hide toggle
- "Forgot password?" link
- "Continue with Google" OAuth button
- Error alert banner
- Link to sign up

### Forgot Password `/forgot-password`

Enter your email to receive a reset link. Shows a "Check your email" confirmation screen.

### Reset Password `/reset-password`

Set a new password after clicking the reset link from email. Password/confirm fields with show/hide toggles. Redirects to `/home` on success.

---

## Authenticated Pages

All pages below require authentication. The app uses a sticky header (logo, search, notification/messages icons) and a fixed bottom nav on mobile (Home, Discover, Messages, Notifications, Profile).

### 7. Home Feed `/home`

The main feed page with 5 tab filters:

| Tab | Content |
|-----|---------|
| **For You** | All posts ordered by recency |
| **Following** | Posts from followed users only |
| **Communities** | Posts from joined communities |
| **Chronological** | Strict chronological order |
| **Trending** | Posts sorted by likes count |

Features:
- **Stories row** at the top with horizontal scroll (your story + others' stories)
- **Compose prompt** bar ("What's on your mind?")
- **Pull-to-refresh** gesture
- **Infinite scroll** with intersection observer
- **PostCard** actions: like (optimistic), bookmark (optimistic), share (Web Share API + clipboard), delete (own posts), inline comments
- **StoryViewer** full-screen overlay with progress bars, keyboard nav, tap zones
- **ComposeModal** for creating new posts

### 8. Discover `/discover`

Discovery page with 4 tabs:

| Tab | Content |
|-----|---------|
| **Discover** | Trending posts sorted by likes |
| **Trending** | Trending hashtag topics + top posts |
| **People** | Suggested users to follow |
| **Communities** | Browse, join, or create communities |

Features:
- Trending topics as clickable pill badges
- Suggested users with follow/unfollow buttons
- Community cards with icon, name, member count, join/leave button
- Inline community creation form (name, description, emoji icon)

### 9. Messages `/messages`

Conversations inbox with:

- Search/filter conversations
- Conversation list showing avatar, name, last message preview, timestamp
- Real-time updates via Supabase Realtime subscriptions
- "New message" button opens a user search modal to start a conversation

### 10. Conversation `/messages/:conversationId`

Individual chat page with:

- Header with back button, other user's avatar/name/username
- Message bubbles (own messages right-aligned in accent, others left-aligned in tertiary)
- Timestamps on each message
- Auto-scroll to bottom on new messages
- Real-time incoming messages via Supabase Realtime
- Textarea input with send button (Enter to send)
- Marks messages as read on load

### 11. Notifications `/notifications`

Notification feed with infinite scroll. Notification types:

| Type | Icon Color | Example |
|------|-----------|---------|
| Like | Red | "liked your post" |
| Comment | Blue | "commented on your post" |
| Follow | Green | "started following you" |
| Mention | Purple | "mentioned you" |
| Message | Orange | "sent you a message" |

Features:
- "Mark all read" button
- Unread indicator dots
- Color-coded icons per type
- Paginated loading

### 12. Profile `/profile/:username`

User profile page (own or others'). Features:

- **Gradient banner** behind avatar
- **Back button** when viewing other users' profiles
- **Avatar** with border
- **Name**, @username, bio, location, website, join date
- **Follow/Following/Followers counts** (styled as clickable buttons)
- **Follow/Unfollow button** for other users
- **Edit Profile** link to `/settings/account` for own profile
- **4 tabs**: Posts, Replies, Likes, Bookmarks

---

## Settings Pages

Accessed from the profile page or bottom nav.

### 13. Settings Hub `/settings`

Main settings page with sections:

| Section | Items |
|---------|-------|
| **Account** | Edit Profile |
| **Privacy** | Privacy Settings |
| **Security** | Security Settings |
| **Preferences** | Notifications, Appearance |
| **Support** | Help & Support |
| | Log Out |

### 14. Account Settings `/settings/account`

Edit your profile:

- Avatar upload (to Supabase Storage)
- Name, username
- Bio (160 char limit with counter)
- Website, location
- "Save Changes" button

### 15. Privacy `/settings/privacy`

Toggle switches for:

- **Private Account** — Only followers can see your posts (persisted to Supabase)
- **Show Activity Status** — Show when you're online (localStorage)
- **Allow Mentions** — Allow others to mention you (localStorage)

### 16. Security `/settings/security`

- **Change Password** — Expandable form with current/new/confirm password fields
- **Two-Factor Authentication** — Coming soon
- **Active Sessions** — Coming soon

### 17. Notification Settings `/settings/notifications`

Toggle notification channels and types:

| Channel | Types |
|---------|-------|
| Push Notifications | Likes, Comments, New Followers, Messages |
| Email Notifications | Likes, Comments, New Followers, Messages |

### 18. Appearance `/settings/appearance`

Choose theme in a 3-column card grid:

- **Light** (Sun icon)
- **Dark** (Moon icon)
- **System** (Monitor icon — follows OS preference)

Theme persists via Zustand store + localStorage.

### 19. Help & Support `/settings/help`

- Expandable FAQ section (5 common questions)
- Contact email: smugflexventures@gmail.com
- App version: SmugFlex v1.0.0

---

## Error Handling

### 404 Page `/*`

Shown for unmatched routes. Displays "404" in accent color, "Page Not Found" heading, and a "Go Home" button.

---

## Project Structure

```
src/
├── api/                    # Supabase API functions (posts, profile, messages, notifications, communities)
├── assets/                 # Static assets
├── components/
│   ├── atoms/              # Button, Input, Avatar, Badge, Skeleton
│   ├── molecules/          # PostCard, Stories, EmojiPicker
│   ├── organisms/          # Header, BottomNav, ComposeModal, StoryViewer
│   └── templates/          # AppLayout, AuthLayout
├── config/                 # Supabase client initialization
├── hooks/                  # React Query hooks (use-posts, use-profile, use-messages, use-notifications, etc.)
├── lib/                    # Utilities (cn helper)
├── pages/
│   ├── auth/               # Welcome, Login, Signup, Verify, CreatePassword, ForgotPassword, ResetPassword, Onboarding
│   ├── core/               # Home, Discover, Messages, Conversation, Notifications, Profile
│   ├── errors/             # NotFound (404)
│   └── social/             # Settings, AccountSettings, Privacy, Security, NotificationSettings, Appearance, Help
├── stores/                 # Zustand stores (auth-store, ui-store, toast-store)
├── types/                  # TypeScript type definitions (User, Post, Comment, Story, Message, etc.)
├── App.tsx
├── index.css               # Tailwind + design tokens (light/dark themes)
├── main.tsx
└── router.tsx              # All routes with lazy loading
```

## Backend (Supabase)

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (name, username, avatar, bio, location, website, is_private) |
| `posts` | Posts with content, media, like/comment counts |
| `comments` | Post comments |
| `likes` | Post likes (user_id + post_id) |
| `bookmarks` | Saved posts |
| `follows` | Follower/following relationships |
| `stories` | 24-hour expiring stories with media |
| `conversations` | Chat conversations |
| `conversation_participants` | Maps users to conversations |
| `messages` | Chat messages with read status |
| `notifications` | Likes, comments, follows, mentions, messages |
| `communities` | Community groups |
| `community_members` | Maps users to communities |

### RPC Functions

- `increment_likes(post_id)` / `decrement_likes(post_id)`
- `increment_comments(post_id)` / `decrement_comments(post_id)`
- `increment_community_members(community_id)` / `decrement_community_members(community_id)`
- `user_in_conversation(conv_id)` — SECURITY DEFINER helper for RLS

### Storage Buckets

- `avatars` — Profile photos
- `posts` — Post images
- `stories` — Story media

All buckets are public with RLS policies on `storage.objects`.

### Realtime

- **Messages** — Live message delivery via Supabase Realtime channels
- **Conversations** — Live conversation list updates

## Deployment

- **Platform:** Vercel
- **Config:** `vercel.json` with SPA rewrite rules
- **Branch:** `master` → auto-deploys
- **Env vars:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in Vercel dashboard
