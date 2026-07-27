# SMUGFLEX Auth & Onboarding — React Implementation

> **Status:** COMPLETE (React version supersedes original HTML/CSS plan)
> **Last Updated:** 2026-07-27

## Overview

The auth and onboarding flow was originally planned as static HTML/CSS pages (Sub-Spec B). It has been fully implemented as a React 19 application with TypeScript, Tailwind CSS v4, and React Hook Form + Zod validation.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, React Router v7, React Hook Form, Zod, Zustand, Lucide Icons

## Architecture

```
src/
├── components/
│   ├── atoms/
│   │   ├── button.tsx          — Button with variants (primary, secondary, ghost, danger, success)
│   │   ├── input.tsx           — Input with label, error, icon support
│   │   ├── avatar.tsx          — Avatar with initials/image fallback + status indicator
│   │   ├── badge.tsx           — Badge + CountBadge components
│   │   └── skeleton.tsx        — Loading skeleton components
│   ├── molecules/
│   │   ├── card.tsx            — Card compound component
│   │   ├── post-card.tsx       — Social post card with actions
│   │   └── stories.tsx         — Stories carousel
│   ├── organisms/
│   │   ├── header.tsx          — App header with logo, search, notifications
│   │   └── bottom-nav.tsx      — Mobile bottom navigation (5 tabs)
│   ├── templates/
│   │   ├── auth-layout.tsx     — Centered auth page layout
│   │   └── app-layout.tsx      — App layout with header + bottom nav
│   ├── motion.tsx              — Framer Motion animation wrappers
│   └── protected-route.tsx     — Auth guard for protected routes
├── pages/
│   ├── auth/
│   │   ├── welcome.tsx         — Landing page with signup/login options
│   │   ├── login.tsx           — Email/password login form
│   │   ├── signup.tsx          — Multi-step registration form
│   │   ├── forgot-password.tsx — Password reset request
│   │   ├── verify-email.tsx    — Email verification page
│   │   └── onboarding.tsx      — 3-step onboarding wizard
│   ├── core/
│   │   ├── home.tsx            — Home feed with tabs + stories
│   │   ├── discover.tsx        — Discover communities + trending
│   │   ├── messages.tsx        — Message conversations list
│   │   ├── notifications.tsx   — Notification feed
│   │   └── profile.tsx         — User profile with tabs
│   ├── social/
│   │   ├── settings.tsx        — Settings menu
│   │   ├── privacy.tsx         — Privacy settings with toggles
│   │   └── security.tsx        — Security settings
│   └── errors/
│       └── not-found.tsx       — 404 page
├── stores/
│   ├── auth-store.ts           — Zustand auth state (user, token, login/logout)
│   └── ui-store.ts             — Zustand UI state (theme, sidebar)
├── hooks/
│   └── use-theme.ts            — Theme hook with system preference listener
├── api/
│   └── client.ts               — React Query hooks (useApiQuery, useApiMutation)
├── config/
│   └── axios.ts                — Axios instance with auth interceptors
├── types/
│   └── api.ts                  — API response types
├── lib/
│   └── utils.ts                — cn() utility (clsx + tailwind-merge)
├── router.tsx                  — React Router configuration
├── App.tsx                     — Root component with providers
├── main.tsx                    — Entry point
└── index.css                   — Tailwind + design tokens
```

## Auth Flow

```
Welcome → Login → [API] → Home
         Signup → [API] → Onboarding → Home
         Forgot Password → [API] → Verify Email → Login
```

### Routes

| Route | Component | Auth Required |
|-------|-----------|---------------|
| `/` | WelcomePage | No |
| `/login` | LoginPage | No |
| `/signup` | SignupPage | No |
| `/forgot-password` | ForgotPasswordPage | No |
| `/verify-email` | VerifyEmailPage | No |
| `/onboarding` | OnboardingPage | No |
| `/home` | HomePage | Yes |
| `/discover` | DiscoverPage | Yes |
| `/messages` | MessagesPage | Yes |
| `/notifications` | NotificationsPage | Yes |
| `/profile/:username?` | ProfilePage | Yes |
| `/settings` | SettingsPage | Yes |
| `/settings/privacy` | PrivacyPage | Yes |
| `/settings/security` | SecurityPage | Yes |

### Protected Routes

All routes under `/home`, `/discover`, `/messages`, `/notifications`, `/profile`, `/settings` are wrapped with `ProtectedRoute` component that checks `useAuthStore.isAuthenticated`. Unauthenticated users are redirected to `/login`.

## Form Validation

All auth forms use React Hook Form + Zod schemas:

- **Login:** email (valid format), password (min 8 chars)
- **Signup:** name (min 2 chars), email, password (min 8 chars), confirmPassword (must match)
- **Forgot Password:** email (valid format)

## Design Tokens (Blue Accent)

| Token | Light | Dark |
|-------|-------|------|
| accent | #3B82F6 | #60A5FA |
| accent-hover | #2563EB | #3B82F6 |
| accent-active | #1D4ED8 | #2563EB |
| accent-light | #DBEAFE | #1E3A5F |
| accent-dark | #1E40AF | #DBEAFE |

## Components

### Atoms
- **Button** — 5 variants (primary, secondary, ghost, danger, success), 5 sizes (xs-xl), loading state, icon support
- **Input** — Label, error message, icon, aria-describedby for accessibility
- **Avatar** — 6 sizes, image/initials fallback, status indicator (online/offline/away/dnd)
- **Badge** — 6 color variants, 3 sizes
- **Skeleton** — Text, avatar, and card skeleton loaders

### Molecules
- **Card** — Compound component (Card, CardHeader, CardTitle, CardContent, CardFooter)
- **PostCard** — Social post with author, content, actions (like, comment, share, bookmark)
- **Stories** — Horizontal scrolling stories with gradient ring

### Organisms
- **Header** — Sticky header with logo, search (desktop), notification bell, messages
- **BottomNav** — Mobile-only bottom tab navigation (5 tabs)

### Templates
- **AuthLayout** — Centered layout for auth pages
- **AppLayout** — Header + main content + bottom nav

## State Management

### Auth Store (Zustand)
```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}
```

### UI Store (Zustand)
```typescript
interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
}
```

## Accessibility

- All icon-only buttons have `aria-label`
- Form inputs have associated `<label>` elements
- Error messages linked to inputs via `aria-describedby`
- Profile tabs use `role="tablist"` and `aria-selected`
- Skip link CSS defined (`.skip-link`)
- Screen reader utility (`.sr-only`)
- Focus visible styles on all interactive elements

## Responsive Design

- Mobile-first with bottom navigation
- Desktop header with search bar
- Breakpoints: sm (640px), md (1024px), lg (1440px)
- All pages use `max-w-[600px]` for content centering

## Remaining Work

- [ ] Connect auth forms to actual API endpoints
- [ ] Implement Google/Apple social login
- [ ] Add token refresh mechanism
- [ ] Add toast notification system
- [ ] Add loading states with Skeleton components
- [ ] Add Framer Motion page transitions
- [ ] Expand test coverage
- [ ] Add PWA PNG icons (192x192, 512x512)

---

*This plan supersedes the original static HTML/CSS implementation. The React version provides proper state management, form validation, route protection, and a reusable component library.*
