# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Transient is a theatre-focused personal logging and discovery platform (like Letterboxd for performing arts). Full-stack cross-platform app built with Expo Router + React Native + Supabase.

## Commands

```bash
npm start              # Expo dev server
npm run web            # Web dev server
npm run test           # Jest test suite
npm run test -- --testPathPattern=<pattern>  # Run single test file
npm run lint           # ESLint
npm run lint:fix       # Auto-fix lint issues
npm run typecheck      # TypeScript strict check
npm run format         # Prettier formatting
npm run format:check   # Verify formatting
npm run check          # All checks: lint + typecheck + format + test
```

## Architecture

**Stack:** TypeScript, Expo Router (file-based routing), React Native + React Native Web, NativeWind v4 (Tailwind), Supabase (PostgreSQL + Auth)

### Key directories

- `app/` — Expo Router file-based routes. Groups: `(auth)` for login/signup, `(tabs)` for 5-tab main nav, `log/` for entry CRUD (modal), `production/` for detail views
- `lib/` — Core business logic: `supabase.ts` (client init), `auth-context.tsx` (auth provider + `useAuth()` hook), `types.ts` (all TypeScript types)
- `lib/api/` — Database operations wrapping Supabase queries (works, productions, log-entries, wishlist, stats). Each function throws on error, returns typed data
- `components/` — Reusable UI components (StarRating, TagInput, DiaryEntryRow, etc.)
- `supabase/migrations/` — PostgreSQL schema with RLS policies, GIN indexes for full-text search, JSONB columns

### Data model

**Work** (artistic piece) → **Production** (specific staging) → **LogEntry** (user's viewing record). WishlistItem references either a Work or Production (XOR constraint). Ratings are half-step 0.5–5.0.

### Auth flow

`app/_layout.tsx` wraps everything in `<AuthProvider>`. `AuthGate` checks session state: unauthenticated → `/(auth)/login`, authenticated → `/(tabs)`. Supabase handles tokens with auto-refresh.

### Supabase client

`lib/supabase.ts` depends on React Native modules (`AsyncStorage`, `Platform`, `react-native-url-polyfill`). It cannot be imported from Node scripts. CLI tools and seed scripts must create their own Supabase client directly via `createClient()` from `@supabase/supabase-js`.

### API layer pattern

All `lib/api/*.ts` files follow the same pattern: import supabase client, build query with fluent API, throw on error, return typed data. Row-Level Security enforces access at DB layer.

## Code Style

- **Formatting:** Prettier with double quotes, semicolons, trailing commas, 2-space indent, 100 char width
- **Linting:** ESLint flat config extending `eslint-config-expo` + Prettier. Strict: `eqeqeq`, `prefer-const`, `no-var`, `no-explicit-any`, `no-non-null-assertion`. `console.log` warns (console.warn/error allowed)
- **TypeScript:** Strict mode. Path alias `@/*` maps to project root
- **Styling:** NativeWind (Tailwind classes via `className` prop)

## Testing

- Jest with `jest-expo` preset + React Testing Library
- `__tests__/helpers/supabase-mock.ts` provides chainable mock query builders simulating Supabase's fluent API — this directory is excluded from test detection
- Test files live in `__tests__/` mirroring source structure

## Chrome Integration (Browser Testing)

This repo is developed in WSL. The CLI instance of Claude Code running in WSL **cannot** use the Chrome integration because Chrome runs on the Windows host and native messaging doesn't cross the WSL boundary.

If you are the Claude Code **IDE extension** instance (running on the Windows side via Cursor/VS Code), you **can** use Chrome:

1. Ensure the [Claude in Chrome extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) (v1.0.36+) is installed in Chrome/Edge on Windows
2. Run `/chrome` to connect, or launch with `--chrome`
3. Use `npm run web` to start the Expo web dev server, then navigate to `localhost:8081` (or whichever port Expo assigns) to test the app in the browser
4. You can read console errors, inspect DOM state, test user flows, and verify UI changes directly

## Environment

- Supabase credentials use `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (in `.env.local`)
- Seed scripts (`scripts/seed.ts load`) require `SUPABASE_SERVICE_ROLE_KEY` (in `.env.local`) to bypass RLS
- Never read `.env` or `.env.local` files
