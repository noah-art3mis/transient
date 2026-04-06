# Track 1: Data Model Precedents

**Date:** 2026-04-05
**Purpose:** Survey how existing platforms model performing arts data; draft candidate data models for Transient.

---

## 1. Letterboxd as Reference Point

Letterboxd is the clearest UX and data model precedent for Transient. Its entities and their relationships are:

### Film

The central canonical entity. Metadata is sourced from TMDB (The Movie Database) rather than maintained internally.

Fields:
- `title` (string)
- `year` (integer — release year)
- `directors` (array of people)
- `cast` (array of people with role/character)
- `crew` (array of people with function)
- `genres` (array)
- `runtime` (integer, minutes)
- `poster` (image URL, from TMDB)
- `synopsis` (text, from TMDB)
- `countries` (array)
- `languages` (array)
- `studio` (array of companies)
- `letterboxd_id` / `tmdb_id` (identifiers)
- `average_rating` (computed, not stored per-film)

Film is essentially a work-level entity. There is no production-level entity in Letterboxd — a film has one canonical release identity (or a small number of versions, e.g., director's cut tracked as a separate film). This is a clean model for cinema because the primary object of interest is the recorded artifact, which is fixed.

### Review (Log Entry)

A log entry in Letterboxd can be a diary entry, a review, or both simultaneously.

Fields:
- `film_id` (foreign key)
- `member_id` (foreign key)
- `rating` (0.5–5.0 in half-star increments, or null)
- `text` (review body, optional)
- `date_watched` (date, required for diary entry)
- `date_logged` (date, the date recorded on the platform)
- `liked` (boolean flag)
- `rewatch` (boolean flag)
- `tags` (array of user-defined strings)
- `contains_spoilers` (boolean)

A single member can log the same film multiple times (diary mode tracks each viewing separately). Reviews are public-facing text entries that may or may not be tied to a diary date.

### List

Fields:
- `title` (string)
- `description` (text, optional)
- `entries` (ordered array of film references)
- `ranked` (boolean — whether the list is a ranked/numbered list)
- `tags` (array)
- `member_id` (foreign key)

Lists are user-curated. Films within a list can include a per-entry note.

### Diary Entry (as distinct from Review)

The diary is a filtered view of log entries where `date_watched` is set. Not a separate entity — it is the same log entry record. The diary renders as a calendar/chronological view.

### People

- `name` (string)
- `tmdb_id`

People are not a strong entity in Letterboxd for users — they are mostly metadata attached to films sourced from TMDB. Users cannot "follow" a director in a structured data sense (only informally via film lists).

---

### Key Takeaway from Letterboxd

Letterboxd works cleanly because **cinema has no work/production distinction that matters to the user**. A film is fixed: the same print shown in 1,000 cinemas is the same object. This is fundamentally unlike theatre, where the same work (e.g., "Hamlet") staged by different companies, at different venues, with different casts, is a meaningfully distinct experience each time.

Transient must introduce the production level that Letterboxd does not need.

---

## 2. How Existing Theatre Platforms Model the Work/Production Distinction

### 2.1 Wikidata

**Model type:** Explicit two-level separation (Work + Production)

Wikidata's WikiProject Performing Arts uses a documented data structure that separates:

- **Abstract work** (play, musical, opera): typed as `Q25379` (play), `Q182659` (musical), `Q1344` (opera). Carries title, playwright/composer, year written/premiered, genre.
- **Performing arts production**: typed as `Q43099500` (performing arts production), `Q7777570` (theatrical production), `Q59163902` (musical production), etc. Carries director, cast, venue, dates, company. Points back to the abstract work.

This is a two-level model. Individual performances within a production run are not modelled as distinct entities — they are collapsed into the production. A touring production that visits multiple venues is a modelling challenge: Wikidata typically creates separate production items per venue leg.

Wikidata notes its own tension: the `performing arts production` class conflates work and event sub-classes, because properties like `cast member` (P1040) can vary performance by performance (understudies), but Wikidata has no per-performance entity to attach this to.

**Finding:** Wikidata knows it needs a third level (performance/event) but does not implement it.

### 2.2 Theatricalia

**Model type:** Explicit two-level separation (Play + Production)

Theatricalia has a `Play` entity (the abstract work) and a separate `Production` entity (a specific staging). This is the closest structural match to what Transient needs.

Additional structural notes from the codebase and documentation:
- Venues (Places) can have a parent/child hierarchy — a specific stage within a venue is a child of the venue. Productions are attached to a specific place (stage-level if known).
- Places support alternative names with date ranges (e.g., a theatre renamed over its history).
- No per-performance entity — individual nights are not tracked.
- No user log entry system (Theatricalia is a reference database, not a personal tracking tool).

**Finding:** Theatricalia implements exactly the Work → Production two-level model with no Performance level and no user-facing log entry layer.

### 2.3 IBDB (Internet Broadway Database)

**Model type:** Production-only (no work abstraction)

Each IBDB entry is a specific Broadway run (production). Multiple productions of the same show are linked by show title but there is no explicit abstract work entity — the show name is the implicit grouping key, not a first-class entity with its own metadata.

**Finding:** Production-centric. No work-level abstraction. This is a significant design gap: you cannot easily query "all productions of Hamlet" except by searching the show title string, and there is no place to store work-level metadata (playwright, year written, original language) independently of any specific production.

### 2.4 Spectra.theater / IOBDB (Off-Broadway)

**Model type:** Production-only (no work abstraction)

Similar to IBDB. Production records list credits (title page credits), cast, understudies, staff, venues, and dates. No explicit play/work entity.

**Finding:** Same gap as IBDB. Production-centric only.

### 2.5 MusicBrainz (musicals and operas)

**Model type:** Three-level (Work → Recording → Release), but the second level is audio-specific

MusicBrainz has:
- **Work** — the abstract intellectual creation (opera, musical, song). Has composer, librettist, ISWC, premiere year, genre.
- **Recording** — a specific audio capture (a cast recording session).
- **Release** — the published product (the cast recording album).

For theatre: works with hierarchical parts (opera acts, arias). Productions exist conceptually but are not modelled — only when a production has been recorded and released as a cast recording does it appear in MusicBrainz (as a Release).

**Finding:** Strong work-level abstraction. No staging/production data. Not a theatre production database; a music recording database.

### 2.6 Summary Table

| Platform | Work entity | Production entity | Performance entity | User log |
|---|---|---|---|---|
| Letterboxd | Film (= work) | None | None | Yes |
| Wikidata | Yes | Yes | No | No |
| Theatricalia | Yes (Play) | Yes | No | No |
| IBDB | No | Yes | No | No |
| Spectra / IOBDB | No | Yes | No | No |
| MusicBrainz | Yes | No (audio-only) | No | No |

**Significant finding:** No existing platform implements the full three-level model (Work → Production → Performance) for theatre. The two-level model (Work → Production) is the most common pattern among the platforms that model the distinction at all. Platforms that lack a work entity are production databases, not theatrical knowledge graphs.

---

## 3. Candidate Data Models for Transient

### Model A — Two-Level (Work + Production)

```
Work
  - id
  - title
  - playwright (or "devised by" / "book by" / "music by")
  - year_written (nullable — devised work may have no fixed year)
  - genre (array — play, musical, opera, dance, physical theatre, circus, etc.)
  - description (text)
  - wikidata_qid (external identifier)
  - mbid (MusicBrainz, for musicals/operas)
  - theatricalia_play_id

Production
  - id
  - work_id (FK → Work, nullable for devised/new work)
  - title_override (optional — for renamed adaptations or bills)
  - company (string or FK → Company)
  - venue (string or FK → Venue)
  - director (string or array of FK → Person)
  - cast (array of {person, role})
  - year (integer)
  - start_date (date, nullable)
  - end_date (date, nullable)
  - poster (image)
  - wikidata_qid
  - ibdb_show_id

LogEntry
  - id
  - production_id (FK → Production)
  - user_id (FK → User)
  - date_seen (date)
  - rating (nullable, e.g. 1–10 or 0.5–5.0)
  - review (text, optional)
  - liked (boolean)
  - tags (array)
  - rewatch (boolean)
```

**Edge cases handled well:**
- **Touring productions:** A tour with a fixed cast and creative team but multiple venues can be modelled as a single Production with the primary/opening venue recorded; venue changes are a known limitation or addressed by a `venue_legs` sub-table.
- **Revivals:** The same Work gets a new Production. The Work → Production one-to-many relationship handles this cleanly.
- **Understudies:** Cast at the production level reflects the credited/official cast. Specific understudy performances are not tracked (acceptable for a personal log — you note who you actually saw in your review text).

**Edge cases it struggles with:**
- **Devised/collective creation:** `playwright` field becomes awkward. Can be nulled or replaced with a free-text `creators` field, but the data model implies an author, which biases toward scripted work.
- **Improvised/variety shows:** No "script" and no fixed repeat-identical performances. A show like a Comedy Store set is not a production in the traditional sense.
- **Circus:** Genre tag helps, but "work" doesn't make sense for a Big Apple Circus season — there is no underlying script.
- **Site-specific work:** Venue is part of the artistic identity, but the model treats venue as metadata rather than a defining characteristic of the work.
- **Touring complexity:** A tour that changes cast between legs (e.g., replacement leads, regional cast) is hard to represent in a single Production — the cast field would be either misleading (original cast only) or incomplete.

**Complexity cost:** Low. The two-entity core (Work + Production) is easy to implement, easy to explain to users, and mirrors Theatricalia's working model. Most users will not encounter the edge cases. It is the correct starting model for an MVP.

---

### Model B — Three-Level (Work + Production + Performance)

```
Work
  - id
  - title
  - playwright
  - year_written
  - genre (array)
  - description
  - wikidata_qid
  - mbid

Production
  - id
  - work_id (FK → Work, nullable)
  - company
  - venue
  - director
  - cast (array of {person, role} — the "official" or opening-night cast)
  - year
  - season (e.g., "2025/26 season")
  - start_date
  - end_date
  - poster
  - wikidata_qid

Performance
  - id
  - production_id (FK → Production)
  - date (date)
  - time (time, nullable)
  - specific_cast (array of {person, role} — overrides production cast if known)
  - notes (e.g., "press night", "understudy performance")

LogEntry
  - id
  - performance_id (FK → Performance)
  - user_id (FK → User)
  - rating (nullable)
  - review (text)
  - liked (boolean)
  - tags (array)
```

**Edge cases handled well:**
- **Understudies:** The Performance entity can record the actual cast seen on that specific night, including understudy details. This is the primary motivation for adding the third level.
- **Press nights / special performances:** Can be flagged as distinct Performance records with notes.
- **Multiple viewings of the same production:** Each viewing attaches to its own Performance, so if a user saw a show twice (once with the lead, once with the understudy), both LogEntries are attached to distinct Performance records.

**Edge cases it still struggles with:**
- **Devised/improvised work:** Same as Model A — the Work entity still implies a fixed script.
- **Circus/variety:** Same as Model A.
- **Data availability:** In practice, users will almost never know the specific cast from their exact performance night unless the theatre provides cast sheets. Most people do not retain their programme. This means Performance records will usually be empty shells (date only) with no cast data, making the added complexity largely theoretical.
- **User burden:** Logging now requires knowing which Production and which Performance. This adds friction vs. Model A where you log against the Production and fill in what you remember.

**Complexity cost:** Significantly higher. Three entity levels instead of two, plus the join from LogEntry now goes through Performance → Production → Work. Query complexity increases. Most of the value (understudy tracking) will rarely be used in practice. The data to populate it (per-performance cast sheets) is almost never machine-readable or publicly available.

---

### Comparison

| Criterion | Model A (2-level) | Model B (3-level) |
|---|---|---|
| Implements core use case | Yes | Yes |
| Touring productions | Partial | Partial |
| Understudy tracking | No (review text only) | Yes (if data available) |
| Revivals | Clean | Clean |
| Devised work | Awkward | Awkward |
| Circus/variety | Awkward | Awkward |
| Implementation complexity | Low | High |
| User logging friction | Low | Medium |
| Data availability | Good | Limited (per-performance data rare) |
| Right for MVP | Yes | No |

**Recommendation:** Start with Model A. The Performance level can be added later as an optional extension if there is demonstrated user need (i.e., if a meaningful number of users want to track understudy performances). Premature introduction of the Performance entity adds complexity without proportionate benefit given that the raw data (per-performance cast sheets) is almost never available in machine-readable form.

---

## 4. Edge Case Analysis

### 4.1 Adaptation Chains

Example: *Romeo and Juliet* (Shakespeare, ~1594) → *West Side Story* (Bernstein/Sondheim, 1957) → *West Side Story* (Spielberg, 2021 film)

**Model A / B handling:**
- *Romeo and Juliet* is a Work.
- *West Side Story* is a separate Work (it is a sufficiently distinct new work — new book, music, lyrics, setting). It does not inherit from R&J in the schema; the relationship is documented in the `description` field or via a future `adapted_from` FK.
- The 2021 Spielberg film is out of Transient's scope (it is a film, not a stage production). If Transient ever expands beyond theatre, it would be a separate Work with a different medium flag.
- A stage production of the 2021 film adaptation (if staged) would be a Production under the *West Side Story* Work, not a new Work.

**Gap:** Neither model has an `adapted_from` or `based_on` Work FK. This could be added to the Work entity without structural disruption. Wikidata uses `P144` (based on) and `P941` (inspired by) for this relationship.

### 4.2 Touring Productions

Example: The RSC's production of *Henry V* opens in Stratford-upon-Avon, then transfers to the Barbican, then goes on a UK tour to five regional venues.

**Model A handling:** One Production record with `venue = "RSC Barbican"` (or the opening venue). Touring legs can be represented as a `venue_legs` sub-table (venue + start/end date), or — more simply — as separate Production records per major leg with a `touring_group_id` linking them. Neither is perfect.

**Model B handling:** Same issue. Performance records help track which venue a specific night was at, but only if the user logs date + venue together.

**Best practical approach:** Allow Production to have multiple venue records (a one-to-many Venue relationship with dates). Flag productions as `is_touring: boolean`. For a personal log, users can note in review text which venue leg they attended.

### 4.3 Revivals

Example: *Oklahoma!* at the National Theatre in 2019 vs. *Oklahoma!* on Broadway in 1943.

**Model A / B handling:** Clean. Both are Productions of the same Work (*Oklahoma!*). The Work carries `year_written = 1943`, `playwright = "Rodgers and Hammerstein"`. Each Production has its own director, cast, venue, dates. No ambiguity.

**This is the core use case Model A handles perfectly.** Revivals are the strongest argument for having a Work entity at all.

### 4.4 Devised/Collective Creation

Example: A verbatim theatre piece devised collaboratively by an ensemble of 12 performers with a facilitator, no single author.

**Model A / B handling:** The `playwright` field on Work is awkward. Options:
- Null the field and use `description` to note devised creation.
- Replace `playwright` with a more general `creators` field (free text or array of people with roles).
- Add a `creation_method` flag: `scripted | devised | improvised | found text | other`.

**Recommendation:** Rename `playwright` to `creators` (array of {person, role}) where role can be "playwright", "book by", "music by", "lyrics by", "devised by", "concept by", etc. This handles both traditional and devised work in one field without loss of information.

### 4.5 Site-Specific Work

Example: Punchdrunk's *Sleep No More* — performed in a converted warehouse (The McKittrick Hotel, New York), where the architecture IS the artistic medium.

**Model A / B handling:** The Venue field on Production records the location. But site-specific work often cannot transfer to another venue without becoming a different work. The model treats venue as metadata when for site-specific work it is essential identity.

**Partial solution:** A `site_specific: boolean` flag on Production, with a strong convention that site-specific productions should NOT be grouped under a generic Work if the venue is inseparable from the piece. The Work itself might be titled with the venue in mind, or the Work might not exist as a separate entity (Production-only entry with `work_id = null`).

### 4.6 Circus and Variety

Example: Cirque du Soleil's *Alegría* — a touring show with acrobatics, clown acts, music. No playwright. No script in the theatrical sense.

**Model A / B handling:** `genre = ["circus"]` on the Work. `playwright = null`. `description` describes the production concept.

The Work entity is awkward here because Cirque tours frequently revive and recast their shows. *Alegría* has had multiple distinct productions (original 1994 tour, 2019 revival with redesigned costumes). These are meaningfully distinct enough that both Work and Production entities are appropriate — but the Work has no author.

**Recommendation:** The `creators` array (as recommended above) with role = "director" or "conceived by" or "choreographer" works here. The Work entity represents the creative concept; the Production represents a specific tour iteration.

---

## 5. Recommended Data Model for Transient MVP

Based on the analysis above, Model A (two-level: Work + Production) with the following modifications:

- Rename `playwright` → `creators` (array of {person, role}) to handle devised and musical theatre work
- Add `creation_method` flag to Work: `scripted | devised | other`
- Add `adapted_from` FK (nullable, self-referential on Work) for adaptation chains
- Add `is_touring` boolean to Production
- Add `external_ids` JSONB field on both Work and Production for flexible identifier storage (Wikidata QID, MBID, IBDB ID, Theatricalia ID, etc.)
- Keep LogEntry at the Production level (not Performance level) for MVP

The Performance level (Model B) is explicitly deferred. If user demand emerges for understudy/specific-night tracking, it can be layered in as an optional field on LogEntry (`specific_cast_notes: text`) before committing to a full Performance entity.

---

## Sources

- [Letterboxd API documentation](https://api-docs.letterboxd.com/)
- [Letterboxd — Film data](https://letterboxd.com/about/film-data/)
- [Wikidata WikiProject Performing Arts — Data structure](https://www.wikidata.org/wiki/Wikidata:WikiProject_Performing_arts/Data_structure)
- [Wikidata — performing arts production (Q43099500)](https://www.wikidata.org/wiki/Q43099500)
- [Theatricalia on GitHub (dracos/Theatricalia)](https://github.com/dracos/Theatricalia)
- [Journal of Open Humanities Data — Developing a Data Model for Theatre Productions in a Wikibase Instance](https://openhumanitiesdata.metajnl.com/articles/10.5334/johd.434)
- `docs/research/track1-data-sources.md` — Track 1 data sources research (this project)
