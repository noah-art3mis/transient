import fs from "node:fs/promises";
import path from "node:path";
import type { SparqlResponse } from "./transform";

const CATEGORIES = [
  // plays: no items use direct wdt:P31 wd:Q25379 — all typed via subclasses (tragedy, comedy, etc.)
  { name: "plays", wikidataClass: "Q25379", mediaType: "theatre" as const, useSubclassPath: true },
  { name: "musicals", wikidataClass: "Q2743", mediaType: "musical" as const, useSubclassPath: true },
  { name: "operas", wikidataClass: "Q1344", mediaType: "opera" as const, useSubclassPath: true },
  { name: "ballets", wikidataClass: "Q476300", mediaType: "dance" as const, useSubclassPath: false },
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

const command = process.argv[2];

switch (command) {
  case "fetch":
    fetchCommand();
    break;
  default:
    console.error("Usage: npx tsx scripts/seed.ts <fetch|load>");
    process.exit(1);
}
