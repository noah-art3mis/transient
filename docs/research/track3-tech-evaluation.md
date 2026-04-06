# Track 3: Tech Stack Evaluation

**Date:** 2026-04-05
**Purpose:** Evaluate frontend, backend, database, and hosting options for Transient — a personal theatre logging app with web + mobile targets.

**Prerequisite reading:** `docs/2026-04-05-platform-research.md` (sections 5–7) for proven stacks from Letterboxd, StoryGraph, BookWyrm, NeoDB. This document builds on that, not over it. Focus here is on Expo/React Native web+mobile and backend-as-a-service options suitable for a personal project.

---

## Table of Contents

1. [Frontend: React Native + Expo for Web + Mobile](#1-frontend-react-native--expo-for-web--mobile)
2. [Cross-Platform UI Libraries](#2-cross-platform-ui-libraries)
3. [Backend Options](#3-backend-options)
4. [Database Modeling](#4-database-modeling)
5. [Hosting and Cost](#5-hosting-and-cost)
6. [Comparison Tables](#6-comparison-tables)
7. [Recommendation](#7-recommendation)

---

## 1. Frontend: React Native + Expo for Web + Mobile

### 1.1 Current State of Expo for Web (April 2026)

Expo's web story has matured significantly through SDK 52–55. The headline: you can ship a usable web app and a mobile app from one codebase, but the web experience requires deliberate effort and the feature parity gap between mobile-first and web is real.

**What works:**

- **Expo Router** (currently v5/v6 depending on SDK) provides file-based routing across iOS, Android, and web. Navigation, deep links, and URL-based routing all work on web. This is the biggest change from earlier Expo — routing is now a first-class cross-platform concern, not an afterthought.
- **Static rendering** is stable and production-ready. Pages are pre-rendered to HTML at build time, enabling SEO and fast initial load. This works well for content-heavy pages (work detail, production detail, public profiles).
- **Server rendering (SSR)** shipped in alpha in SDK 55. Not yet production-grade. Data loaders (a `useLoaderData` pattern similar to Remix) are experimental alongside it.
- **React Server Components** support was introduced as a developer preview. Marked experimental/beta as of SDK 55; the API will stabilize over subsequent releases.
- **DOM components** (`'use dom'` directive, introduced SDK 52): lets you drop a web-only component as a mini webview inside a native app. Useful for edge cases (rich text editors, web-only maps) without forking the codebase.
- **EAS Hosting** (Expo's own deployment service) supports web deployments directly, with adapters for Vercel, Netlify, and Cloudflare Workers.
- **New Architecture** is on by default from SDK 55 (React Native 0.83), which improves perf and eliminates a category of legacy layout bugs.

**What doesn't work / known gaps:**

- **Native modules**: Any third-party library using native code (Java/Swift/ObjC) doesn't run on web. You need web-compatible alternatives or platform-conditional imports. This is manageable for a theatre app (no camera, no biometrics, no Bluetooth).
- **SEO for dynamic content**: Static rendering handles build-time content well. For user-generated content (log entries, reviews), you need SSR (still experimental) or accept that those pages won't be indexed — acceptable for a personal-use app.
- **Layout quirks**: React Native's Flexbox implementation is close but not identical to CSS Flexbox. Complex web layouts (multi-column, CSS Grid) need workarounds or platform-specific files.
- **Bundle size**: React Native for Web ships significant JavaScript. Lazy loading and code splitting are essential. Expo Router v5 improves this with tree-shaking, but a lean React/Next.js app will still outperform on initial load.
- **CSS-in-JS performance**: React Native's style system on web compiles to inline styles by default. Libraries like Tamagui or NativeWind address this with at-build-time CSS generation.
- **Accessibility**: RN's accessibility model maps to ARIA on web, but requires explicit `accessibilityRole` and `accessibilityLabel` props. A web-first dev would get this for free from semantic HTML.

**Verdict on shipping web + mobile from one codebase:**
Yes, you can. The mental model is: write in React Native, use Expo Router for navigation, pick a cross-platform UI library, and handle the roughly 10–20% of cases where you need `.web.tsx` / `.native.tsx` platform splits. For a personal theatre logging app with no exotic native APIs, this is entirely feasible. The web result won't be as refined as a purpose-built Next.js app out of the box, but it's a reasonable trade-off for solo development.

### 1.2 Solito (React Native + Next.js)

Solito 5 (released October 2025) is actively maintained and takes a different approach: Next.js for web (full React DOM, full Next.js features including mature SSR/RSC), React Native for mobile, unified navigation via a thin wrapper over React Navigation and Next.js Router.

- **Web outcome**: Full Next.js — not React Native for Web. This means better web perf, better SEO, no layout compromises on web, access to the full Next.js ecosystem.
- **Mobile outcome**: Standard React Native + React Navigation.
- **Trade-off**: You're not sharing rendering, just navigation and business logic. UI components that need platform splits require `.native.tsx` / `index.tsx` pairs. The DX is more complex than Expo Router.
- **When Solito makes sense**: When the web product needs to be production-grade with no concessions (marketing site, SEO-heavy public pages) AND you want a native app with React Native.

For Transient at MVP, the extra complexity of Solito is unlikely to pay off. Expo Router is the simpler path.

---

## 2. Cross-Platform UI Libraries

### 2.1 Tamagui

Tamagui is the most comprehensive cross-platform UI option for React Native + web in 2026. It consists of three layers: a style system, an optional UI component kit, and an optimizing compiler.

**Architecture:** An optimizing compiler runs at build time and converts styled components to platform-optimized output — atomic CSS classes on web, hoisted style objects on React Native. This largely solves the "RN styles compile to inline styles on web" performance problem.

**What you get:**

- Universal components that render correctly on iOS, Android, and web without platform splits
- A large typed superset of the React Native style API (adds gap, aspectRatio, etc.)
- A component library (Button, Input, Card, Dialog, etc.) with theming
- ~24KB core with no external dependencies
- Dark mode, animations, accessible focus management

**Limitations:**

- Steep learning curve. The compiler and theme system have significant configuration surface area.
- The component library is opinionated; customizing deeply can fight the framework.
- Community is smaller than NativeWind; fewer tutorials and examples.
- Compiler bugs are real — complex conditional styling can occasionally produce unexpected output.

### 2.2 NativeWind (v4/v5)

NativeWind brings Tailwind CSS utility classes to React Native. On web, it compiles to standard Tailwind CSS (not inline styles), which means near-zero performance overhead. On native, it uses a custom style resolver.

**What you get:**

- Familiar Tailwind syntax (`className="flex flex-col p-4 text-sm"`)
- Web: proper atomic CSS, fast
- Native: Tailwind classes compiled to React Native StyleSheet objects
- Smaller mental surface area than Tamagui — no compiler config, no theme system to learn
- Good interop with any React Native component

**Limitations:**

- Tailwind's design system (spacing scale, color palette) is web-native. Some values don't translate cleanly to mobile (rem units, certain pseudo-classes).
- No bundled component library — you're styling raw RN primitives or community components.
- More manual work to build consistent UI than Tamagui's component kit.
- v5 migration from v4 has breaking changes; the ecosystem is still settling.

### 2.3 React Native Paper

A Material Design 3 component library for React Native. Web support via React Native for Web.

- Best-in-class accessible components, good documentation, stable API.
- Web output is functional but Material Design aesthetic may not match the desired product feel.
- Not optimized for web — you get React Native for Web's inline style output, not CSS.
- No Tailwind-style utility API; purely component-driven.

### 2.4 Summary

| Library                | Web CSS output        | Component kit           | Learning curve             | Best for                                                    |
| ---------------------- | --------------------- | ----------------------- | -------------------------- | ----------------------------------------------------------- |
| **Tamagui**            | Atomic CSS (compiler) | Yes, comprehensive      | High                       | Polished cross-platform product, willing to invest in setup |
| **NativeWind v4+**     | Atomic CSS (Tailwind) | No (you bring your own) | Low (if you know Tailwind) | Tailwind-familiar devs, fast iteration                      |
| **React Native Paper** | Inline styles (RNWeb) | Yes, Material Design 3  | Low                        | Material Design apps, native-first                          |
| **Unistyles**          | Inline styles (RNWeb) | No                      | Medium                     | Pure styling API without component opinions                 |

**For Transient:** NativeWind is the pragmatic choice at MVP. Tailwind is ubiquitous, well-documented, and fast to iterate with. If the web product later needs more polish, migrating to Tamagui or adding a custom design system layer is feasible. Tamagui is the right choice if you're committed to investing in design from day one.

---

## 3. Backend Options

### 3.1 Supabase

Supabase is a hosted Postgres-as-a-backend with auto-generated REST and GraphQL APIs, real-time subscriptions, auth, and file storage. It is the closest thing to a managed backend for relational data in the BaaS space.

**Free tier (2026):**

- 500 MB database storage
- 1 GB file storage
- 50,000 monthly active users (auth)
- 5 GB + 5 GB bandwidth (10 GB total)
- API calls: unlimited (bounded by storage/bandwidth)
- **Projects pause after 7 days of inactivity** — this is the main operational gotcha. You must hit the project at least weekly, or keep it active with a cron ping.

**Postgres underneath:** This is the key differentiator. Supabase gives you a real Postgres instance. The Work → Production relational model maps cleanly: foreign keys, joins, JSONB for `external_ids` and `cast` arrays, full-text search via `tsvector`. You can write raw SQL migrations, use Postgres functions/triggers, and model exactly what the data model requires.

**What's included:**

- Row-level security (RLS) policies — you can enforce "only the owner can write their log entries" at the database level, not just application code.
- Realtime: WebSocket subscriptions on row changes. Useful if you want a live feed of friends' log entries.
- Storage: Poster images, user avatars.
- Auth: Email/password, OAuth (Google, Apple, GitHub). JWT-based.
- Edge Functions (Deno): For webhook handling, custom business logic.

**Self-hosting:** Official Docker Compose setup spins up the full stack (Postgres, PostgREST, GoTrue, Realtime, Storage, Studio). Requires ~4GB RAM minimum; ~8GB for anything beyond minimal. Non-trivial to maintain (15+ Docker containers). The self-hosting story is improving but is still considerably more complex than running a single PocketBase binary.

**Concerns:**

- Free tier pausing is a real operational problem for a personal project. Workaround: a cron job that pings the API every 5 days.
- Vendor dependency: Supabase wraps Postgres with PostgREST (REST) and Hasura-style GraphQL. If you outgrow the BaaS layer, migrating means rebuilding your API layer, though the underlying Postgres data is fully portable.
- At personal-project scale, Supabase's free tier is almost certainly sufficient for years of single-user logging.

### 3.2 PocketBase

PocketBase is a single Go binary that bundles SQLite, a REST API, auth, file storage, and a web-based admin dashboard. No Docker, no configuration, no infrastructure complexity.

**Self-hosting model:** Deploy the binary to any VPS. The database is a single `.db` file. Backup = copy the file. The entire app stack is one process.

**What's included:**

- SQLite-backed persistent storage (collections = tables)
- Auto-generated REST API from collection schemas
- Real-time subscriptions via SSE
- Auth (email/password, OAuth via providers)
- File storage (local filesystem or S3-compatible)
- Admin dashboard at `/pb_admin`
- JavaScript SDK (PocketBase JS) — works in browsers and Node

**Limitations:**

- **SQLite means single-writer.** SQLite handles concurrent reads fine but serializes all writes. For a personal app with one user, this is not a constraint. If you ever want multi-user or high write throughput, SQLite is a ceiling. PocketBase is explicit about this.
- **No native JSONB operators.** SQLite's JSON support is functional but less powerful than Postgres JSONB. Complex queries across `cast` arrays or `external_ids` are harder.
- **Schema migrations are manual.** PocketBase doesn't have a migration system comparable to Postgres migrations. Schema changes through the admin UI are reflected in Go code if you use it as a framework, but it's less structured.
- **Smaller ecosystem.** Fewer tutorials, fewer integrations, no managed hosting (you self-host or use Railway/Fly one-click deploys, but there's no PocketBase Cloud).
- **Go knowledge needed for extension.** If you need custom business logic beyond REST hooks, you write Go. If you're a TypeScript-only developer, this adds friction.

**For a personal project:** PocketBase is arguably the most friction-free path to a working backend. One binary, one file, deploy to a $4/mo VPS, done. The SQLite ceiling is not a real concern at single-user scale.

### 3.3 Firebase / Firestore

Firebase is Google's mobile/web BaaS. Firestore is its primary NoSQL document database.

**Free tier (Spark plan, 2026):**

- 1 GB stored data
- 50,000 document reads/day
- 20,000 document writes/day
- 20,000 deletes/day
- If monthly quota exceeded, the product is shut off for the rest of the billing cycle

**The relational data problem:**
Firestore is a document database. It does not have joins. Querying across the Work → Production → LogEntry hierarchy requires either:

1. **Denormalization:** Embed production data inside LogEntry documents. This avoids joins but creates update anomalies — if a Production record changes (venue corrected, dates updated), every embedded copy must be updated.
2. **Multiple round-trips:** Query LogEntries, then for each unique production_id, query Productions. N+1 problem; expensive against Firestore's per-read billing.
3. **Firestore collection group queries:** Can query across all `log_entries` subcollections, but requires structuring data in a Firestore-specific hierarchy that makes reasoning harder.

None of these patterns are as clean as a Postgres foreign key. For data that is fundamentally relational — and the Work → Production model is clearly relational — Firestore adds significant complexity and per-read cost to work around what it wasn't designed for.

**Vendor lock-in:** Firebase APIs are Google-proprietary. Migrating away means rewriting all queries and data access patterns, not just changing a connection string. The data is exportable (Firestore export to Cloud Storage) but the query model doesn't transfer.

**Verdict:** Firebase/Firestore is a poor fit for the Work → Production relational model. The daily read/write quotas are also unexpectedly restrictive — a user browsing their diary and refreshing production pages could hit the 50,000 read limit in a day at scale. Avoid.

### 3.4 Custom Backend (Express/Fastify + Postgres)

Building a custom backend gives full control but adds setup and maintenance overhead.

**Stack options:**

- **Fastify + Drizzle ORM + Postgres** — TypeScript-native, fast, good type safety. Drizzle generates typed SQL queries, has a migration system, and doesn't abstract away Postgres.
- **Hono + Postgres** — lightweight, edge-deployable, TypeScript.
- **tRPC + Prisma + Postgres** — full type safety end-to-end (server → client), good for a TypeScript monorepo where frontend and backend share types.

**Pros:**

- Full control over API design, caching, business logic
- No BaaS constraints (no row count limits, no free-tier pausing, no opaque pricing)
- Portable: Postgres is Postgres anywhere
- Can use Postgres features directly: row-level security, triggers, full-text search, pg_vector if recommendations are added later

**Cons:**

- More setup work: auth system, file storage, deployment pipeline, database migrations, monitoring
- Auth from scratch (or integrate a library like Lucia, Auth.js, or a managed auth service like Clerk)
- File storage from scratch (or S3/R2/Backblaze)
- Ongoing maintenance: security patches, dependency updates, infrastructure ops
- For one developer building a personal app, this is a meaningful ongoing time cost

**Hosting (see Section 5 for detail):**

- Railway or Fly.io for custom backend: ~$5–15/month for a small instance
- A Postgres instance (Neon, Supabase Postgres standalone, or Railway's Postgres add-on): ~$0–10/month at personal-project scale

---

## 4. Database Modeling

The candidate data model from `track1-data-model-precedents.md` (Model A, refined):

```
Work
  id, title, creators (JSONB array of {person, role}), year_written,
  creation_method (scripted/devised/other), genre (text[]),
  description, adapted_from (FK → Work, nullable),
  external_ids (JSONB: wikidata_qid, mbid, theatricalia_id, ibdb_id)

Production
  id, work_id (FK → Work, nullable), title_override,
  company, venue, director (text or FK → Person),
  cast (JSONB array of {person, role}),
  year, start_date, end_date,
  poster (image ref), is_touring (boolean),
  external_ids (JSONB)

LogEntry
  id, production_id (FK → Production), user_id (FK → User),
  date_seen (date), rating (numeric 0.5–5.0, nullable),
  review (text, optional), liked (boolean),
  tags (text[]), rewatch (boolean)
```

Query patterns that matter:

- "All productions of a work" → `SELECT * FROM productions WHERE work_id = $1`
- "My diary sorted by date" → `SELECT * FROM log_entries WHERE user_id = $1 ORDER BY date_seen DESC`
- "Search works by playwright" → Full-text search on `creators` JSONB or a separate indexed column
- "Most-logged productions" → `SELECT production_id, COUNT(*) FROM log_entries GROUP BY production_id ORDER BY COUNT(*) DESC`

### 4.1 Postgres (Supabase or Custom)

This is the natural fit. Every aspect of the model maps directly:

```sql
-- Works
CREATE TABLE works (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  creators    jsonb,           -- [{person: "Sondheim", role: "music"}]
  year_written int,
  creation_method text CHECK (creation_method IN ('scripted','devised','other')),
  genre       text[],
  description text,
  adapted_from uuid REFERENCES works(id),
  external_ids jsonb            -- {wikidata_qid: "Q...", mbid: "..."}
);

-- Productions
CREATE TABLE productions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id      uuid REFERENCES works(id),
  title_override text,
  company      text,
  venue        text,
  director     text,
  cast         jsonb,           -- [{person: "...", role: "Sweeney Todd"}]
  year         int,
  start_date   date,
  end_date     date,
  poster       text,            -- storage path
  is_touring   boolean DEFAULT false,
  external_ids jsonb
);

-- Log entries
CREATE TABLE log_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES productions(id),
  user_id      uuid NOT NULL REFERENCES auth.users(id),
  date_seen    date,
  rating       numeric(3,1) CHECK (rating BETWEEN 0.5 AND 5.0),
  review       text,
  liked        boolean DEFAULT false,
  tags         text[],
  rewatch      boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

-- Indexes for key query patterns
CREATE INDEX ON productions(work_id);
CREATE INDEX ON log_entries(user_id, date_seen DESC);
CREATE INDEX ON log_entries(production_id);

-- Full-text search on works
ALTER TABLE works ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || coalesce(description, ''))
  ) STORED;
CREATE INDEX ON works USING GIN (search_vector);
```

All four key query patterns are single fast queries. The JSONB fields (`creators`, `cast`, `external_ids`) are indexed if needed with GIN indexes. Row-level security on `log_entries` (`user_id = auth.uid()`) keeps data private with zero application-layer enforcement needed.

**Assessment:** Postgres is the ideal database for this model. Clean foreign keys, JSONB for flexible arrays, array types for tags and genres, full-text search built in.

### 4.2 SQLite (PocketBase)

SQLite supports the core schema well. Differences from Postgres:

- **No native array type.** `genre text[]` becomes `genre TEXT` storing a JSON-encoded array, or a separate `work_genres` join table. PocketBase handles this via "select" field types that store as JSON.
- **JSON support exists** (`json_extract`, `json_each`) but is less ergonomic than Postgres JSONB. Querying `creators` for a specific playwright requires `json_each` table-valued functions.
- **No `tsvector` / full-text search built-in.** SQLite has FTS5 (full-text search extension) which is excellent — you create a virtual table and trigger-sync it. Works well but requires more setup than Postgres's generated column approach.
- **Foreign keys must be explicitly enabled** (`PRAGMA foreign_keys = ON`). PocketBase handles this.
- **No `uuid` type natively** — stored as TEXT. PocketBase uses its own ID format (15-char alphanumeric string).

```sql
-- Approximate SQLite representation (PocketBase manages schema via admin UI)
CREATE TABLE works (
  id           TEXT PRIMARY KEY,  -- PocketBase IDs
  title        TEXT NOT NULL,
  creators     TEXT,              -- JSON-encoded array
  year_written INTEGER,
  creation_method TEXT,
  genre        TEXT,              -- JSON-encoded array
  description  TEXT,
  adapted_from TEXT REFERENCES works(id),
  external_ids TEXT               -- JSON-encoded object
);
-- FTS5 virtual table for search
CREATE VIRTUAL TABLE works_fts USING fts5(title, description, content=works, content_rowid=rowid);
```

Key query patterns all work. The four query patterns above translate directly to SQLite with minor syntax differences. For a personal project at single-user scale, SQLite performance is indistinguishable from Postgres.

**Assessment:** SQLite (via PocketBase) works well for this model. Minor ergonomic friction on JSON querying and arrays, no native array type, but nothing that blocks the data model. For a personal app where the developer is the sole user, SQLite's single-writer limitation is not a concern.

### 4.3 Firestore

Firestore is a non-relational document store. Attempting the Work → Production → LogEntry model:

**Option 1: Collections**

```
/works/{work_id}          — Work document
/productions/{prod_id}    — Production document, work_id as field
/log_entries/{entry_id}   — LogEntry document, production_id as field
```

Querying "all productions of a work": `collection('productions').where('work_id', '==', workId)` — this works but requires a composite index and costs 1 read per production document returned.

Querying "my diary sorted by date": `collection('log_entries').where('user_id', '==', uid).orderBy('date_seen', 'desc')` — works, requires composite index on (user_id, date_seen).

**Option 2: Subcollections**

```
/works/{work_id}/productions/{prod_id}
/users/{user_id}/log_entries/{entry_id}
```

This is more Firestore-idiomatic but breaks the relationship between log_entries and productions (a log entry needs to reference a production, but they're in different root-level collections or different user subcollections). Joins don't exist; you must fetch the production separately.

**Problems:**

- Every "all productions of this work, with my log entries for each" query requires: one query for productions, then N queries for log entries (one per production). This is expensive and slow.
- Firestore's 50,000 reads/day limit gets consumed faster than expected when each page view fetches multiple documents.
- No aggregate queries natively — "most-logged productions" requires client-side aggregation or a maintained counter field updated on every write.
- "Search works by playwright" is not supported natively — Firestore has no text search. Requires a separate service (Algolia, Typesense, or custom) or full client-side data download.

**Assessment:** Firestore is a poor fit. The data model is relational; Firestore is not. Workarounds are cumbersome, expensive per-read billing makes heavy browsing costly, and no native text search means additional infrastructure complexity.

---

## 5. Hosting and Cost

### 5.1 Web Frontend

**Vercel (Hobby/Free plan):**

- Free for non-commercial personal projects
- Expo Router web output deploys to Vercel with the official adapter
- 100 GB bandwidth/month
- Serverless functions: 10-second timeout on free plan (paid: 5 min)
- **Limitation:** Hobby plan is for non-commercial use. A personal project you don't charge for is fine; if you ever add any monetization, you need the $20/mo Pro plan.
- Cold starts on serverless functions can be 200–500ms

**Netlify (Free plan):**

- Commercially usable on the free tier (important distinction vs. Vercel)
- 100 GB bandwidth/month
- 300 build minutes/month
- 125k serverless function invocations/month
- Works with Expo Router's Netlify adapter
- Slightly more complex to configure than Vercel for Next.js-style apps

**EAS Hosting (Expo's own hosting):**

- Purpose-built for Expo Router web deployments
- Simplest deployment path if already using Expo's toolchain
- Pricing not publicly fixed; check expo.dev for current tiers

**Cloudflare Pages:**

- Unlimited bandwidth on free tier
- Edge-deployed (no cold starts)
- Good for static sites; Edge Functions for dynamic routes
- Expo Router Cloudflare Workers adapter exists

**Verdict:** Vercel or EAS Hosting for the simplest path. Netlify if you want commercial-use flexibility. All three are effectively free at personal-project scale.

### 5.2 Mobile App Deployment

**Apple Developer Program:** $99/year

- Required to distribute on the App Store
- TestFlight included for beta testing (up to 10,000 external testers)
- Required for any iOS distribution, including internal testing on physical devices beyond your own

**Google Play:** $25 one-time

- Permanent account; no annual renewal
- Internal testing tracks are free to use; no public distribution costs

**Is it worth it?**

For a personal project used primarily by one person, the friction-free answer is: **start web-only and skip both fees entirely.** Expo Router's web output is a Progressive Web App (PWA) that can be "installed" on iOS and Android from the browser, giving a home-screen icon and offline capability without App Store distribution.

If you want native app distribution (App Store / Google Play):

- Google Play at $25 is a no-brainer for long-term access to Android distribution.
- Apple's $99/year is a real recurring cost for a personal project you don't monetize. At $99/year, over 3 years that's $297 just to distribute an app to yourself. PWA on iOS Safari is a reasonable alternative unless you need notifications or native APIs that require store distribution.

**Practical recommendation:** Ship web first (free). Use PWA for mobile initially. Add native app store distribution only when you have users beyond yourself who want it.

### 5.3 Supabase (Database + Backend)

**Free tier:** Sufficient for a single-user personal app for years.

- 500 MB database: a personal theatre log with thousands of productions and log entries will use under 50 MB.
- 1 GB file storage: posters and avatars at small scale.
- **The inactivity pause is the main operational gotcha.** Solution: deploy a simple cron job (GitHub Actions on a schedule, or Cloudflare Worker) that pings `https://your-project.supabase.co/rest/v1/` every 5 days.
- When you're ready to go beyond free, Supabase Pro is $25/month, which includes unlimited projects, no pausing, and 8 GB database.

### 5.4 PocketBase (Self-Hosted)

**Cost:** VPS cost only.

| Provider               | Specs                             | Monthly Cost                    |
| ---------------------- | --------------------------------- | ------------------------------- |
| Hetzner CAX11          | 2 vCPU (ARM), 4 GB RAM, 40 GB SSD | ~€4.51 (~$5)                    |
| Hetzner CX22           | 2 vCPU, 4 GB RAM, 40 GB SSD       | ~€4.35 (~$5)                    |
| DigitalOcean Basic     | 1 vCPU, 1 GB RAM, 25 GB SSD       | $6                              |
| Fly.io (shared-cpu-1x) | Shared CPU, 256 MB RAM            | Free (up to 3 VMs on free plan) |
| Railway (Dev plan)     | Usage-based; minimal idle cost    | ~$5                             |

A PocketBase binary on a $5/mo Hetzner VPS is a complete self-hosted backend for a personal project. Fly.io's free tier (3 shared VMs) can host PocketBase at zero cost, though the shared CPU and 256 MB RAM require the SQLite WAL-mode configuration to be lean.

**Self-hosting effort:** Non-trivial the first time, then minimal. You need: a VPS, a domain, nginx reverse proxy, SSL (Let's Encrypt via Certbot), and optionally a daily `sqlite3 .backup` cron. Total setup: 2–4 hours. Ongoing: near zero.

### 5.5 Custom Backend (Express/Fastify + Postgres)

If building a custom backend:

| Component       | Option                  | Cost                            |
| --------------- | ----------------------- | ------------------------------- |
| Backend compute | Fly.io shared-cpu-1x    | ~$0–5/mo                        |
| Backend compute | Railway Dev             | ~$5/mo                          |
| Postgres        | Neon free tier          | $0 (0.5 GB, unlimited branches) |
| Postgres        | Supabase Postgres only  | $0 (free project)               |
| Postgres        | Railway Postgres add-on | ~$5/mo                          |
| File storage    | Cloudflare R2           | $0 (10 GB free tier)            |
| Auth            | Lucia (self-managed)    | $0                              |
| Auth            | Clerk (managed)         | $0 up to 10,000 MAU             |

For a personal project, a custom backend can be run for $0–10/month, but with meaningfully more setup time than Supabase or PocketBase.

### 5.6 Cost Summary

| Setup                                           | Monthly Cost  | Notes                                         |
| ----------------------------------------------- | ------------- | --------------------------------------------- |
| Expo web + Supabase free                        | $0            | Inactivity pause caveat; cron ping workaround |
| Expo web + PocketBase on Fly.io free            | $0            | Fly.io's 3 free VMs; 256 MB RAM is tight      |
| Expo web + PocketBase on Hetzner VPS            | ~$5           | Best value for self-hosting                   |
| Expo web + custom backend on Fly/Railway + Neon | ~$5–10        | Most control, most setup                      |
| Native iOS distribution                         | +$99/year     | Apple Developer Program                       |
| Native Android distribution                     | +$25 one-time | Google Play                                   |

---

## 6. Comparison Tables

### Frontend Framework

| Option                    | Web quality        | Mobile quality | Shared code          | Complexity  | Verdict                                 |
| ------------------------- | ------------------ | -------------- | -------------------- | ----------- | --------------------------------------- |
| **Expo Router + RNWeb**   | Good (some quirks) | Excellent      | ~80–90%              | Low         | Best for MVP, one-repo simplicity       |
| **Solito (Next.js + RN)** | Excellent          | Excellent      | ~60–70% (logic only) | Medium-high | Best web quality, more repos/complexity |
| **Expo web only**         | Good               | —              | N/A                  | Very low    | If mobile is later/optional             |
| **Next.js only**          | Excellent          | —              | N/A                  | Low         | If you accept web-only MVP              |

### UI Library

| Library                | Web CSS               | Components      | Tailwind-compatible  | Complexity | Verdict                          |
| ---------------------- | --------------------- | --------------- | -------------------- | ---------- | -------------------------------- |
| **NativeWind v4+**     | Atomic CSS            | No (primitives) | Yes (it IS Tailwind) | Low        | Best for fast iteration          |
| **Tamagui**            | Atomic CSS (compiler) | Yes (full kit)  | No                   | High       | Best for polished product        |
| **React Native Paper** | Inline styles         | Yes (Material)  | No                   | Low        | Fine if you want Material Design |

### Backend

| Option                        | Database          | Auth            | Storage | Realtime  | Cost (free)       | Relational fit | Self-host         |
| ----------------------------- | ----------------- | --------------- | ------- | --------- | ----------------- | -------------- | ----------------- |
| **Supabase**                  | Postgres          | Yes (JWT/OAuth) | Yes     | Yes       | $0 (pause caveat) | Excellent      | Complex (Docker)  |
| **PocketBase**                | SQLite            | Yes             | Yes     | Yes (SSE) | $0 (VPS cost)     | Good           | Simple (1 binary) |
| **Firebase**                  | Firestore (NoSQL) | Yes             | Yes     | Yes       | $0 (daily limits) | Poor           | No                |
| **Custom (Fastify+Postgres)** | Postgres          | DIY             | DIY     | DIY       | $0–5              | Excellent      | Manual            |

### Database for the Work → Production Model

| Database      | Foreign keys    | Arrays/JSONB      | Full-text search      | Query complexity | Best for               |
| ------------- | --------------- | ----------------- | --------------------- | ---------------- | ---------------------- |
| **Postgres**  | Native          | Excellent (JSONB) | Built-in (tsvector)   | Low              | Any scale; ideal       |
| **SQLite**    | Yes (pragma)    | JSON functions    | FTS5 (excellent)      | Low–medium       | Personal/small scale   |
| **Firestore** | None (emulated) | Documents         | None (external req'd) | High             | Document-oriented data |

---

## 7. Recommendation

### Short version

**Expo Router + NativeWind + Supabase, deployed to Vercel/EAS Hosting, web-first.**

### Rationale

**Frontend:** Expo Router is the right choice for a solo developer building web + mobile. The 80–90% shared code rate means you write once and ship everywhere. NativeWind brings Tailwind's speed of iteration, and the web CSS output is proper atomic classes (not inline styles). Platform splits (`.web.tsx`) handle the 10–20% of cases where the platforms diverge.

The Solito alternative is viable but adds complexity (two build systems, two router paradigms, more coordination overhead) that isn't justified at MVP for a personal project.

**Backend:** Supabase is the optimal balance of capability and zero setup cost. The Work → Production relational model maps exactly to Postgres, with no impedance mismatch. Auth, storage, and realtime come pre-wired. The free tier is more than sufficient for a personal app. The inactivity pause is the one operational concern — solve it with a GitHub Actions cron that pings the project every 5 days.

PocketBase is the compelling alternative if you want true self-sufficiency and minimal infrastructure dependencies. A $5/mo Hetzner VPS running PocketBase is complete freedom from vendor constraints. SQLite's limitations don't matter at single-user scale. Choose PocketBase if: you enjoy self-hosting, you want to own your infrastructure long-term, and you're comfortable with the Go extension model.

Avoid Firebase/Firestore: the document model creates unnecessary friction for a relational data structure, and the daily read/write quotas are unexpectedly punishing for a browsing-heavy app.

A custom backend (Fastify/tRPC + Postgres) is the right choice if you outgrow Supabase or PocketBase, but at MVP it adds setup work that delays shipping.

**Database:** Postgres for relational integrity, JSONB for the semi-structured fields (`creators`, `cast`, `external_ids`), and array types for `genre` and `tags`. Supabase provides this with zero DBA work. The schema from Section 4.1 is the target.

**Hosting:** Web frontend on Vercel (free) or EAS Hosting. Start web-only; skip App Store fees initially. Add a GitHub Actions cron to keep the Supabase project awake. Total monthly cost: $0 until you decide to scale.

**Mobile distribution decision point:** When you have real users who want native apps, add:

- Google Play ($25 one-time) — easy decision
- Apple Developer Program ($99/year) — only worth it when others will use the app, or when PWA limitations become a real problem (primarily: push notifications on iOS require a native app)

### Decision Tree

```
Do you want true self-hosting with no vendor dependency?
├── Yes → PocketBase on Hetzner VPS (~$5/mo)
└── No  → Supabase free tier ($0, cron ping workaround)

Do you want maximum web performance / SEO?
├── Yes, and willing to manage two build systems → Solito (Next.js + RN)
└── No, prefer single repo simplicity → Expo Router

Do you know Tailwind and want fast iteration?
├── Yes → NativeWind
└── No, want a polished component kit → Tamagui (more setup)

Do you need native app distribution?
├── Not yet → PWA via web, skip app store fees
├── Android → Google Play ($25 one-time)
└── iOS → Apple Developer Program ($99/year)
```

### Revised Data Model Target (Postgres/Supabase)

From the analysis in Section 4.1, the recommended schema is production-ready as written. Key decisions confirmed:

- `creators` as JSONB array (not a `playwright` text field) — handles devised work, musicals, collective creation
- `cast` as JSONB array on Production — official/opening-night cast; understudy tracking deferred to review text
- `external_ids` as JSONB on both Work and Production — extensible without migrations as new data sources are identified
- `genre` as `text[]` on Work — Postgres native array, filterable with `@>` operator
- `tags` as `text[]` on LogEntry — same pattern
- LogEntry lives at the Production level (not Performance level) per the MVP recommendation in track1

---

## Sources

- [Expo Router v5 announcement](https://expo.dev/blog/expo-router-v5)
- [Expo Router v55: more native navigation, more powerful web](https://expo.dev/blog/expo-router-v55-more-native-navigation-more-powerful-web)
- [Beta: Universal React Server Components in Expo Router](https://expo.dev/blog/universal-react-server-components-developer-preview)
- [React Native for Web in 2025: One Codebase, All Platforms](https://medium.com/react-native-journal/react-native-for-web-in-2025-one-codebase-all-platforms-b985d8f7db28)
- [NativeWind v4.1 Announcement](https://www.nativewind.dev/blog/announcement-nativewind-v4-1)
- [NativeWind vs Tamagui vs twrnc: React Native Styling in 2026](https://www.pkgpulse.com/blog/nativewind-vs-tamagui-vs-twrnc-react-native-styling-2026)
- [Tamagui](https://tamagui.dev/)
- [Solito 5 is now web-first](https://dev.to/redbar0n/solito-5-is-now-web-first-but-still-unifies-nextjs-and-react-native-2lek)
- [Supabase Pricing 2026](https://uibakery.io/blog/supabase-pricing)
- [Supabase Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)
- [PocketBase — Open Source backend in 1 file](https://pocketbase.io/faq/)
- [What is PocketBase? Features, Limitations, and Use Cases](https://betterstack.com/community/guides/database-platforms/pocketbase-backend/)
- [Firebase Pricing (Spark plan limits)](https://firebase.google.com/docs/firestore/quotas)
- [Vercel Hobby Plan](https://vercel.com/docs/plans/hobby)
- [Netlify Pricing](https://hamsterstack.com/pricing/netlify/)
- [Fly.io vs Railway 2026](https://thesoftwarescout.com/fly-io-vs-railway-2026-which-developer-platform-should-you-deploy-on/)
- [Hetzner Cloud pricing](https://www.hetzner.com/cloud)
- [Apple Developer Program enrollment](https://developer.apple.com/help/account/membership/program-enrollment/)
- [Google Play vs App Store fees](https://splitmetrics.com/blog/google-play-apple-app-store-fees/)
