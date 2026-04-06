import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { transformRawToWorkInserts, type SparqlResponse } from "./transform";

// Wikidata subclass path (wdt:P279*): most theatrical works aren't typed directly as the
// broad class (e.g. "play" Q25379). Instead they use specific subclasses like "tragedy" or
// "comedy". The subclass path traverses the class hierarchy to find them all.
// Exception: ballets (Q476300) timeout with subclass path due to large hierarchy — direct
// lookup works fine there since most ballets are typed directly as Q476300.
const CATEGORIES = [
  { name: "plays", wikidataClass: "Q25379", mediaType: "theatre" as const, useSubclassPath: true },
  {
    name: "musicals",
    wikidataClass: "Q2743",
    mediaType: "musical" as const,
    useSubclassPath: true,
  },
  { name: "operas", wikidataClass: "Q1344", mediaType: "opera" as const, useSubclassPath: true },
  {
    name: "ballets",
    wikidataClass: "Q476300",
    mediaType: "dance" as const,
    useSubclassPath: false,
  },
];

function buildSparqlQuery(wikidataClass: string, useSubclassPath: boolean): string {
  const instancePattern = useSubclassPath
    ? `?work wdt:P31/wdt:P279* wd:${wikidataClass}.`
    : `?work wdt:P31 wd:${wikidataClass}.`;
  return `
SELECT ?work ?workLabel ?workDescription ?creatorLabel ?creatorRoleLabel ?inception
WHERE {
  ${instancePattern}
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
    const query = buildSparqlQuery(category.wikidataClass, category.useSubclassPath);
    const data = await fetchSparql(query);
    const filePath = path.join(dataDir, `${category.name}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`  Saved ${data.results.bindings.length} rows for ${category.name}`);
  }

  console.log("Done. Raw data saved to scripts/data/raw/");
}

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
  const { data: existing, error: fetchError } = await supabase.from("works").select("external_ids");

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

const command = process.argv[2];

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
