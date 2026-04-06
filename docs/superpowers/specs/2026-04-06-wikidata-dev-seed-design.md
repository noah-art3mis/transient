# Wikidata Seed Script

**Date:** 2026-04-06
**Purpose:** Seed the Works catalog from Wikidata with all available theatrical works (~8,800 unique works).

## Overview

A single `scripts/seed.ts` with two subcommands:

- `npx tsx scripts/seed.ts fetch` — queries Wikidata SPARQL with pagination, saves raw JSON locally
- `npx tsx scripts/seed.ts load` — transforms raw JSON to `WorkInsert[]`, batch-inserts into Supabase

Raw Wikidata responses are stored on disk so data can be inspected/edited before loading, and loads can be re-run without re-fetching.

## Fetch Command

Sends paginated SPARQL queries to `https://query.wikidata.org/sparql` (500 results per page, 1-second delay between pages):

| Category | Wikidata Class | `media_type` | Subclass path | Approx. rows |
| -------- | -------------- | ------------ | ------------- | ------------ |
| Plays    | Q25379         | theatre      | Yes           | ~9,400       |
| Musicals | Q2743          | musical      | Yes           | ~65          |
| Operas   | Q1344          | opera        | Yes           | ~58          |
| Ballets  | Q476300        | dance        | No (timeouts) | ~725         |

Subclass path (`wdt:P31/wdt:P279*`) traverses the class hierarchy (e.g. tragedy, comedy are subclasses of play). Ballets use direct match (`wdt:P31`) because the subclass path times out on its large hierarchy.

Results are ordered by `DESC(?sitelinks)` (Wikipedia reference count) for notability ranking.

Each query fetches:

- `work` (QID URI)
- `workLabel` (title)
- `workDescription` (description)
- `creatorLabel` (creator name)
- `creatorRoleLabel` (creator role, e.g. "playwright", "composer")
- `inception` (year written, from `wdt:P571`)

Saves raw SPARQL JSON responses to `scripts/data/raw/{plays,musicals,operas,ballets}.json`.

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

### Filtering

Items with unresolved Wikidata labels (title is just a QID like `Q3212466`, meaning no English label exists) are filtered out during transformation.

### Duplicate handling

Before inserting, queries Supabase for existing works where `external_ids->>'wikidata_qid'` matches. Skips already-present works.

### Batch inserts

Works are inserted in batches of 200 rows per request for performance. Individual inserts over the REST API are too slow for thousands of works.

### Authentication

The load command requires `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) to bypass Row-Level Security. The RLS policy on `works` requires `auth.uid() IS NOT NULL` for inserts, which the anon key cannot satisfy.

### Output

Logs to stdout: inserted count, skipped count, any errors.

## File Structure

```
scripts/
  seed.ts
  transform.ts
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

- `tsx` — to run TypeScript directly

## SPARQL Query Shape

Each query follows this structure (example for plays, page 1):

```sparql
SELECT ?work ?workLabel ?workDescription ?creatorLabel ?creatorRoleLabel ?inception
WHERE {
  ?work wdt:P31/wdt:P279* wd:Q25379.
  ?work wikibase:sitelinks ?sitelinks.
  OPTIONAL { ?work wdt:P571 ?inception. }
  OPTIONAL {
    ?work wdt:P170 ?creator.
    OPTIONAL { ?creator wdt:P106 ?creatorRole. }
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?sitelinks)
LIMIT 500
OFFSET 0
```

The `OPTIONAL` clauses ensure works without creators or dates are still returned.

Note: `P106` (occupation) is used as an approximation for creator role. The more precise approach would be `P170` with qualifier `P3831` (object has role), but occupation is sufficient for the seed dataset.

## Out of Scope

- MusicBrainz enrichment (future enhancement)
- Periodic sync / incremental updates
- Production data seeding (works only)
