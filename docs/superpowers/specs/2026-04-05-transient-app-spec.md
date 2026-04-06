# Transient: App Specification v1

**Date:** 2026-04-05
**Status:** Final -- approved for implementation.

---

## 1. Product Overview

Transient is a personal theatre logging app -- a Letterboxd for live performance. It lets a user record every show they attend, building a private diary of dated log entries organized around a two-level catalog of Works (the abstract creative concept, like "Hamlet") and Productions (a specific staging at a venue with a director and cast, like "Almeida Theatre, 2025"). The app is designed around a single UX moment: standing on a pavement 60 seconds after a show ends, the user taps +, finds the production, and saves a log entry in under 10 seconds. Everything else -- ratings, reviews, tags, stats -- is optional enrichment that can be added later. The app is private-first, single-user, and has no social features in v1.

---

## 2. Data Model

### 2.1 Entities

Four entities. All IDs are UUIDs. Timestamps use `timestamptz`.

#### Work

The abstract creative concept: a play, musical, opera, dance piece, circus show, or concert. One Work can have many Productions across history.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | uuid PK | Yes | `gen_random_uuid()` | Primary key |
| `title` | text | Yes | -- | Canonical title of the work |
| `original_title` | text | No | null | Non-English original language title |
| `creators` | jsonb | Yes | `'[]'` | Array of `{name: string, role: string}`. Roles: "playwright", "book", "music", "lyrics", "devised by", "conceived by", "choreographer", "composer", "librettist" |
| `year_written` | int | No | null | Year of composition or premiere. Nullable for devised work with no fixed composition year |
| `creation_method` | text | Yes | `'scripted'` | One of: `scripted`, `devised`, `other` |
| `media_type` | text | Yes | `'theatre'` | One of: `theatre`, `musical`, `opera`, `dance`, `circus`, `concert`, `other` |
| `description` | text | No | null | Synopsis or description |
| `adapted_from` | uuid FK | No | null | Self-referential FK to `works(id)` for adaptation chains (e.g., West Side Story points to Romeo and Juliet) |
| `external_ids` | jsonb | Yes | `'{}'` | Cross-reference IDs: `wikidata_qid`, `musicbrainz_mbid`, `theatricalia_play_id`, `ibdb_show_id` |
| `search_vector` | tsvector | Auto | Generated | Full-text search vector generated from `title`, `original_title`, and `description` |
| `created_at` | timestamptz | Yes | `now()` | Row creation timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Last modification timestamp |

#### Production

A specific staging of a Work -- a run at a venue with a director, cast, and dates.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | uuid PK | Yes | `gen_random_uuid()` | Primary key |
| `work_id` | uuid FK | No | null | FK to `works(id)`. Nullable to support devised/new work that has no pre-existing Work entry |
| `title_override` | text | No | null | Billing variant or renamed adaptation. Display logic: show `title_override` if set, otherwise fall through to `works.title` |
| `company` | text | No | null | Theatre company or producing organization |
| `venue` | text | No | null | Venue name (plain text for v1; a `venues` table with geolocation is post-MVP) |
| `director` | text | No | null | Director name (plain text for v1) |
| `cast_members` | jsonb | Yes | `'[]'` | Array of `{name: string, role: string}`. Official/opening-night cast. Named `cast_members` to avoid SQL reserved word collision |
| `year` | int | No | null | Integer year. Redundant with `start_date` but useful when exact dates are unknown |
| `start_date` | date | No | null | Run start date |
| `end_date` | date | No | null | Run end date |
| `poster_url` | text | No | null | Path or URL to poster image in Supabase Storage |
| `is_touring` | boolean | Yes | `false` | Flag for touring productions. A tour with a fixed creative team visiting multiple venues is one Production |
| `external_ids` | jsonb | Yes | `'{}'` | Cross-reference IDs: `wikidata_qid`, `ibdb_production_id` |
| `created_at` | timestamptz | Yes | `now()` | Row creation timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Last modification timestamp |

#### LogEntry

A user's personal record of attending a production.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | uuid PK | Yes | `gen_random_uuid()` | Primary key |
| `production_id` | uuid FK | Yes | -- | FK to `productions(id)`. The log records attending a specific production |
| `user_id` | uuid FK | Yes | -- | FK to `auth.users(id)` (Supabase Auth) |
| `date_seen` | date | Yes | `CURRENT_DATE` | Date attended. Defaults to today for the "pavement moment" |
| `rating` | numeric(2,1) | No | null | Half-star scale: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0. CHECK constraint enforces range and half-star increments |
| `review` | text | No | null | Free text review. Not required at log time; can be added later |
| `is_private` | boolean | Yes | `true` | Private by default. All entries are private in v1 (no public profiles) |
| `liked` | boolean | Yes | `false` | Binary "heart" flag, independent of star rating |
| `tags` | text[] | Yes | `'{}'` | User-defined tags: "world premiere", "with Mum", "standing ovation", "lottery ticket" |
| `is_rewatch` | boolean | Yes | `false` | Whether the user has seen this production before. Multiple log entries per production are allowed |
| `created_at` | timestamptz | Yes | `now()` | Row creation timestamp |
| `updated_at` | timestamptz | Yes | `now()` | Last modification timestamp |

#### WishlistItem

A user's "want to see" list entry. Can target either a Work or a specific Production, but not both.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | uuid PK | Yes | `gen_random_uuid()` | Primary key |
| `user_id` | uuid FK | Yes | -- | FK to `auth.users(id)` |
| `work_id` | uuid FK | No | null | FK to `works(id)`. Set when targeting a Work ("I want to see any production of Hamlet") |
| `production_id` | uuid FK | No | null | FK to `productions(id)`. Set when targeting a specific Production |
| `notes` | text | No | null | Personal notes about why they want to see it |
| `created_at` | timestamptz | Yes | `now()` | Row creation timestamp |

A CHECK constraint enforces that exactly one of `work_id` or `production_id` is non-null.

### 2.2 Relationships

```
User (auth.users)
  |-- 1:N  LogEntry          (user_id FK)
  |-- 1:N  WishlistItem      (user_id FK)

Work
  |-- 1:N  Production        (work_id FK)
  |-- 0:1  Work              (adapted_from FK, self-referential)
  |-- 0:N  WishlistItem      (work_id FK)

Production
  |-- N:1  Work              (work_id FK, nullable)
  |-- 1:N  LogEntry          (production_id FK)
  |-- 0:N  WishlistItem      (production_id FK)
```

### 2.3 Minimum Fields to Create Each Entity

| Entity | Required fields for creation | Everything else |
|---|---|---|
| Work | `title` | Optional. `creators` defaults to `[]`, `creation_method` to `'scripted'`, `media_type` to `'theatre'` |
| Production | (none beyond auto-generated id) | `work_id` is nullable; all other fields optional |
| LogEntry | `production_id`, `user_id` | `date_seen` defaults to today, so effectively the user only selects a production |
| WishlistItem | `user_id` + one of (`work_id`, `production_id`) | `notes` is optional |

### 2.4 Edge Case Rulings

**Adaptations:** Separate Work entities with an `adapted_from` FK. West Side Story is a distinct Work from Romeo and Juliet. The FK documents creative lineage. Chains (A -> B -> C) are supported.

**Touring productions:** A tour with a fixed creative team is one Production with `is_touring = true`. The `venue` field records the originating/primary venue. Users note which leg they attended in their log entry review text or tags. If a tour significantly changes (new cast, new staging), those are separate Production records.

**Devised/authorless work:** Uses `creation_method = 'devised'`. The `creators` array stores facilitators or company names with roles like `"devised by"` or `"created by"`. The array may be empty for truly collective work.

**Non-theatre media:** Same Work + Production schema with `media_type` set accordingly (`opera`, `dance`, `circus`, `concert`, `other`).

**Cast and crew storage:** JSONB arrays on Production (`cast_members`) and Work (`creators`), not separate join tables. This avoids schema complexity at MVP. A normalized `people` + `production_credits` schema is a documented post-MVP migration path.

### 2.5 Full Postgres Schema

```sql
-- ============================================================
-- Transient v1: Complete Postgres Schema
-- Target: Supabase (Postgres 15+)
-- ============================================================

-- ---- Works ----

CREATE TABLE works (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  original_title  text,
  creators        jsonb NOT NULL DEFAULT '[]',
  year_written    int,
  creation_method text NOT NULL DEFAULT 'scripted'
                    CHECK (creation_method IN ('scripted', 'devised', 'other')),
  media_type      text NOT NULL DEFAULT 'theatre'
                    CHECK (media_type IN ('theatre', 'musical', 'opera', 'dance', 'circus', 'concert', 'other')),
  description     text,
  adapted_from    uuid REFERENCES works(id),
  external_ids    jsonb NOT NULL DEFAULT '{}',
  search_vector   tsvector GENERATED ALWAYS AS (
                    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(original_title, '') || ' ' || coalesce(description, ''))
                  ) STORED,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_works_search ON works USING GIN (search_vector);
CREATE INDEX idx_works_adapted_from ON works(adapted_from);
CREATE INDEX idx_works_media_type ON works(media_type);

-- ---- Productions ----

CREATE TABLE productions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id         uuid REFERENCES works(id),
  title_override  text,
  company         text,
  venue           text,
  director        text,
  cast_members    jsonb NOT NULL DEFAULT '[]',
  year            int,
  start_date      date,
  end_date        date,
  poster_url      text,
  is_touring      boolean NOT NULL DEFAULT false,
  external_ids    jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_productions_work_id ON productions(work_id);
CREATE INDEX idx_productions_year ON productions(year);
CREATE INDEX idx_productions_venue ON productions(venue);

-- ---- Log Entries ----

CREATE TABLE log_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id   uuid NOT NULL REFERENCES productions(id),
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  date_seen       date NOT NULL DEFAULT CURRENT_DATE,
  rating          numeric(2,1) CHECK (
                    rating IS NULL OR
                    (rating >= 0.5 AND rating <= 5.0 AND (rating * 2) = FLOOR(rating * 2))
                  ),
  review          text,
  is_private      boolean NOT NULL DEFAULT true,
  liked           boolean NOT NULL DEFAULT false,
  tags            text[] NOT NULL DEFAULT '{}',
  is_rewatch      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_log_entries_user_date ON log_entries(user_id, date_seen DESC);
CREATE INDEX idx_log_entries_production ON log_entries(production_id);
CREATE INDEX idx_log_entries_user_id ON log_entries(user_id);
CREATE INDEX idx_log_entries_tags ON log_entries USING GIN (tags);

-- ---- Wishlist ----

CREATE TABLE wishlist_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  work_id         uuid REFERENCES works(id),
  production_id   uuid REFERENCES productions(id),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT wishlist_target CHECK (
    (work_id IS NOT NULL AND production_id IS NULL) OR
    (work_id IS NULL AND production_id IS NOT NULL)
  )
);

CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);

-- ---- Row-Level Security ----

ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Works: public read, authenticated write
CREATE POLICY "Works are publicly readable"
  ON works FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create works"
  ON works FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update works"
  ON works FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Productions: public read, authenticated write
CREATE POLICY "Productions are publicly readable"
  ON productions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create productions"
  ON productions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update productions"
  ON productions FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Log entries: private by default, owner-only write
CREATE POLICY "Users can read own or public log entries"
  ON log_entries FOR SELECT
  USING (user_id = auth.uid() OR is_private = false);
CREATE POLICY "Users can insert own log entries"
  ON log_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own log entries"
  ON log_entries FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Users can delete own log entries"
  ON log_entries FOR DELETE
  USING (user_id = auth.uid());

-- Wishlist: private to owner
CREATE POLICY "Users can manage own wishlist"
  ON wishlist_items FOR ALL
  USING (user_id = auth.uid());

-- ---- Updated-at trigger ----

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER works_updated_at
  BEFORE UPDATE ON works
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER productions_updated_at
  BEFORE UPDATE ON productions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER log_entries_updated_at
  BEFORE UPDATE ON log_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 3. Feature List

### Tier 1: Core Loop (non-negotiable)

| # | Feature | Description |
|---|---------|-------------|
| 1 | Log a show | Tap +, search for production, confirm date (defaults today), save. Under 5 seconds for a minimal entry. |
| 2 | Two-level catalog | Work + Production hierarchy. Users log against Productions. This is the structural advantage over every competitor. |
| 3 | Half-star rating | 0.5-5.0 scale, optional, on log entries. Proven by Letterboxd and RateYourMusic. |
| 4 | Private diary view | Reverse-chronological list of log entries. Private by default. The home screen. |
| 5 | Search works and productions | Full-text search on works via Postgres `tsvector`. Partial-match search ("Hamlet Almeida") surfaces relevant results. |
| 6 | Inline creation | When search returns nothing, the user creates Work and Production on the spot with minimal fields. Title for Work; venue and year for Production. |

### Tier 2: Enrichment (makes it worth using over a spreadsheet)

| # | Feature | Description |
|---|---------|-------------|
| 7 | Written review | Free text per log entry. Added at log time or later via edit. Private by default. |
| 8 | Tags | Free-form text array per log entry. Stored as Postgres `text[]`. |
| 9 | Like/heart flag | Binary "loved it" flag per log entry, independent of star rating. |
| 10 | Rewatch flag | Boolean per log entry. Distinguishes first viewings from return visits. |
| 11 | Wishlist | "Want to see" list targeting either a Work or a specific Production. Separate from the diary. |
| 12 | Basic stats | Total shows logged, shows this year, venues visited, rating distribution, shows by media type, shows by year. All derivable from existing data with aggregate queries. |
| 13 | Edit and delete log entries | Users can go back to add a review, change a rating, fix a date, or delete an entry. |

---

## 4. Screen Descriptions

Seven screens total. Bottom navigation bar on all screens: Diary | Search | Wishlist | Stats | Settings.

### Screen 1: Diary (Home)

The default screen when the app opens.

- **Header:** "Diary" title. Year filter pill (2026, 2025, All).
- **Content:** Reverse-chronological list of log entries. Each row shows:
  - Date (left-aligned, formatted as "15 Mar")
  - Work title (bold), with production venue underneath in smaller text
  - Star rating displayed as filled/half/empty stars (if set)
  - Heart icon (if liked)
  - Review indicator icon (if review text exists)
- **Empty state:** "No shows logged yet. Tap + to log your first show."
- **FAB (floating action button):** "+" button, bottom-right, always visible. Tapping opens the Log Entry screen.
- **Tapping a diary entry:** Opens the Log Entry screen in edit mode for that entry.

### Screen 2: Log Entry (Create/Edit)

Opened from the + FAB (create mode) or by tapping a diary entry (edit mode).

**Step 1 -- Find production (create mode only):**

- Text input at top with autofocus. Keyboard appears immediately.
- As the user types, results appear below. Search runs against `works.search_vector` using Postgres full-text search.
- Each result shows: work title, first creator and role (e.g., "by Arthur Miller"), media type badge.
- Tapping a work result expands to show its productions: venue, year, director for each.
- Tapping a production selects it and advances to Step 2.
- If no results: a "Can't find it? Add new work" button appears at the bottom of the results area. Tapping opens the inline creation flow (see Section 7).

**Step 2 -- Log details (single scrollable form):**

- Production title + venue displayed at top (read-only, confirms selection).
- **Date seen:** Date picker, defaults to today.
- **Rating:** Interactive star widget. Tap left half of a star for a half-star, right half for a full star. Tap an already-set value to clear. Range: 0.5-5.0.
- **Liked:** Heart toggle button.
- **Rewatch:** Toggle ("Seen this production before?").
- **Review:** Multiline text input, placeholder "Write your thoughts...". Starts collapsed; tapping expands it.
- **Tags:** Text input with comma separation. Entered tags display as removable pills.
- **Actions:** Save (primary button), Cancel (secondary). Save writes to the `log_entries` table.

In edit mode, Step 1 is skipped. The form opens pre-filled with the existing log entry data. The production selection is shown read-only at the top.

### Screen 3: Search

Browse and find works and productions in the catalog.

- **Search bar:** Text input at top. Searches across `works.search_vector`.
- **Results list:** Shows matching works. Each result displays:
  - Work title
  - First creator + role (e.g., "by Arthur Miller")
  - Media type badge (play, musical, opera, etc.)
  - Number of productions in the database
- **Tapping a work result:** Expands to show productions under that work (venue, year, director). Tapping a production navigates to the Production Detail screen.
- **"Log this" action** on any production row: Opens the Log Entry screen with that production pre-selected (skips Step 1).

### Screen 4: Production Detail

Displays a single production's information and the user's log entries for it.

- **Header area:**
  - Work title (large)
  - Production subtitle: "Venue, Year" (e.g., "Almeida Theatre, 2025")
  - Director (if known)
  - Run dates (if known): "12 Mar - 28 Apr 2025"
  - Media type badge
  - Poster image (if available)
- **Cast and creative section:**
  - Creators from the parent Work (`creators` JSONB): playwright, composer, etc.
  - Cast members from the Production (`cast_members` JSONB): actor name and role. Scrollable list.
- **Your log entries:** List of the user's log entries for this production (there may be multiple if rewatch). Each shows date, rating (stars), liked (heart), review excerpt.
- **Actions:**
  - "Log this production" button -- opens Log Entry screen with this production pre-selected.
  - "Add to wishlist" button (if not yet logged or wish-listed).

### Screen 5: Wishlist

The user's "want to see" list.

- **List of wishlist items**, each showing:
  - Work title (if targeting a Work) or production title + venue (if targeting a Production)
  - Notes (if any, shown as subtitle)
  - Date added
- **Swipe to remove** a wishlist item.
- **Tapping an item:** Navigates to the Work's productions list (if targeting a Work) or the Production Detail screen (if targeting a Production).
- **Empty state:** "Nothing on your list yet. Browse shows and tap the bookmark icon to add."

### Screen 6: Stats

Personal statistics derived from log entry data. No new tables required; all computed from `log_entries`, `productions`, and `works` via aggregate queries.

- **Summary cards at top:**
  - Total shows logged (all time): `COUNT(*)` from `log_entries` for this user.
  - Shows this year: `COUNT(*)` where `EXTRACT(YEAR FROM date_seen) = current_year`.
  - Venues visited: `COUNT(DISTINCT p.venue)` from `log_entries` joined to `productions`.
- **Rating distribution:** Bar chart showing count of log entries at each half-star value (0.5 through 5.0). Only entries with a rating are included.
- **By media type:** Breakdown of logs by `works.media_type` (theatre, musical, opera, dance, circus, concert, other). Displayed as a simple list or horizontal bar chart.
- **By year:** Shows logged per year, as a year-over-year list with counts.

### Screen 7: Settings

Minimal settings screen.

- **User info:** Email and display name from Supabase Auth.
- **Account actions:** Sign out button.
- **Data:** "Export my data" button. Exports log entries as CSV or JSON.
- **About:** App version, link to source code.

---

## 5. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Frontend framework** | Expo Router (React Native + web) | Single codebase for iOS, Android, and web. File-based routing. ~80-90% shared code. Simpler than Solito for a solo developer at MVP. |
| **UI/styling** | NativeWind (Tailwind CSS for React Native) | Familiar Tailwind syntax. Proper atomic CSS on web (not inline styles). Low learning curve. Fast iteration. |
| **Backend** | Supabase | Hosted Postgres with auto-generated REST API, auth (email/password, OAuth), file storage, real-time subscriptions, row-level security. Zero setup cost on free tier. |
| **Database** | PostgreSQL 15+ (via Supabase) | Native foreign keys, JSONB for semi-structured data (`creators`, `cast_members`, `external_ids`), `text[]` for tags, `tsvector` for full-text search. Ideal fit for the relational Work-Production model. |
| **Auth** | Supabase Auth | Email/password and OAuth (Google, Apple). JWT-based. Integrates with RLS policies. |
| **File storage** | Supabase Storage | Poster images, user avatars. 1 GB on free tier. |
| **Web hosting** | Vercel (free hobby plan) or EAS Hosting | Expo Router web output deploys directly. 100 GB bandwidth/month on Vercel free tier. |
| **Mobile distribution** | Web-first (PWA) | Skip App Store fees initially. PWA provides home-screen icon and offline capability. Add Google Play ($25 one-time) and Apple ($99/year) when there are users beyond the developer. |

### Operational note: Supabase free tier inactivity

Supabase free-tier projects pause after 7 days of inactivity. Solution: a GitHub Actions cron job that pings the Supabase REST endpoint (`https://<project>.supabase.co/rest/v1/`) every 5 days.

---

## 6. Rating/Logging System

### Rating scale

- **Scale:** 0.5 to 5.0 in half-star increments -- 10 discrete values (0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0).
- **Storage:** `numeric(2,1)` with a CHECK constraint enforcing both the range and half-star granularity.
- **Display:** Interactive star widget. Tap the left half of a star for a half-star, the right half for a full star. Tap an already-set rating to clear it.
- **Rating is optional.** A log entry does not require a rating. Users may log attendance without rating, or rate without reviewing. Ratings, reviews, and diary entries are three separate concepts.
- **Rating target:** The rating is for the production experience -- the specific staging the user attended -- not for the abstract work.

### Logging flow

**The pavement moment (minimal log, under 10 seconds):**

1. User taps the + FAB on the Diary screen.
2. Search bar appears with autofocus and keyboard up.
3. User types a partial production name (e.g., "hamlet" or "hamlet almeida").
4. Full-text search returns matching works; user taps the correct work.
5. Productions for that work expand; user taps the correct production.
6. Log form opens. Date defaults to today. All other fields are empty/off.
7. User taps Save.

Total interaction: 3-4 taps + typing the search query. Under 10 seconds.

**The enriched log (at home, next day):**

1. User opens the Diary screen and taps the log entry from last night.
2. Log Entry screen opens in edit mode with all fields pre-filled.
3. User adds: rating (taps stars), review (expands text field and writes), tags (types and confirms), liked (taps heart).
4. User taps Save.

### Log entry fields summary

| Field | Required | Default | Input |
|---|---|---|---|
| Production | Yes | -- | Selected via search in Step 1 |
| Date seen | Yes | Today | Date picker |
| Rating | No | null | Star widget (0.5-5.0) |
| Liked | No | false | Heart toggle |
| Rewatch | No | false | Toggle |
| Review | No | null | Multiline text input |
| Tags | No | [] | Text input with comma separation |

---

## 7. Search and Entry Creation

### Search behavior

- Search input runs against the `works.search_vector` tsvector column using Postgres `plainto_tsquery`.
- The GIN index (`idx_works_search`) enables fast full-text search.
- Results are ranked by `ts_rank` relevance score, limited to 20 results.
- Each result displays: work title, first creator + role, media type, production count.
- Tapping a work result fetches its productions from `productions` (filtered by `work_id`) and displays them inline: venue, year, director.

### Search query

```sql
SELECT w.*, COUNT(p.id) AS production_count
FROM works w
LEFT JOIN productions p ON p.work_id = w.id
WHERE w.search_vector @@ plainto_tsquery('english', $1)
GROUP BY w.id
ORDER BY ts_rank(w.search_vector, plainto_tsquery('english', $1)) DESC
LIMIT 20;
```

### Creating a new Work (work not found in search)

When the search returns no relevant results, the user taps "Can't find it? Add new work." An inline form appears:

| Field | Input | Required | Default |
|---|---|---|---|
| Title | Text input, pre-filled from search text | Yes | Search query text |
| Media type | Dropdown | No | `theatre` |
| Creator name | Text input | No | empty |
| Creator role | Dropdown | No | `playwright` |

User taps "Save Work." The work is inserted into the `works` table.

### Creating a new Production (work exists, production does not)

When a work is found but the user's production is not listed, the user taps "Add new production" below the work's production list. An inline form appears:

| Field | Input | Required | Default |
|---|---|---|---|
| Venue | Text input | No | empty |
| Year | Number input | No | Current year |
| Director | Text input | No | empty |

User taps "Save Production." The production is inserted into the `productions` table with `work_id` set to the parent work.

### Creating both Work and Production (nothing found)

This is the two-step version: the user creates the Work first (as above), is immediately prompted to add a Production under it, creates the Production, and then the Log Entry form opens with the new production pre-selected.

### Design principles

1. **Search first, always.** The user never browses a catalog. They search with whatever they remember.
2. **Creation is a fallback, not a primary path.** The ideal flow is: type, tap, save.
3. **Minimum fields on creation.** Title is the only required field for a Work. No fields are required for a Production beyond the auto-generated ID (though venue and year are expected). Everything else can be added later.
4. **No blocking.** The user is never prevented from logging because metadata is incomplete. A production with just "Almeida Theatre, 2025" is a valid record.
5. **Date always defaults to today.** Do not make the user pick a date unless they want to change it.

---

## 8. Data Seeding

### Phase 1: Wikidata bulk seed (before launch)

Run SPARQL queries against `query.wikidata.org` to extract canonical Works:

- **Query targets:** All Wikidata items typed as play (`Q25379`), musical (`Q182659`), or opera (`Q1344`).
- **Fields extracted per item:** title (label), creators (P170 creator, P86 composer, P58 screenwriter), year (P571 inception), description, genre (P136).
- **Cross-reference:** Store the Wikidata QID in `external_ids.wikidata_qid` on the Work record.
- **Expected yield:** 5,000-10,000 Works with reasonable metadata quality. Coverage is strong for canonical works (Shakespeare, Chekhov, Ibsen, Sondheim, Rodgers & Hammerstein, Puccini, Verdi, major operas). Coverage is sparse for recent plays (last 5 years), fringe/community theatre, and most regional work.
- **License:** CC0 (public domain). No restrictions on use.
- **Seeded entity:** Works only. No production-level data is available from Wikidata.

### Phase 2: MusicBrainz enrichment (musicals and operas)

For works with `media_type` in (`musical`, `opera`), cross-reference MusicBrainz to enrich metadata:

- **Method:** Title/creator matching against MusicBrainz Work entities via REST API.
- **Fields enriched:** Composer, librettist, ISWC (International Standard Musical Work Code).
- **Cross-reference:** Store the MusicBrainz MBID in `external_ids.musicbrainz_mbid`.
- **License:** CC0.
- **Scope:** Only useful for musicals and operas where a cast recording exists. Not useful for straight plays.

### Phase 3: User-generated content (ongoing, steady state)

Productions are entirely user-created. No open, API-accessible source exists for production-level data at scale. The production catalog grows organically through user logging:

1. User searches for the Work.
2. If found, user searches/creates a Production under it.
3. If Work not found, user creates both Work and Production inline.

For a single-user personal app, this is acceptable: the database only needs production records for shows the user has actually seen.

### Cross-reference identifiers stored

| Identifier | Entity | Source | Notes |
|---|---|---|---|
| `wikidata_qid` | Work, Production | Wikidata SPARQL | Primary cross-reference |
| `musicbrainz_mbid` | Work | MusicBrainz REST API | Musicals and operas only |
| `theatricalia_play_id` | Work | Wikidata P1242 property | Looked up via Wikidata; no direct Theatricalia API |
| `ibdb_show_id` | Production | Manual entry | Broadway productions; no API available |

All stored in the `external_ids` JSONB field on both `works` and `productions`. Extensible without schema changes.

---

## 9. Non-Goals (Explicitly Deferred)

The following features are out of scope for v1. They are documented here to confirm they were considered and intentionally excluded.

| Feature | Reason for deferral |
|---------|-------------------|
| Programme scan / camera import | Requires OCR integration (e.g., Google Vision API or on-device ML). High implementation effort. |
| Venue tracking with map | Requires a `venues` table with geolocation and map rendering. Current schema stores venue as plain text, which is sufficient. |
| Public profiles / social log | Social layer is opt-in by design. The `is_private` field supports this later, but profile pages, privacy controls, and a public feed are a separate product track. |
| Follow / activity feed | Requires follower graph, feed architecture, notification system. |
| Lists | User-created ranked/unranked collections. Requires new `lists` + `list_items` tables. |
| Rich stats (year-in-review, most-seen playwright) | Depends on having enough data to be meaningful. Requires JSONB aggregation across `creators` and `cast_members`. |
| Companion tracking ("who I went with") | Adds a field and potentially a contacts system. Approximated with tags ("with Mum") in v1. |
| Seat and price tracking | Spreadsheet power-user feature. Adds fields to log entry. Not part of the core loop. |
| Production discovery ("what's on near me") | Requires real-time event data pipeline, geolocation, calendar integration. Entirely separate product track. |
| Notifications for wish-listed works | Requires a production announcement data feed that does not exist in any accessible API. |
| Ticket integration (email/Apple Wallet import) | Complex integration with unclear ROI. |
| Photo/programme archive | File upload to Supabase Storage. Adds storage cost and UI complexity. Can be added as a field on log entry later. |
| Cast-level reviews | Creates UI and data complexity. |
| Alternate cast tracking | Requires per-performance cast data that is almost never machine-readable. |
| Critic review aggregation | Requires partnerships and curation infrastructure. |
| Community-curated lists | Requires editorial resources and a community. |
| Work page (aggregate view across productions) | The data model supports it; the UI can come later. |
| Rating aggregation (community averages) | Requires multiple users. Post-MVP, use Bayesian weighted average: `WR = (v / (v + m)) * R + (m / (v + m)) * C` with m=5, C~3.5. |
