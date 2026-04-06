# Convergence 2: MVP Scope

**Date:** 2026-04-05
**Status:** Definitive — scope locked for v1 implementation.

---

## 1. In v1 — What Makes the Cut

### Core Loop (non-negotiable)

| #   | Feature                                  | Justification                                                                                                                                                                                       |
| --- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Log a show: production + date**        | The irreducible minimum. Tap +, search, confirm date (defaults today), save. Under 5 seconds for a minimal entry. Without this, no product exists.                                                  |
| 2   | **Work + Production two-level database** | The structural advantage over every competitor. "Hamlet" (Work) has many Productions. Users log against Productions. This is the data model's load-bearing wall.                                    |
| 3   | **Half-star rating (0.5-5.0, optional)** | Universal user expectation. Proven by Letterboxd and RYM. Applied at log entry level. Not required to save.                                                                                         |
| 4   | **Private diary view**                   | Reverse-chronological list of everything logged, with date, title, venue, rating. Private by default. This is the proof the app is working.                                                         |
| 5   | **Search works and productions**         | Postgres full-text search on works. Users must find the production before they can log it. Partial-match search ("Hamlet Almeida") is critical for the pavement moment.                             |
| 6   | **Create work/production inline**        | When a search returns nothing, the user creates the entry on the spot. Minimum fields: title for Work; venue and year for Production. Without this, the app is useless for anything not pre-seeded. |

### Enrichment (makes it worth using over a spreadsheet)

| #   | Feature                                      | Justification                                                                                                                                                                                               |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | **Written review (optional, per log entry)** | Free text. Added at log time or later via edit. Private by default. The two-stage pattern (log now, review later) is critical.                                                                              |
| 8   | **Tags (per log entry)**                     | Free-form text array: "world premiere", "with Mum", "standing ovation". Stored as Postgres `text[]`. Low implementation cost, high personal value.                                                          |
| 9   | **Like/heart flag (per log entry)**          | Binary "loved it" flag independent of star rating. One boolean column. Matches Letterboxd convention.                                                                                                       |
| 10  | **Rewatch flag**                             | Boolean on log entry. Same production, different date. Distinguishes first viewings from returns.                                                                                                           |
| 11  | **Wishlist**                                 | "Want to see" list, targeting either a Work or a specific Production. Already in the schema. Separate from the diary. Half the value proposition of Letterboxd's watchlist.                                 |
| 12  | **Basic stats**                              | Total shows logged. Shows this year. Shows by venue. Rating distribution. Shows by media type. All derivable from existing log entry + production data with simple aggregate queries. No new tables needed. |
| 13  | **Edit and delete log entries**              | Users must be able to go back and add a review, change a rating, fix a date, or delete an entry entirely.                                                                                                   |

---

## 2. Deferred to v2+

| Feature                                                     | Reason for deferral                                                                                                                                                                       |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Programme scan / camera import**                          | Requires OCR integration (e.g. Google Vision API or on-device ML). High implementation effort. Proven concept (Mezzanine) but not MVP-critical.                                           |
| **Venue tracking with map**                                 | Requires a `venues` table with geolocation, map rendering. Current schema stores venue as plain text, which is sufficient for v1.                                                         |
| **Public profiles / social log**                            | Social layer is opt-in by design. The `is_private` field on log entries supports this later, but building profile pages, privacy controls, and a public feed is a separate product track. |
| **Follow / activity feed**                                  | Requires follower graph, fan-out-on-write or fan-out-on-read feed architecture, notification system. Significant backend complexity for a single-user app.                                |
| **Lists**                                                   | User-created ranked/unranked collections. Useful but not core to the log-and-remember loop. Requires a new `lists` + `list_items` schema.                                                 |
| **Rich stats (year-in-review, most-seen playwright, etc.)** | Depends on having enough data to be meaningful. Basic stats cover v1. Rich stats require JSONB aggregation queries across `creators` and `cast_members`.                                  |
| **Companion tracking**                                      | "Who I went with." Useful but adds a field and potentially a contacts/people system. Can be approximated with tags ("with Mum") in v1.                                                    |
| **Seat + price tracking**                                   | Spreadsheet power-user feature. Adds fields to log entry. Not part of the core loop.                                                                                                      |
| **Production discovery (what's on near me)**                | Requires real-time event data pipeline, geolocation, calendar integration. Entirely separate product track.                                                                               |
| **Notifications for wish-listed works**                     | Requires production announcement data feed that does not exist in any accessible API.                                                                                                     |
| **Ticket integration (email/Apple Wallet import)**          | Complex integration with unclear ROI.                                                                                                                                                     |
| **Photo/programme archive**                                 | File upload to Supabase Storage. Adds storage cost and UI complexity. Can be added as a field on log entry later without schema changes.                                                  |
| **Cast-level reviews**                                      | Very granular. Creates UI and data complexity.                                                                                                                                            |
| **Alternate cast tracking**                                 | Requires per-performance cast data that is almost never machine-readable.                                                                                                                 |
| **Critic review aggregation**                               | Requires partnerships and curation infrastructure.                                                                                                                                        |
| **Community-curated lists**                                 | Requires editorial resources and a community.                                                                                                                                             |
| **Work page (aggregate across productions)**                | Useful but not required for personal logging. The data model supports it; the UI can come later.                                                                                          |

---

## 3. Core Screens (v1)

Seven screens total. Each described with what is on it.

### Screen 1: Diary (Home)

The default screen. What you see when you open the app.

- **Header:** "Diary" title. Year filter pill (2026, 2025, All).
- **Content:** Reverse-chronological list of log entries. Each row shows:
  - Date (left-aligned, formatted as "15 Mar")
  - Work title (bold) with production venue underneath in smaller text
  - Star rating (if set) displayed as filled/half/empty stars
  - Heart icon (if liked)
  - Review indicator icon (if review text exists)
- **Empty state:** "No shows logged yet. Tap + to log your first show."
- **FAB (floating action button):** "+" button, bottom-right, always visible. Tapping opens the Log screen.
- **Bottom nav:** Diary (active) | Search | Wishlist | Stats | Profile

### Screen 2: Log Entry (Create/Edit)

Opened from the + FAB or by tapping a diary entry to edit.

- **Step 1 — Find production:** Text input at top with autofocus. As you type, results appear below (searches works by title via full-text search). Each result shows work title, creators, and media type. Tapping a work shows its productions underneath (venue, year). Tapping a production selects it.
- **If no results:** "Can't find it?" button at bottom of results. Tapping opens inline creation flow (see Section 6).
- **Step 2 — Log details (single scrollable form after production is selected):**
  - Production title + venue displayed at top (read-only, confirms selection)
  - Date seen: date picker, defaults to today
  - Rating: star widget (tap to set 0.5-5.0, tap again to clear)
  - Liked: heart toggle
  - Rewatch: toggle ("Seen this production before?")
  - Review: multiline text input, placeholder "Write your thoughts..." (collapsible, starts collapsed)
  - Tags: text input with comma separation, displayed as pills
- **Actions:** Save (primary), Cancel (secondary). Save writes to `log_entries` table.

### Screen 3: Search

Browse and find works and productions in the database.

- **Search bar:** Text input at top. Searches across `works.search_vector`.
- **Results list:** Shows matching works. Each result displays:
  - Work title
  - Creators (first creator + role, e.g. "by Arthur Miller")
  - Media type badge (play, musical, opera, etc.)
  - Number of productions in database
- **Tapping a work result:** Expands to show a list of productions under that work (venue, year, director). Tapping a production goes to the Production Detail screen.
- **Tapping "Log this"** on any production row: opens the Log Entry screen with that production pre-selected.

### Screen 4: Production Detail

Displays a single production's information and the user's log entries for it.

- **Header area:**
  - Work title (large)
  - Production subtitle: "Venue, Year" (e.g. "Almeida Theatre, 2025")
  - Director (if known)
  - Run dates (if known): "12 Mar - 28 Apr 2025"
  - Media type badge
- **Cast/creative section:** Scrollable list of cast members from `cast_members` JSONB (name and role). Creators from the parent Work (`creators` JSONB).
- **Your log entries:** List of the user's log entries for this production (there can be multiple if rewatch). Each shows date, rating, review excerpt.
- **Actions:** "Log this production" button. "Add to wishlist" button (if not yet logged).

### Screen 5: Wishlist

The user's "want to see" list.

- **List of wishlist items**, each showing:
  - Work title (if targeting a Work) or Production title + venue (if targeting a Production)
  - Notes (if any, shown as a subtitle)
  - Date added
- **Swipe to remove** or tap to go to Work/Production detail.
- **Empty state:** "Nothing on your list yet. Browse shows and tap the bookmark icon to add."

### Screen 6: Stats

Personal statistics derived from log entry data.

- **Summary cards at top:**
  - Total shows logged (all time)
  - Shows this year
  - Venues visited (count of distinct `production.venue` values)
- **Rating distribution:** Bar chart showing count of log entries at each half-star value (0.5 through 5.0).
- **By media type:** Breakdown of logs by `works.media_type` (plays, musicals, operas, etc.) as a simple list or horizontal bar chart.
- **By year:** Shows logged per year, as a simple year-over-year list.

### Screen 7: Profile / Settings

Minimal settings screen for a single-user app.

- **User info:** Email, display name (from Supabase Auth).
- **Account actions:** Sign out.
- **Data:** "Export my data" button (exports log entries as CSV or JSON).
- **About:** App version, link to source code.

---

## 4. Rating/Logging Format

### What a log entry contains

| Field           | Type         | Required | Default | Notes                                          |
| --------------- | ------------ | -------- | ------- | ---------------------------------------------- |
| `production_id` | uuid FK      | Yes      | —       | Links to the production record                 |
| `user_id`       | uuid FK      | Yes      | —       | From auth session                              |
| `date_seen`     | date         | Yes      | Today   | The only field the user must confirm           |
| `rating`        | numeric(2,1) | No       | null    | 0.5 to 5.0 in half-star increments             |
| `review`        | text         | No       | null    | Free text, any length                          |
| `is_private`    | boolean      | Yes      | true    | All entries private in v1 (no public profiles) |
| `liked`         | boolean      | Yes      | false   | Heart/love flag                                |
| `tags`          | text[]       | Yes      | []      | User-defined, free-form                        |
| `is_rewatch`    | boolean      | Yes      | false   | "Have you seen this production before?"        |

### Minimum viable log (the pavement moment)

The user taps +, searches for the production, taps it, and hits Save. The date defaults to today. Everything else is optional. This is 3-4 taps and under 10 seconds.

### Enriched log (at home, next day)

The user opens the diary, taps the entry, and edits it to add: rating, review, tags, liked status. No time pressure.

---

## 5. Data Seeding Plan

### Phase 1: Wikidata bulk seed (before launch)

Run a SPARQL query against `query.wikidata.org` to extract canonical Works:

- All items typed as play (Q25379), musical (Q182659), opera (Q1344)
- Fields: title, creators (P170/P86/P58), year (P571 inception), description, genre
- Store the Wikidata QID in `external_ids.wikidata_qid`

**Expected coverage:** Shakespeare, Chekhov, Ibsen, Sondheim, Rodgers & Hammerstein, Puccini, Verdi, major canonical works. Estimated 5,000-10,000 Works with reasonable metadata quality.

**Not covered:** Recent plays (last 5 years), fringe/community theatre, most regional productions. No production-level data from Wikidata.

### Phase 2: MusicBrainz enrichment (optional, musicals/operas)

For works with `media_type` in ('musical', 'opera'), cross-reference MusicBrainz to enrich composer/librettist credits and get MBIDs.

### Phase 3: User-generated (ongoing)

Productions are entirely user-created. The seed covers Works only. When a user logs a show:

1. Search for the Work
2. If found, search/create a Production under it
3. If Work not found, create both Work and Production inline

This is the steady-state data growth model. The database grows organically through use.

### No production seeding

There is no viable open API for production-level data (specific venue, cast, dates). IBDB, BroadwayWorld, and Theatricalia lack public APIs. This is a known gap. The user creates productions manually as they log shows. For a single-user personal app, this is acceptable: you only need production records for shows you have actually seen.

---

## 6. Search and Entry Creation Flow

### Searching for an existing production

```
User taps "+"
  → Search bar appears (autofocused, keyboard up)
  → User types: "hamlet" (or "hamlet almeida" or "hamlet 2025")
  → Full-text search runs against works.search_vector
  → Results appear as a list of Works:
      "Hamlet" by William Shakespeare (play) — 3 productions
      "Hamlet Machine" by Heiner Muller (play) — 0 productions
  → User taps "Hamlet"
  → Productions expand below:
      Almeida Theatre, 2025 (dir. Rupert Goold)
      RSC, 2024 (dir. Robert Icke)
      Young Vic, 2021 (dir. Greg Hersov)
  → User taps "Almeida Theatre, 2025"
  → Log form opens with this production pre-selected
  → Date defaults to today
  → User taps Save
```

### Creating a new entry (work not found)

```
User taps "+"
  → Types: "the doctor"
  → No results, or no matching result
  → User taps "Can't find it? Add new work"
  → Inline form appears:
      Title: [The Doctor] (pre-filled from search text)
      Media type: [theatre ▼] (dropdown, defaults to "theatre")
      Creator name: [Robert Icke] (optional text input)
      Creator role: [playwright ▼] (dropdown)
  → User taps "Save Work"
  → Immediately prompted: "Add a production?"
  → Inline form:
      Venue: [Almeida Theatre] (text input)
      Year: [2025] (defaults to current year)
      Director: [Robert Icke] (optional text input)
  → User taps "Save Production"
  → Log form opens with this new production pre-selected
  → User taps Save
```

### Creating a new production (work exists but production doesn't)

```
User taps "+"
  → Types: "hamlet"
  → Finds "Hamlet" by William Shakespeare
  → Taps it, but no matching production listed
  → User taps "Add new production" under the work
  → Inline form:
      Venue: [text input]
      Year: [defaults to current year]
      Director: [optional text input]
  → User taps "Save Production"
  → Log form opens with this new production pre-selected
```

### Design principles for this flow

1. **Search first, always.** The user should never navigate to a database and browse. They search with whatever they remember.
2. **Creation is a fallback, not a primary path.** The ideal is: type, tap, save. Creation only happens when the database lacks the entry.
3. **Minimum fields on creation.** Title is the only required field for a Work. Venue and year are the only expected fields for a Production. Everything else (cast, dates, description) can be added later by editing the record.
4. **No blocking.** The user is never prevented from logging because metadata is incomplete. A production with just "Almeida Theatre, 2025" and nothing else is a valid record.
5. **Date always defaults to today.** The user is standing on a pavement. Do not make them pick a date unless they want to.

---

## Sources

- `docs/research/track2-product-audit.md` — feature tiers, logging moment analysis, competitor audit
- `docs/research/track3-tech-evaluation.md` — tech stack capabilities, database modeling
- `docs/research/convergence1-data-model.md` — schema, entity definitions, seeding strategy, rating system
- `docs/2026-04-05-platform-research.md` — Section 8, platform patterns and takeaways
