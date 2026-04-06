# Transient: Discovery & Decision Plan — Implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Research and document all open questions across three tracks (Data, Product, Tech) and converge on a data model, MVP scope, and tech stack — producing an app spec ready for a coding implementation plan.

**Architecture:** Three parallel research tracks feed into convergence documents. Each track produces a findings file in `docs/research/`. Convergence decisions are recorded in a final app spec.

**Research output:** `docs/research/` directory with one file per track, plus a final `docs/superpowers/specs/YYYY-MM-DD-transient-app-spec.md`.

---

### Task 1: Research Theatre Databases and APIs

**Files:**

- Create: `docs/research/track1-data-sources.md`

- [ ] **Step 1: Research IBDb (Internet Broadway Database)**

Search for IBDb's API availability, data coverage, and terms of use. Document:

- Does it have a public API?
- What entities does it model? (shows, productions, people, venues)
- Coverage scope (Broadway only? Off-Broadway? Tours?)
- Data format and access method

- [ ] **Step 2: Research Theatricalia**

Search for Theatricalia (theatricalia.com). Document:

- Is it still active/maintained?
- Does it have an API?
- What data does it expose?
- Does it distinguish between works and productions?

- [ ] **Step 3: Research Wikidata for theatre**

Search for how Wikidata models theatrical works. Document:

- What properties exist for plays, musicals, operas?
- Does Wikidata distinguish work vs production vs performance?
- What's the SPARQL query to pull theatre works?
- How complete is coverage?

- [ ] **Step 4: Research MusicBrainz for classical music**

Search for how MusicBrainz models classical music works. Document:

- Work vs recording vs release distinction
- API availability and rate limits
- Relevance for the theatre use case (musicals, operas)

- [ ] **Step 5: Search for other theatre databases**

Search for: theatre database API, performing arts catalog, live performance database. Look for any other sources not covered above (e.g., Playbill, Broadway World data, IMSLP for scores, national theatre archives).

- [ ] **Step 6: Write findings document**

Create `docs/research/track1-data-sources.md` with a summary table:

```markdown
# Track 1: Data Sources Research

## Summary Table

| Source | Has API? | Work/Production distinction? | Coverage | Viable? |
| ------ | -------- | ---------------------------- | -------- | ------- |
| IBDb   | ...      | ...                          | ...      | ...     |
| ...    | ...      | ...                          | ...      | ...     |

## Detailed Findings

### IBDb

[findings]

### Theatricalia

[findings]

### Wikidata

[findings]

### MusicBrainz

[findings]

### Other Sources

[findings]

## Conclusion

- Best source(s) for seeding:
- Gaps that need manual entry:
- Standard identifiers found (if any):
```

- [ ] **Step 7: Commit**

```bash
git add docs/research/track1-data-sources.md
git commit -m "research: document theatre database and API findings"
```

---

### Task 2: Research Data Model Precedents

**Files:**

- Create: `docs/research/track1-data-model-precedents.md`

- [ ] **Step 1: Analyze how Letterboxd models films**

Document the Letterboxd data model as a reference point:

- Film (title, year, director, cast, genres, runtime, poster, synopsis)
- Review (rating, text, date watched, liked)
- List (title, description, ordered films)
- Diary entry (date, film, rating, review, rewatch flag)

- [ ] **Step 2: Analyze how existing theatre platforms model data**

Based on Task 1 findings, document how each source models the work/production distinction. If none do, note that — it's a significant finding.

- [ ] **Step 3: Draft candidate data models**

Sketch two candidate models in the document:

**Model A — Two-level (Work + Production):**

```
Work: title, playwright, year_written, genre, description
Production: work_id, company, venue, director, cast, year, dates, poster
LogEntry: production_id, date_seen, rating, review, tags
```

**Model B — Three-level (Work + Production + Performance):**

```
Work: title, playwright, year_written, genre, description
Production: work_id, company, venue, director, cast, year, season
Performance: production_id, date, time, specific_cast
LogEntry: performance_id, rating, review, tags
```

For each, note:

- What edge cases it handles well (touring shows, understudies, revivals)
- What it struggles with (devised work, improvised shows, circus)
- Complexity cost

- [ ] **Step 4: Document edge cases**

List specific edge cases and how each model handles them:

- Adaptation chains (Romeo and Juliet → West Side Story → WSS 2021 film)
- Touring productions (same production, different venues)
- Revivals (same work, same company, decades apart)
- Devised/collective creation (no single playwright)
- Site-specific work (the venue IS the work)
- Circus/variety (no "script" or single author)

- [ ] **Step 5: Commit**

```bash
git add docs/research/track1-data-model-precedents.md
git commit -m "research: document data model precedents and candidates"
```

---

### Task 3: Audit Letterboxd and Competitor UX

**Files:**

- Create: `docs/research/track2-product-audit.md`

- [ ] **Step 1: Audit Letterboxd's core UX**

Use Letterboxd (or research its interface) and document:

- The logging flow (how many taps/clicks from "I saw this" to "logged")
- Film page layout (what info, in what order)
- Diary view (how past logs are displayed)
- Search and discovery (browse by genre, year, popularity, lists)
- Social features (following, feed, likes)
- Lists (how they work, user-created vs curated)
- Stats page (what's tracked, how it's visualized)

For each, note: does this translate to theatre? What breaks?

- [ ] **Step 2: Audit existing theatre/performing arts apps**

Research ShowScore, BroadwayWorld, Scenesational, and any others found. For each:

- What can you do? (log, rate, review, discover, browse)
- What's the data model? (do they have work vs production?)
- What's missing compared to Letterboxd?
- What do they do well that Letterboxd doesn't?

- [ ] **Step 3: Research how people currently track theatre**

Search for: theatre spreadsheet tracker, notion theatre log, theatre diary app. Document common patterns people use when no dedicated tool exists — this reveals what features matter most.

- [ ] **Step 4: Define the logging moment**

Write a short narrative of the target user flow:

- You leave a theatre. What do you want to log and when?
- What information do you have (show name, venue, date)?
- What would you need to look up (director, playwright, cast)?
- What's the minimum viable log entry? (just "I saw this" with a date?)
- What's the rich log entry? (rating, review, tags, photos, who you went with?)

- [ ] **Step 5: Write findings document**

Create `docs/research/track2-product-audit.md`:

```markdown
# Track 2: Product & UX Audit

## Letterboxd — What Works

[findings]

## Letterboxd — What Doesn't Translate

[findings]

## Competitor Audit

[table of apps and features]

## How People Track Theatre Today

[findings from spreadsheet/Notion research]

## The Logging Moment

[narrative user flow]

## Feature Candidates

Ranked list of features from most to least essential:

1. ...
2. ...
```

- [ ] **Step 6: Commit**

```bash
git add docs/research/track2-product-audit.md
git commit -m "research: audit Letterboxd and theatre app UX"
```

---

### Task 4: Evaluate Tech Stack Options

**Files:**

- Create: `docs/research/track3-tech-evaluation.md`

- [ ] **Step 1: Evaluate React Native + Expo for web + mobile**

Research:

- Current state of Expo for web (expo-router, web support maturity)
- React Native for Web — what works, what doesn't
- Alternatives: Tamagui, Solito (if still relevant in 2026)
- Can you ship a usable web app AND mobile app from one codebase?
- What UI library works well cross-platform? (e.g., Tamagui, NativeWind, React Native Paper)

- [ ] **Step 2: Evaluate backend options**

Research each option for a personal project with relational data:

**Supabase:**

- Free tier limits (rows, storage, API calls)
- Postgres underneath — good for relational Work→Production model
- Auth, storage, realtime included
- Self-hosting option

**PocketBase:**

- Single binary, self-hostable
- SQLite underneath
- Simpler but less ecosystem

**Firebase/Firestore:**

- Document model — fits poorly for relational data?
- Free tier limits
- Vendor lock-in concerns

**Custom (e.g., Express/Fastify + Postgres):**

- Full control, more setup work
- Hosting costs (Railway, Fly.io, self-hosted)

- [ ] **Step 3: Evaluate database modeling**

Using the candidate data models from Task 2, sketch how each would look in:

- Postgres (tables, foreign keys, joins)
- SQLite (same, but single-file, local-first potential)
- Firestore (collections, subcollections, denormalization)

Note query patterns that matter: "all productions of a work", "my diary sorted by date", "search works by playwright", "most-logged productions".

- [ ] **Step 4: Evaluate hosting and cost**

For a personal project with one user:

- Supabase free tier: what do you get?
- Vercel/Netlify for web frontend: free tier?
- Fly.io / Railway for custom backend: cost?
- Self-hosting on a VPS: cost and effort?
- App store deployment: Apple Developer ($99/yr), Google Play ($25 one-time) — worth it or just use web?

- [ ] **Step 5: Write findings document**

Create `docs/research/track3-tech-evaluation.md`:

```markdown
# Track 3: Tech Stack Evaluation

## Frontend Framework

| Option | Web Support | Mobile Support | DX  | Verdict |
| ------ | ----------- | -------------- | --- | ------- |
| Expo   | ...         | ...            | ... | ...     |

## Backend

| Option     | Free Tier | Relational? | Self-Host? | Verdict |
| ---------- | --------- | ----------- | ---------- | ------- |
| Supabase   | ...       | ...         | ...        | ...     |
| PocketBase | ...       | ...         | ...        | ...     |
| Firebase   | ...       | ...         | ...        | ...     |
| Custom     | ...       | ...         | ...        | ...     |

## Database Modeling

[Postgres vs SQLite vs Firestore comparison for our data model]

## Hosting & Cost

[Cost breakdown for a single-user personal project]

## Recommendation

- Frontend: ...
- Backend: ...
- Database: ...
- Hosting: ...
- Rationale: ...
```

- [ ] **Step 6: Commit**

```bash
git add docs/research/track3-tech-evaluation.md
git commit -m "research: evaluate tech stack options"
```

---

### Task 5: Converge on Data Model

**Files:**

- Create: `docs/research/convergence1-data-model.md`

**Depends on:** Tasks 1, 2, 3 (need findings from all three tracks)

- [ ] **Step 1: Review findings from all tracks**

Read:

- `docs/research/track1-data-sources.md` — what metadata is actually available
- `docs/research/track1-data-model-precedents.md` — candidate models and edge cases
- `docs/research/track2-product-audit.md` — what the UX needs from the data

- [ ] **Step 2: Make data model decisions**

Write `docs/research/convergence1-data-model.md` documenting each decision:

- **Model depth:** Two-level or three-level? (Justify with findings)
- **Core entities and fields:** Exact fields for Work, Production, LogEntry (and Performance if three-level)
- **Required vs optional fields:** What must every entry have?
- **Edge case rulings:**
  - How to handle adaptations
  - How to handle touring productions
  - How to handle devised/authorless work
  - How to handle non-theatre media (classical music, circus)
- **Relationships:** How entities link (foreign keys, many-to-many for cast/crew)
- **Seeding strategy:** Based on what data sources are viable

- [ ] **Step 3: Commit**

```bash
git add docs/research/convergence1-data-model.md
git commit -m "decision: converge on data model design"
```

---

### Task 6: Converge on MVP Scope

**Files:**

- Create: `docs/research/convergence2-mvp-scope.md`

**Depends on:** Tasks 3, 4, 5 (need UX audit, tech evaluation, and data model)

- [ ] **Step 1: Review all findings**

Read:

- `docs/research/track2-product-audit.md` — feature candidates ranked by importance
- `docs/research/track3-tech-evaluation.md` — what the tech supports easily vs with effort
- `docs/research/convergence1-data-model.md` — what the data model supports

- [ ] **Step 2: Define MVP scope**

Write `docs/research/convergence2-mvp-scope.md`:

```markdown
# MVP Scope

## In v1

[Features that make the cut, with brief justification]

- ...

## Deferred to v2+

[Features explicitly cut, with reason]

- ...

## Core Screens (v1)

1. ...
2. ...

## Rating/Logging Format

[Final decision on rating system and log entry fields]

## Data Seeding Plan

[Start empty / import from X / manual entry workflow]
```

- [ ] **Step 3: Commit**

```bash
git add docs/research/convergence2-mvp-scope.md
git commit -m "decision: define MVP scope for Transient v1"
```

---

### Task 7: Write App Spec

**Files:**

- Create: `docs/superpowers/specs/YYYY-MM-DD-transient-app-spec.md` (use actual date)

**Depends on:** Tasks 5, 6 (data model and MVP scope must be decided)

- [ ] **Step 1: Combine all decisions into a single app spec**

This is the document that will feed into a coding implementation plan. It should contain:

- Product overview (one paragraph)
- Data model (exact entities, fields, relationships)
- Feature list (from MVP scope)
- Screen descriptions (from MVP scope + UX audit insights)
- Tech stack (from tech evaluation recommendation)
- Rating/logging system design
- Search and entry creation flow
- Non-goals (explicitly deferred features)

- [ ] **Step 2: Self-review the spec**

Check for:

- Placeholders or TBDs
- Contradictions between sections
- Ambiguous requirements
- Scope creep beyond MVP

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/YYYY-MM-DD-transient-app-spec.md
git commit -m "spec: complete app specification for Transient v1"
```

- [ ] **Step 4: User review**

Ask the user to review the app spec. Once approved, this feeds into a new writing-plans cycle to produce the coding implementation plan.
