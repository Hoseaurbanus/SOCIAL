# SMUGFLEX

A free social platform where communities thrive and ideas connect. No ads, no subscriptions.

**Live:** [smugflex.com](https://smugflex.com)  
**Docs:** [docs.smugflex.com](https://docs.smugflex.com)  
**Terms:** [smugflex.com/legal/terms-of-service](https://smugflex.com/legal/terms-of-service)  
**Privacy:** [smugflex.com/legal/privacy-policy](https://smugflex.com/legal/privacy-policy)

## Tech Stack

- **React 19** + TypeScript
- **Vite** (build, dev, HMR)
- **Tailwind CSS v4** (design tokens, dark/light themes)
- **React Router v7** (file-based routing with lazy loading)
- **TanStack Query v5** (server state management)
- **Zustand** (client state management)
- **React Hook Form + Zod** (form validation)
- **Framer Motion** (animations)
- **Lucide React** (icons)
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

## Project Structure

```
src/
├── api/            # React Query hooks, Axios interceptors
├── assets/         # Static assets
├── components/
│   ├── atoms/      # Button, Input, Avatar, Badge, Skeleton
│   ├── molecules/  # Card, PostCard, Stories
│   ├── organisms/  # Header, BottomNav
│   └── templates/  # AppLayout, AuthLayout
├── config/         # Axios instance
├── hooks/          # useTheme
├── lib/            # Utilities (cn)
├── pages/
│   ├── auth/       # Welcome, Login, Signup, ForgotPassword, VerifyEmail, Onboarding
│   ├── core/       # Home, Discover, Messages, Notifications, Profile
│   ├── errors/     # NotFound
│   └── social/     # Settings, Privacy, Security
├── stores/         # Zustand (auth, ui)
├── types/          # API types
├── App.tsx
├── index.css       # Tailwind + design tokens
├── main.tsx
└── router.tsx
```

## Design System

- **Font:** Inter (variable weight 100-900)
- **Grid:** 8-point system (4px half-unit)
- **Accent:** Blue (#3B82F6)
- **Themes:** Light / Dark / System (via `prefers-color-scheme`)
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
