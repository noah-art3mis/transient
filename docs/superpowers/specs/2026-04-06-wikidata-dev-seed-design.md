# Wikidata Dev Seed Script

**Date:** 2026-04-06
**Purpose:** Dev tooling to seed a small (~200) Works dataset from Wikidata for local development and testing.

## Overview

A single `scripts/seed.ts` with two subcommands:

- `npx tsx scripts/seed.ts fetch` — queries Wikidata SPARQL, saves raw JSON locally
- `npx tsx scripts/seed.ts load` — transforms raw JSON to `WorkInsert[]`, inserts into Supabase

Raw Wikidata responses are stored on disk so data can be inspected/edited before loading, and loads can be re-run without re-fetching.

## Fetch Command

Sends 4 SPARQL queries to `https://query.wikidata.org/sparql` (one per category, `LIMIT 50` each):

| Category | Wikidata Class | `media_type` |
| -------- | -------------- | ------------ |
| Plays    | Q25379         | theatre      |
| Musicals | Q2743          | musical      |
| Operas   | Q1344          | opera        |
| Ballets  | Q476300        | dance        |

Each query fetches:

- `work` (QID URI)
- `workLabel` (title)
- `workDescription` (description)
- `creatorLabel` (creator name)
- `creatorRoleLabel` (creator role, e.g. "playwright", "composer")
- `inception` (year written, from `wdt:P571`)

Saves raw SPARQL JSON responses to `scripts/data/raw/{plays,musicals,operas,ballets}.json`.

Logs progress to stdout (e.g. "Fetched 50 plays").

## Load Command

Reads the 4 raw JSON files and transforms each item to `WorkInsert`:

| `WorkInsert` field | Source                                            |
| ------------------ | ------------------------------------------------- |
| `title`            | `workLabel`                                       |
| `media_type`       | Derived from which file the item came from        |
| `creators`         | `[{name: creatorLabel, role: creatorRoleLabel}]`  |
| `year_written`     | Parsed from `inception` (xsd:dateTime → year int) |
| `description`      | `workDescription`                                 |
| `external_ids`     | `{wikidata_qid: "Q12345"}` (extracted from URI)   |
| `creation_method`  | `"scripted"` (default)                            |

Multiple creators per work are grouped into the `creators` array.

### Duplicate handling

Before inserting, queries Supabase for existing works where `external_ids->>'wikidata_qid'` matches. Skips already-present works.

### Output

Logs to stdout: inserted count, skipped count, any errors.

## File Structure

```
scripts/
  seed.ts
  data/
    raw/
      plays.json
      musicals.json
      operas.json
      ballets.json
```

`scripts/data/` is added to `.gitignore` so raw dumps don't bloat the repo.

## Dependencies

No new runtime dependencies:

- `fetch` — native Node 18+
- `@supabase/supabase-js` — already installed

One new dev dependency:

- `tsx` — to run TypeScript directly (if not already present)

## SPARQL Query Shape

Each of the 4 queries follows this structure (example for plays):

```sparql
SELECT ?work ?workLabel ?workDescription ?creatorLabel ?creatorRoleLabel ?inception
WHERE {
  ?work wdt:P31 wd:Q25379.
  OPTIONAL { ?work wdt:P571 ?inception. }
  OPTIONAL {
    ?work wdt:P170 ?creator.
    OPTIONAL { ?creator wdt:P106 ?creatorRole. }
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 50
```

The `OPTIONAL` clauses ensure works without creators or dates are still returned.

Note: `P106` (occupation) is used as an approximation for creator role. The more precise approach would be `P170` with qualifier `P3831` (object has role), but occupation is sufficient for a dev seed dataset.

## Out of Scope

- MusicBrainz enrichment (future enhancement)
- Periodic sync / incremental updates
- Production data seeding (this is dev tooling only)
- Authentication beyond Supabase anon key
