# Tech Stack Decisions

**Date:** 2026-04-05
**Status:** Final for v1.

## The Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | Expo Router + React Native Web | ~80-90% shared code across web + mobile. File-based routing. Single repo. |
| **Styling** | NativeWind v4 (Tailwind) | Atomic CSS on web (not inline styles). Fast iteration. Tailwind ecosystem. |
| **Backend** | Supabase (free tier) | Postgres, auth, storage, realtime — all pre-wired. $0/mo. |
| **Database** | Postgres (via Supabase) | Relational model maps perfectly. JSONB for flexible fields. Full-text search built in. |
| **Hosting (web)** | Vercel or EAS Hosting (free) | Expo Router adapter. Free for personal projects. |
| **Mobile** | PWA first, native later | Skip $99/yr Apple + $25 Google fees until there are real users. |
| **Language** | TypeScript | Type safety across frontend and API layer. |
| **Testing** | Jest + Testing Library | Expo default. |

## Why Not the Alternatives

| Rejected | Reason |
|---|---|
| **Solito (Next.js + RN)** | Two build systems, more complexity. Not justified for a solo personal project. |
| **Tamagui** | Powerful but high setup complexity. NativeWind is simpler for fast iteration. |
| **Firebase/Firestore** | Document model is a poor fit for relational Work → Production data. No native text search. Per-read billing punishes browsing. |
| **PocketBase** | Good alternative if you want self-hosting. SQLite works at single-user scale. Pick this if you value owning infrastructure over convenience. |
| **Custom backend** | Full control but delays shipping. Right choice if you outgrow Supabase. |

## Hosting Cost

| Setup | Monthly Cost | Notes |
|---|---|---|
| Expo web + Supabase free | **$0** | Ping Supabase every 5 days to prevent inactivity pause |
| + Google Play | +$25 one-time | Easy decision when ready |
| + Apple App Store | +$99/year | Only when PWA limitations matter (push notifications) |
| Supabase Pro (when needed) | $25/mo | No pausing, 8 GB database |

## Supabase Free Tier Limits

- 500 MB database (a theatre log with thousands of entries uses <50 MB)
- 1 GB file storage
- Pauses after 7 days of inactivity → solve with a cron ping (GitHub Actions)

## Key Database Features Used

| Feature | What For |
|---|---|
| Foreign keys | Work → Production → LogEntry relationships |
| JSONB | `creators`, `cast_members`, `external_ids` (flexible, queryable) |
| `text[]` arrays | `tags` on log entries, `genre` on works |
| `tsvector` + GIN index | Full-text search on works (title, description) |
| Row-Level Security | Private log entries enforced at DB level |
| `numeric(2,1)` + CHECK | Half-star rating (0.5-5.0) |

## Source

See `docs/research/track3-tech-evaluation.md` for full evaluation.
