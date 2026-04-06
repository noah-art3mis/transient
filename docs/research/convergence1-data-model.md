# Convergence 1: Data Model Decisions

**Date:** 2026-04-05
**Status:** Definitive — all decisions final for MVP implementation.

---

## 1. Model Depth: Two-Level (Work + Production)

**Decision:** Two-level model. Work and Production are the two catalog entities. There is no Performance entity.

**Justification:**

- Both Wikidata and Theatricalia — the two platforms that model the work/production distinction at all — use a two-level model. No existing platform implements a three-level model for theatre (track1-data-model-precedents.md, Section 2.6).
- The three-level model (adding a Performance entity for individual nights) was evaluated and rejected because: (a) per-performance cast data is almost never available in machine-readable form, (b) it adds a join layer to every query, and (c) users will rarely have the data to populate it (track1-data-model-precedents.md, Section 3, Model B analysis).
- The UX research confirms the minimum viable log entry is production title + date — the logging moment is "60 seconds on a pavement post-show" and every additional required field is friction (track2-product-audit.md, Section "The Logging Moment").
- The tech evaluation confirmed that Postgres handles the two-level model cleanly with foreign keys and JSONB (track3-tech-evaluation.md, Section 4.1).

If understudy/per-night tracking demand emerges, the path is: add an optional `performance_notes` text field to LogEntry first, then evaluate a full Performance entity based on actual usage data.

---

## 2. Core Entities and Fields

### 2.1 Work

The abstract creative concept (a play, musical, opera, dance piece, circus show). One Work can have many Productions across history.

```sql
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
```

**Field rationale:**

| Field             | Required                       | Rationale                                                                                                                                                                                                                                                                                                                                       |
| ----------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`           | Yes                            | The irreducible identity of a work.                                                                                                                                                                                                                                                                                                             |
| `original_title`  | No                             | For non-English works — store the original language title separately. Letterboxd does this (platform-research.md, Section 1, Film entity).                                                                                                                                                                                                      |
| `creators`        | Yes (defaults to empty array)  | JSONB array of `{name: string, role: string}`. Role values: "playwright", "book", "music", "lyrics", "devised by", "conceived by", "choreographer", "composer", "librettist". Replaces a single `playwright` field to handle musicals (multiple creators with different roles) and devised work (track1-data-model-precedents.md, Section 4.4). |
| `year_written`    | No                             | Nullable because devised work may have no fixed composition year. The premiere year of the first production is an alternative; either is acceptable.                                                                                                                                                                                            |
| `creation_method` | Yes (defaults to 'scripted')   | Distinguishes scripted, devised, and other creation processes. Recommended in track1-data-model-precedents.md, Section 5.                                                                                                                                                                                                                       |
| `media_type`      | Yes (defaults to 'theatre')    | Theatre-first but flexible for other transient media. The enum covers the media types identified in the edge case analysis: plays, musicals, operas, dance, circus, concerts.                                                                                                                                                                   |
| `description`     | No                             | Synopsis or description of the work.                                                                                                                                                                                                                                                                                                            |
| `adapted_from`    | No                             | Self-referential FK for adaptation chains. West Side Story points to Romeo and Juliet. Recommended in track1-data-model-precedents.md, Section 4.1. Wikidata uses P144 (based on) for this relationship.                                                                                                                                        |
| `external_ids`    | Yes (defaults to empty object) | JSONB object storing cross-reference identifiers. Keys: `wikidata_qid`, `musicbrainz_mbid`, `theatricalia_play_id`, `ibdb_show_id`. Extensible without schema migration as new sources emerge (track1-data-sources.md, "Recommended identifiers"; track3-tech-evaluation.md, Section 7).                                                        |
| `search_vector`   | Auto-generated                 | Postgres tsvector for full-text search. Generated from title, original_title, and description. Enables the production search flow critical to the logging moment (track2-product-audit.md).                                                                                                                                                     |

### 2.2 Production

A specific staging of a Work — a run at a venue with a director, cast, and dates.

```sql
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
```

**Field rationale:**

| Field                     | Required                       | Rationale                                                                                                                                                                                                                                                                                                  |
| ------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `work_id`                 | No                             | FK to Work. Nullable to support devised/new work that has no pre-existing Work entry — the production IS the work's first (and possibly only) instantiation (track1-data-model-precedents.md, Section 4.5, site-specific work).                                                                            |
| `title_override`          | No                             | For renamed adaptations, billing variants, or touring titles that differ from the canonical Work title. Display logic: show `title_override` if set, otherwise fall through to `works.title`.                                                                                                              |
| `company`                 | No                             | Theatre company or producing organization. Text for MVP; a separate `companies` table is a post-MVP enhancement.                                                                                                                                                                                           |
| `venue`                   | No                             | Venue name. Text for MVP. A separate `venues` table with geolocation is a post-MVP enhancement for venue tracking and discovery (track2-product-audit.md, Tier 2 feature #10).                                                                                                                             |
| `director`                | No                             | Text for MVP.                                                                                                                                                                                                                                                                                              |
| `cast_members`            | Yes (defaults to empty array)  | JSONB array of `{name: string, role: string}`. Represents the official/opening-night cast. Understudy and specific-night cast are captured in LogEntry review text, not here (track1-data-model-precedents.md, Section 3, Model A). Named `cast_members` to avoid collision with SQL reserved word `cast`. |
| `year`                    | No                             | Integer year of the production. Redundant with `start_date` but useful for display and filtering when exact dates are unknown.                                                                                                                                                                             |
| `start_date` / `end_date` | No                             | Run dates. Both nullable because historical productions may lack exact dates.                                                                                                                                                                                                                              |
| `poster_url`              | No                             | Path or URL to poster image in Supabase Storage.                                                                                                                                                                                                                                                           |
| `is_touring`              | Yes (defaults to false)        | Flag for touring productions. A tour with a fixed creative team visiting multiple venues is a single Production with `is_touring = true` (track1-data-model-precedents.md, Section 4.2).                                                                                                                   |
| `external_ids`            | Yes (defaults to empty object) | Same pattern as Work. Keys: `wikidata_qid`, `ibdb_production_id`.                                                                                                                                                                                                                                          |

### 2.3 LogEntry

A user's personal record of attending a production.

```sql
CREATE TABLE log_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id   uuid NOT NULL REFERENCES productions(id),
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  date_seen       date NOT NULL DEFAULT CURRENT_DATE,
  rating          numeric(2,1) CHECK (rating IS NULL OR (rating >= 0.5 AND rating <= 5.0 AND (rating * 2) = FLOOR(rating * 2))),
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
```

**Field rationale:**

| Field           | Required                      | Rationale                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `production_id` | Yes                           | FK to Production. The log entry records attending a specific production, not an abstract work. Rating is for the production experience (track2-product-audit.md, "Rating Is For a Production, Not a Work").                                                                                                                                                        |
| `user_id`       | Yes                           | FK to Supabase Auth users table.                                                                                                                                                                                                                                                                                                                                   |
| `date_seen`     | Yes (defaults to today)       | The date attended. Defaults to today — the "I just saw this" case must be friction-free (track2-product-audit.md, "The Logging Flow"). This is the only field besides production_id that is truly required for a useful log entry.                                                                                                                                 |
| `rating`        | No                            | Half-star scale: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0. The CHECK constraint enforces half-star increments. This is the proven sweet spot per platform research: Letterboxd and RateYourMusic both use it; Goodreads' integer-only 1-5 scale produces compressed distributions with poor discriminatory power (platform-research.md, Sections 1 and 3). |
| `review`        | No                            | Free text. Not required at log time — the two-stage pattern (log now, review later) is critical (track2-product-audit.md, "The Tension: Capture Now vs. Reflect Later").                                                                                                                                                                                           |
| `is_private`    | Yes (defaults to true)        | Private by default. "Users track theatre before they decide to share it. The social layer is opt-in." (track2-product-audit.md, Key Conclusions).                                                                                                                                                                                                                  |
| `liked`         | Yes (defaults to false)       | Binary "heart" flag, independent of star rating. Matches Letterboxd's pattern (platform-research.md, Section 1).                                                                                                                                                                                                                                                   |
| `tags`          | Yes (defaults to empty array) | Postgres text array. User-defined tags for mood, context, themes: "world premiere", "with Mum", "standing ovation", "walk-out", "lottery ticket" (track2-product-audit.md, Tier 2 feature #11).                                                                                                                                                                    |
| `is_rewatch`    | Yes (defaults to false)       | Whether the user has seen this production before. A user can log the same production multiple times on different dates; each is a separate LogEntry (track2-product-audit.md, diary design).                                                                                                                                                                       |

### 2.4 Wishlist

A user's "want to see" list, separate from the log.

```sql
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
```

**Rationale:** The wishlist can target either a Work ("I want to see any production of Hamlet") or a specific Production ("I want to see the Almeida 2025 Hamlet"). The CHECK constraint enforces exactly one target. This is a Tier 2 feature but structurally simple enough to include in the schema from the start (track2-product-audit.md, Tier 2 feature #7).

---

## 3. Required vs. Optional Fields Summary

### Absolute minimum to create each entity:

| Entity     | Required fields                         | Everything else                                                                |
| ---------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| Work       | `title`                                 | Optional — even `creators` defaults to empty array                             |
| Production | (none beyond auto-generated id)         | `work_id` is nullable; all other fields optional                               |
| LogEntry   | `production_id`, `user_id`, `date_seen` | `date_seen` defaults to today, so effectively just `production_id` + `user_id` |

This supports the minimum viable log: the user taps a production, the date defaults to today, and the entry is saved. Three pieces of information: what, when, who — exactly as specified in the UX audit (track2-product-audit.md, "Minimum Viable Log Entry").

---

## 4. Edge Case Rulings

### 4.1 Adaptations

**Ruling:** Adaptations are modeled as separate Work entities with an `adapted_from` FK pointing to the source Work.

**Example:** West Side Story (Work, `adapted_from` -> Romeo and Juliet Work). The Spielberg 2021 film is out of scope (it is not a stage production). A hypothetical stage adaptation of the film would be a Production under the West Side Story Work.

**Justification:** West Side Story is a sufficiently distinct creative work — new book, music, lyrics, setting. It does not inherit from Romeo and Juliet in the schema; the `adapted_from` FK documents the creative lineage. Wikidata uses the same pattern with P144 (based on) (track1-data-model-precedents.md, Section 4.1).

**Multiple adaptation depths:** The `adapted_from` FK supports chains. A -> B -> C is valid (Work C's `adapted_from` points to Work B, whose `adapted_from` points to Work A).

### 4.2 Touring Productions

**Ruling:** A touring production with a fixed creative team is a single Production record with `is_touring = true`. The `venue` field records the originating or primary venue. Users note which venue leg they attended in their LogEntry review text or tags.

**When a tour significantly changes:** If a tour replaces the lead cast for a new leg (e.g., a US tour vs. a UK tour with different actors), these are separate Production records sharing the same `work_id`. The distinguishing factor is whether a reasonable theatregoer would consider them "the same production" — same director, same design, same creative concept = one production; new cast, new staging choices, possibly new design = new production.

**Justification:** The track1 analysis found that allowing Production to have multiple venue records (a one-to-many Venue relationship with dates) adds schema complexity for a feature most users won't need at MVP. The `is_touring` flag marks the production for future enhancement. A dedicated `venue_legs` sub-table can be added post-MVP if touring tracking demand materializes (track1-data-model-precedents.md, Section 4.2).

### 4.3 Devised/Authorless Work

**Ruling:** Devised work uses `creation_method = 'devised'` on the Work entity. The `creators` JSONB array stores facilitators, devisors, or company names with `role = "devised by"` or `role = "created by"`. The `creators` array may be empty if authorship is truly collective and unnamed.

**Example:** A verbatim theatre piece devised by an ensemble:

```json
{
  "title": "The Laramie Project",
  "creation_method": "devised",
  "creators": [
    { "name": "Moisés Kaufman", "role": "conceived by" },
    { "name": "Tectonic Theater Project", "role": "devised by" }
  ]
}
```

**Justification:** Renaming `playwright` to `creators` (array of `{name, role}`) was the core recommendation from the data model precedents analysis. It handles traditional playwright attribution, musical theatre multi-creator attribution, and devised/collective creation in one field without loss of information (track1-data-model-precedents.md, Section 4.4).

### 4.4 Non-Theatre Media (Classical Music, Circus, Dance)

**Ruling:** Non-theatre transient media use the same Work + Production schema with `media_type` set to the appropriate value (`opera`, `dance`, `circus`, `concert`, `other`).

**Circus (e.g., Cirque du Soleil's Alegria):**

- Work: `title = "Alegría"`, `media_type = "circus"`, `creation_method = "devised"`, `creators = [{"name": "Franco Dragone", "role": "conceived by"}]`.
- Productions: The original 1994 tour and the 2019 revival are separate Production records under the same Work.

**Classical concert:**

- Work: `title = "Beethoven: Symphony No. 9"`, `media_type = "concert"`, `creators = [{"name": "Ludwig van Beethoven", "role": "composer"}]`.
- Production: A specific concert performance by a named orchestra.

**Dance:**

- Work: `title = "Swan Lake"`, `media_type = "dance"`, `creators = [{"name": "Tchaikovsky", "role": "composer"}, {"name": "Petipa/Ivanov", "role": "choreographer"}]`.
- Production: A specific company's staging.

**Justification:** The data model precedents analysis found that the Work entity is awkward for circus and variety but still meaningful — the Work represents the creative concept, the Production represents a specific tour/revival iteration (track1-data-model-precedents.md, Section 4.6). The `media_type` enum enables filtering and stats by medium. The `creators` array with flexible roles handles the different attribution conventions across media types.

---

## 5. Relationships

### Entity-Relationship Summary

```
User (auth.users)
  ├── 1:N  LogEntry          (user_id FK)
  └── 1:N  WishlistItem      (user_id FK)

Work
  ├── 1:N  Production        (work_id FK)
  ├── 0:1  Work              (adapted_from FK, self-referential)
  └── 0:N  WishlistItem      (work_id FK)

Production
  ├── N:1  Work              (work_id FK, nullable)
  ├── 1:N  LogEntry          (production_id FK)
  └── 0:N  WishlistItem      (production_id FK)

LogEntry
  ├── N:1  Production        (production_id FK)
  └── N:1  User              (user_id FK)
```

### Cast and Crew: JSONB, Not Join Tables

**Decision:** Cast and crew are stored as JSONB arrays on Production (`cast_members`) and Work (`creators`), not in separate `people`, `cast_credits`, or `crew_credits` join tables.

**Justification:** A normalized people/credits model (Person table + CastCredit join table + CrewCredit join table) is the "correct" relational design but adds significant schema complexity, migration burden, and query complexity for MVP. The JSONB approach:

- Stores `[{"name": "Cate Blanchett", "role": "Blanche DuBois"}]` directly on the Production record.
- Is queryable in Postgres: `SELECT * FROM productions WHERE cast_members @> '[{"name": "Cate Blanchett"}]'` with a GIN index.
- Avoids the N+1 join problem when rendering a production page.
- Matches the data quality reality: theatre credits data is sparse, inconsistent, and rarely available as structured person entities with stable IDs (track1-data-sources.md, "Gaps requiring manual entry").

**Post-MVP migration path:** When Transient has enough data to justify a People entity (for "all productions featuring Actor X" queries, director filmographies, etc.), the JSONB arrays can be migrated to a normalized schema:

```sql
-- Post-MVP: normalized people model
CREATE TABLE people (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  external_ids jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE production_credits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES productions(id),
  person_id     uuid NOT NULL REFERENCES people(id),
  role          text NOT NULL,
  credit_type   text NOT NULL CHECK (credit_type IN ('cast', 'crew'))
);
```

This migration is non-destructive — the JSONB data seeds the People table. But this is explicitly post-MVP.

---

## 6. Seeding Strategy

### Primary Seed Source: Wikidata (CC0, SPARQL API)

**Decision:** Wikidata is the primary source for seeding the Works catalog.

**Method:** Run SPARQL queries against `query.wikidata.org` to extract:

- All items typed as `Q25379` (play), `Q182659` (musical), `Q1344` (opera)
- For each: title, creators (P170 creator, P86 composer, P58 screenwriter), year (P4 inception), description, genre (P136)
- Store the Wikidata QID in `external_ids.wikidata_qid`

**Coverage:** Famous/canonical works (Shakespeare, Chekhov, Ibsen, Sondheim, major operas) are well-represented. Recent, fringe, and community theatre works are sparse to nonexistent (track1-data-sources.md, "Coverage assessment").

**Justification:** Wikidata is the only open, programmatically accessible source that models the work/production distinction with a CC0 license. It is the strongest candidate for bulk seeding (track1-data-sources.md, "Best sources for seeding the Transient catalog").

### Secondary Seed Source: MusicBrainz (CC0, REST API)

**Decision:** MusicBrainz enriches Work metadata for musicals and operas.

**Method:** For works with `media_type` in ('musical', 'opera'), look up the corresponding MusicBrainz Work entity via title/creator matching. Extract: composer, librettist, ISWC, MBID. Store in `external_ids.musicbrainz_mbid`.

**Justification:** MusicBrainz has strong work-level abstraction for musical theatre where a cast recording exists. Not useful for straight plays (track1-data-sources.md, MusicBrainz section).

### User-Generated Content for Everything Else

**Decision:** Productions and recent/fringe works are primarily user-created. The seed covers canonical Works only; the production catalog grows through user logging.

**Justification:** No open, API-accessible source exists for production-level data at scale. IBDB, Spectra, AboutTheArtists, and BroadwayWorld all lack APIs and/or prohibit data extraction (track1-data-sources.md). The user must be able to create a Work and a Production inline during the logging flow when no catalog match exists — the "can't find it? add it" pattern.

### Cross-Reference Identifiers to Store

| Identifier             | Entity           | Source          | Notes                                            |
| ---------------------- | ---------------- | --------------- | ------------------------------------------------ |
| `wikidata_qid`         | Work, Production | Wikidata SPARQL | Primary cross-reference (track1-data-sources.md) |
| `musicbrainz_mbid`     | Work             | MusicBrainz API | Musicals and operas only                         |
| `theatricalia_play_id` | Work             | Wikidata P1242  | Lookup via Wikidata; no direct Theatricalia API  |
| `ibdb_show_id`         | Production       | Manual entry    | Broadway productions; no API                     |

All stored in the `external_ids` JSONB field — extensible without schema changes.

---

## 7. Rating System

### Decision: Half-Star Scale, 0.5-5.0

**Scale:** 10 discrete values: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0.

**Storage:** `numeric(2,1)` in Postgres with a CHECK constraint enforcing the range and half-star increments.

**Display:** Star widget with half-star granularity (tap left half = half star, right half = full star).

**Aggregation (post-MVP):** Bayesian weighted average using the IMDb formula:

```
WR = (v / (v + m)) * R + (m / (v + m)) * C

v = number of ratings for this production
m = minimum ratings threshold (tune empirically; start with m = 5)
R = raw average rating for this production
C = mean rating across all productions (~3.5 expected)
```

This prevents productions with 1-2 ratings from dominating rankings (platform-research.md, Section 5, "Rating Systems Comparison").

**Justification:**

- Letterboxd uses 0.5-5.0 and it is the most praised aspect of their rating UX (platform-research.md, Section 1).
- RateYourMusic uses 0.5-5.0 and has 147M ratings with good distribution (platform-research.md, Section 4).
- Goodreads uses integer 1-5 and suffers from compressed distributions — 80% of books with 50+ ratings cluster between 3.5 and 4.2 (platform-research.md, Section 3, "Statistical problem"). Half-stars avoid this.
- Show-Score's move from 0-100 to 5-star emojis was universally criticized by its community — a cautionary tale about changing rating systems post-launch (track2-product-audit.md, Show-Score section). Start with the proven scale.

**Rating is optional.** A log entry does not require a rating. Users may log attendance without rating, or rate without reviewing — ratings, reviews, and diary entries are three separate concepts, following Letterboxd's proven design (platform-research.md, Section 1, "Key Design Insight").

---

## 8. Row-Level Security

Supabase RLS policies enforce data privacy at the database level.

```sql
-- Log entries: users can only read/write their own (unless public)
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own log entries"
  ON log_entries FOR SELECT
  USING (user_id = auth.uid() OR is_private = false);

CREATE POLICY "Users can insert their own log entries"
  ON log_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own log entries"
  ON log_entries FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own log entries"
  ON log_entries FOR DELETE
  USING (user_id = auth.uid());

-- Works and productions: readable by all, writable by authenticated users
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Works are publicly readable"
  ON works FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create works"
  ON works FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Productions are publicly readable"
  ON productions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create productions"
  ON productions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Wishlist: private to owner
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wishlist"
  ON wishlist_items FOR ALL
  USING (user_id = auth.uid());
```

**Justification:** "Private-first is table stakes. Users track theatre before they decide to share it." (track2-product-audit.md, Key Conclusions). RLS enforces this at the database level, not application code — a Supabase strength (track3-tech-evaluation.md, Section 3.1).

---

## 9. Complete Schema (Postgres/Supabase)

The complete migration, combining all entities, indexes, and RLS policies:

```sql
-- ============================================================
-- Transient: Complete Postgres Schema
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

## 10. Key Query Patterns

These are the queries the application will run most frequently, confirming the schema supports them efficiently:

```sql
-- 1. My diary (most recent first)
SELECT le.*, p.title_override, w.title AS work_title, p.venue
FROM log_entries le
JOIN productions p ON le.production_id = p.id
LEFT JOIN works w ON p.work_id = w.id
WHERE le.user_id = $1
ORDER BY le.date_seen DESC;
-- Uses: idx_log_entries_user_date

-- 2. All productions of a work
SELECT * FROM productions WHERE work_id = $1 ORDER BY year DESC;
-- Uses: idx_productions_work_id

-- 3. Search works by title
SELECT * FROM works
WHERE search_vector @@ plainto_tsquery('english', $1)
ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC
LIMIT 20;
-- Uses: idx_works_search (GIN)

-- 4. Most-logged productions (community stats, post-MVP)
SELECT p.id, w.title, p.venue, p.year, COUNT(*) AS log_count
FROM log_entries le
JOIN productions p ON le.production_id = p.id
LEFT JOIN works w ON p.work_id = w.id
WHERE le.is_private = false
GROUP BY p.id, w.title, p.venue, p.year
ORDER BY log_count DESC
LIMIT 20;
-- Uses: idx_log_entries_production

-- 5. My stats: shows per year
SELECT EXTRACT(YEAR FROM date_seen) AS year, COUNT(*) AS count
FROM log_entries
WHERE user_id = $1
GROUP BY year
ORDER BY year DESC;
-- Uses: idx_log_entries_user_id

-- 6. Search productions by venue + year (for logging flow disambiguation)
SELECT p.*, w.title AS work_title
FROM productions p
LEFT JOIN works w ON p.work_id = w.id
WHERE p.venue ILIKE $1 AND p.year = $2;
-- Uses: idx_productions_venue, idx_productions_year
```

---

## Sources

Every decision above cites its supporting research document. Full source list:

- `docs/research/track1-data-sources.md` — data source viability, identifier recommendations, seeding strategy
- `docs/research/track1-data-model-precedents.md` — two-level vs three-level analysis, edge case rulings, Model A recommendation
- `docs/research/track2-product-audit.md` — logging moment, minimum viable log entry, feature prioritization, private-first principle
- `docs/research/track3-tech-evaluation.md` — Supabase/Postgres recommendation, JSONB/array/tsvector capabilities, schema draft
- `docs/2026-04-05-platform-research.md` — Letterboxd rating/review/diary separation, Goodreads Work/Edition model, half-star rating scale evidence, Bayesian aggregation
