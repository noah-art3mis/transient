# Wikidata Dev Seed Script — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a CLI script that fetches ~200 theatrical works from Wikidata and loads them into the local Supabase database for development.

**Architecture:** Single entry point `scripts/seed.ts` with `fetch` and `load` subcommands. Transform logic lives in `scripts/transform.ts` for testability. Fetch saves raw SPARQL JSON to disk; load reads, transforms, and inserts into Supabase.

**Tech Stack:** TypeScript, tsx (runner), native fetch, @supabase/supabase-js

---

## File Structure

| File | Responsibility |
| ---- | -------------- |
| `scripts/seed.ts` | CLI entry point, fetch command (SPARQL queries + file I/O), load command (read files + insert via Supabase) |
| `scripts/transform.ts` | Pure functions: `extractQid`, `parseYear`, `transformRawToWorkInserts`. Also exports `SparqlResponse` and `SparqlBinding` types |
| `__tests__/scripts/transform.test.ts` | Unit tests for transform functions |
| `scripts/data/raw/*.json` | Raw SPARQL responses (gitignored) |

---

## Task 1: Project Setup

**Files:**
- Modify: `.gitignore`
- Create: `scripts/data/raw/` (directory)

- [ ] **Step 1: Install tsx**

```bash
npm install --save-dev tsx
```

Expected: tsx added to devDependencies in package.json.

- [ ] **Step 2: Create data directory**

```bash
mkdir -p scripts/data/raw
```

- [ ] **Step 3: Add scripts/data/ to .gitignore**

Append to `.gitignore`:

```
# seed script data
scripts/data/
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore package.json package-lock.json
git commit -m "chore: add tsx and seed script data directory"
```

---

## Task 2: Transform Utilities (TDD)

**Files:**
- Create: `scripts/transform.ts`
- Create: `__tests__/scripts/transform.test.ts`

### extractQid

- [ ] **Step 1: Write failing test for extractQid**

Create `__tests__/scripts/transform.test.ts`:

```typescript
import { extractQid } from "../../scripts/transform";

describe("extractQid", () => {
  it("extracts QID from Wikidata entity URI", () => {
    expect(extractQid("http://www.wikidata.org/entity/Q192")).toBe("Q192");
  });

  it("extracts QID from HTTPS URI", () => {
    expect(extractQid("https://www.wikidata.org/entity/Q12345")).toBe("Q12345");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- --testPathPattern=transform
```

Expected: FAIL — `Cannot find module '../../scripts/transform'`

- [ ] **Step 3: Implement extractQid**

Create `scripts/transform.ts`:

```typescript
export function extractQid(uri: string): string {
  return uri.split("/").pop()!;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- --testPathPattern=transform
```

Expected: PASS — 2 tests passing.

### parseYear

- [ ] **Step 5: Write failing test for parseYear**

Add to `__tests__/scripts/transform.test.ts`:

```typescript
import { extractQid, parseYear } from "../../scripts/transform";

// ... existing extractQid tests ...

describe("parseYear", () => {
  it("parses year from xsd:dateTime string", () => {
    expect(parseYear("1600-01-01T00:00:00Z")).toBe(1600);
  });

  it("returns null for undefined", () => {
    expect(parseYear(undefined)).toBeNull();
  });

  it("parses negative years (BCE)", () => {
    expect(parseYear("-0472-01-01T00:00:00Z")).toBe(-472);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npm run test -- --testPathPattern=transform
```

Expected: FAIL — `parseYear is not a function` (or not exported)

- [ ] **Step 7: Implement parseYear**

Add to `scripts/transform.ts`:

```typescript
export function parseYear(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^(-?\d+)/);
  return match ? parseInt(match[1], 10) : null;
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
npm run test -- --testPathPattern=transform
```

Expected: PASS — 5 tests passing.

### transformRawToWorkInserts

- [ ] **Step 9: Write failing tests for transformRawToWorkInserts**

Add to `__tests__/scripts/transform.test.ts`:

```typescript
import {
  extractQid,
  parseYear,
  transformRawToWorkInserts,
  SparqlResponse,
} from "../../scripts/transform";

// ... existing tests ...

describe("transformRawToWorkInserts", () => {
  it("groups multiple creators for the same work", () => {
    const raw: SparqlResponse = {
      results: {
        bindings: [
          {
            work: { type: "uri", value: "http://www.wikidata.org/entity/Q192" },
            workLabel: { type: "literal", value: "Hamlet" },
            workDescription: { type: "literal", value: "tragedy by Shakespeare" },
            creatorLabel: { type: "literal", value: "William Shakespeare" },
            creatorRoleLabel: { type: "literal", value: "playwright" },
            inception: { type: "literal", value: "1600-01-01T00:00:00Z" },
          },
          {
            work: { type: "uri", value: "http://www.wikidata.org/entity/Q192" },
            workLabel: { type: "literal", value: "Hamlet" },
            workDescription: { type: "literal", value: "tragedy by Shakespeare" },
            creatorLabel: { type: "literal", value: "Thomas Kyd" },
            creatorRoleLabel: { type: "literal", value: "playwright" },
            inception: { type: "literal", value: "1600-01-01T00:00:00Z" },
          },
        ],
      },
    };

    const result = transformRawToWorkInserts(raw, "theatre");

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Hamlet");
    expect(result[0].creators).toEqual([
      { name: "William Shakespeare", role: "playwright" },
      { name: "Thomas Kyd", role: "playwright" },
    ]);
    expect(result[0].media_type).toBe("theatre");
    expect(result[0].year_written).toBe(1600);
    expect(result[0].external_ids).toEqual({ wikidata_qid: "Q192" });
  });

  it("deduplicates same creator appearing multiple times", () => {
    const raw: SparqlResponse = {
      results: {
        bindings: [
          {
            work: { type: "uri", value: "http://www.wikidata.org/entity/Q192" },
            workLabel: { type: "literal", value: "Hamlet" },
            creatorLabel: { type: "literal", value: "William Shakespeare" },
            creatorRoleLabel: { type: "literal", value: "playwright" },
          },
          {
            work: { type: "uri", value: "http://www.wikidata.org/entity/Q192" },
            workLabel: { type: "literal", value: "Hamlet" },
            creatorLabel: { type: "literal", value: "William Shakespeare" },
            creatorRoleLabel: { type: "literal", value: "playwright" },
          },
        ],
      },
    };

    const result = transformRawToWorkInserts(raw, "theatre");

    expect(result).toHaveLength(1);
    expect(result[0].creators).toHaveLength(1);
  });

  it("handles works with no creator or optional fields", () => {
    const raw: SparqlResponse = {
      results: {
        bindings: [
          {
            work: { type: "uri", value: "http://www.wikidata.org/entity/Q555" },
            workLabel: { type: "literal", value: "Unknown Play" },
          },
        ],
      },
    };

    const result = transformRawToWorkInserts(raw, "theatre");

    expect(result).toHaveLength(1);
    expect(result[0].creators).toEqual([]);
    expect(result[0].year_written).toBeNull();
    expect(result[0].description).toBeNull();
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

```bash
npm run test -- --testPathPattern=transform
```

Expected: FAIL — `transformRawToWorkInserts is not a function`

- [ ] **Step 11: Implement transformRawToWorkInserts**

Replace `scripts/transform.ts` with the complete file:

```typescript
import type { Creator, MediaType, WorkInsert } from "../lib/types";

export type SparqlBinding = {
  work: { type: string; value: string };
  workLabel: { type: string; value: string };
  workDescription?: { type: string; value: string };
  creatorLabel?: { type: string; value: string };
  creatorRoleLabel?: { type: string; value: string };
  inception?: { type: string; value: string };
};

export type SparqlResponse = {
  results: {
    bindings: SparqlBinding[];
  };
};

export function extractQid(uri: string): string {
  return uri.split("/").pop()!;
}

export function parseYear(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^(-?\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function transformRawToWorkInserts(
  raw: SparqlResponse,
  mediaType: MediaType,
): WorkInsert[] {
  const grouped = new Map<string, { binding: SparqlBinding; creators: Creator[] }>();

  for (const binding of raw.results.bindings) {
    const qid = extractQid(binding.work.value);

    if (!grouped.has(qid)) {
      grouped.set(qid, { binding, creators: [] });
    }

    if (binding.creatorLabel) {
      const entry = grouped.get(qid)!;
      const creator: Creator = {
        name: binding.creatorLabel.value,
        role: binding.creatorRoleLabel?.value ?? "creator",
      };
      if (!entry.creators.some((c) => c.name === creator.name && c.role === creator.role)) {
        entry.creators.push(creator);
      }
    }
  }

  return Array.from(grouped.values()).map(({ binding, creators }) => ({
    title: binding.workLabel.value,
    media_type: mediaType,
    creators,
    year_written: parseYear(binding.inception?.value),
    description: binding.workDescription?.value ?? null,
    external_ids: { wikidata_qid: extractQid(binding.work.value) },
    creation_method: "scripted" as const,
  }));
}
```

- [ ] **Step 12: Run test to verify it passes**

```bash
npm run test -- --testPathPattern=transform
```

Expected: PASS — 8 tests passing.

- [ ] **Step 13: Commit**

```bash
git add scripts/transform.ts __tests__/scripts/transform.test.ts
git commit -m "feat: add Wikidata SPARQL transform utilities"
```

---

## Task 3: Fetch Command

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Step 1: Write seed.ts with fetch command and CLI skeleton**

Create `scripts/seed.ts`:

```typescript
import fs from "node:fs/promises";
import path from "node:path";
import type { SparqlResponse } from "./transform";

const CATEGORIES = [
  { name: "plays", wikidataClass: "Q25379", mediaType: "theatre" as const },
  { name: "musicals", wikidataClass: "Q2743", mediaType: "musical" as const },
  { name: "operas", wikidataClass: "Q1344", mediaType: "opera" as const },
  { name: "ballets", wikidataClass: "Q476300", mediaType: "dance" as const },
];

function buildSparqlQuery(wikidataClass: string): string {
  return `
SELECT ?work ?workLabel ?workDescription ?creatorLabel ?creatorRoleLabel ?inception
WHERE {
  ?work wdt:P31 wd:${wikidataClass}.
  ?work wikibase:sitelinks ?sitelinks.
  OPTIONAL { ?work wdt:P571 ?inception. }
  OPTIONAL {
    ?work wdt:P170 ?creator.
    OPTIONAL { ?creator wdt:P106 ?creatorRole. }
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?sitelinks)
LIMIT 50
`.trim();
}

async function fetchSparql(query: string): Promise<SparqlResponse> {
  const url = new URL("https://query.wikidata.org/sparql");
  url.searchParams.set("query", query);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "Transient/0.1 (dev seed script)",
    },
  });

  if (!response.ok) {
    throw new Error(`SPARQL query failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchCommand(): Promise<void> {
  const dataDir = path.join(__dirname, "data", "raw");
  await fs.mkdir(dataDir, { recursive: true });

  for (const category of CATEGORIES) {
    console.log(`Fetching ${category.name}...`);
    const query = buildSparqlQuery(category.wikidataClass);
    const data = await fetchSparql(query);
    const filePath = path.join(dataDir, `${category.name}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`  Saved ${data.results.bindings.length} rows for ${category.name}`);
  }

  console.log("Done. Raw data saved to scripts/data/raw/");
}

const command = process.argv[2];

switch (command) {
  case "fetch":
    fetchCommand();
    break;
  default:
    console.error("Usage: npx tsx scripts/seed.ts <fetch|load>");
    process.exit(1);
}
```

- [ ] **Step 2: Test fetch manually**

```bash
npx tsx scripts/seed.ts fetch
```

Expected output:

```
Fetching plays...
  Saved NN rows for plays
Fetching musicals...
  Saved NN rows for musicals
Fetching operas...
  Saved NN rows for operas
Fetching ballets...
  Saved NN rows for ballets
Done. Raw data saved to scripts/data/raw/
```

- [ ] **Step 3: Verify raw files exist and look reasonable**

```bash
ls -la scripts/data/raw/
head -20 scripts/data/raw/plays.json
```

Expected: 4 JSON files. Each has `results.bindings` array with entries containing `work`, `workLabel`, etc.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: add seed fetch command for Wikidata SPARQL"
```

---

## Task 4: Load Command

**Files:**
- Modify: `scripts/seed.ts`

- [ ] **Step 1: Add load command to seed.ts**

Add the following imports at the top of `scripts/seed.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import { transformRawToWorkInserts } from "./transform";
```

Add this function after `fetchCommand`:

```typescript
async function loadCommand(): Promise<void> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.\n" +
        "Tip: run `source .env.local` first, or use `node --env-file=.env.local`",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const dataDir = path.join(__dirname, "data", "raw");

  // Get existing QIDs to skip duplicates
  const { data: existing, error: fetchError } = await supabase
    .from("works")
    .select("external_ids");

  if (fetchError) {
    console.error(`Failed to query existing works: ${fetchError.message}`);
    process.exit(1);
  }

  const existingQids = new Set(
    (existing ?? [])
      .map((w: { external_ids: Record<string, string> }) => w.external_ids?.wikidata_qid)
      .filter(Boolean),
  );

  console.log(`Found ${existingQids.size} existing works with Wikidata QIDs`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const category of CATEGORIES) {
    const filePath = path.join(dataDir, `${category.name}.json`);

    let fileContent: string;
    try {
      fileContent = await fs.readFile(filePath, "utf-8");
    } catch {
      console.error(`Missing ${filePath} — run "fetch" first`);
      continue;
    }

    const raw: SparqlResponse = JSON.parse(fileContent);
    const works = transformRawToWorkInserts(raw, category.mediaType);

    for (const work of works) {
      const qid = work.external_ids?.wikidata_qid;
      if (qid && existingQids.has(qid)) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("works").insert(work);
      if (error) {
        console.error(`  Error inserting "${work.title}": ${error.message}`);
        errors++;
      } else {
        inserted++;
        if (qid) existingQids.add(qid);
      }
    }

    console.log(`Processed ${category.name}: ${works.length} works`);
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);
}
```

- [ ] **Step 2: Update CLI switch to include load**

Replace the switch at the bottom:

```typescript
switch (command) {
  case "fetch":
    fetchCommand();
    break;
  case "load":
    loadCommand();
    break;
  default:
    console.error("Usage: npx tsx scripts/seed.ts <fetch|load>");
    process.exit(1);
}
```

- [ ] **Step 3: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: add seed load command with duplicate detection"
```

---

## Task 5: End-to-End Manual Test

- [ ] **Step 1: Run all checks**

```bash
npm run check
```

Expected: lint, typecheck, format, and tests all pass.

- [ ] **Step 2: Test the full flow**

```bash
# Fetch was already done in Task 3
# Load into local Supabase (env vars must be set)
source .env.local && npx tsx scripts/seed.ts load
```

Expected output:

```
Found 0 existing works with Wikidata QIDs
Processed plays: ~NN works
Processed musicals: ~NN works
Processed operas: ~NN works
Processed ballets: ~NN works

Done. Inserted: ~NNN, Skipped: 0, Errors: 0
```

- [ ] **Step 3: Verify idempotency — run load again**

```bash
source .env.local && npx tsx scripts/seed.ts load
```

Expected: All works skipped, 0 inserted.

- [ ] **Step 4: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: seed script adjustments from e2e testing"
```
