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
