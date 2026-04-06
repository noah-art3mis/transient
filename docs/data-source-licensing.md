# Data Source Licensing & Usage

**Date:** 2026-04-05
**Purpose:** Quick reference for which data sources we can legally use for seeding the Transient catalog.

## Usable Sources

| Source      | License             | Access Method        | Notes                                                                           |
| ----------- | ------------------- | -------------------- | ------------------------------------------------------------------------------- |
| Wikidata    | CC0 (public domain) | SPARQL API (no auth) | Official public endpoint. Designed for bulk queries. 60s query timeout.         |
| MusicBrainz | CC0 / Public Domain | REST API (no auth)   | 1 req/sec rate limit. Requires User-Agent header. Full DB dumps also available. |
| IMSLP       | Public domain works | MediaWiki API        | Metadata usable for cross-referencing. Limited theatre coverage.                |

## Not Usable

| Source          | License             | Why Not                                                                               |
| --------------- | ------------------- | ------------------------------------------------------------------------------------- |
| IBDB            | All Rights Reserved | No API. Scraping explicitly prohibited.                                               |
| Spectra (IOBDB) | Proprietary         | No API. Commercial entity, likely restricts bulk extraction.                          |
| Theatricalia    | No API              | No bulk access. Could contact maintainer (Matthew Somerville) to request a data dump. |
| AboutTheArtists | Proprietary         | Scraping and AI training explicitly forbidden. Would need formal data agreement.      |
| BroadwayWorld   | Proprietary         | No public API.                                                                        |
| Playbill        | Proprietary         | No public API.                                                                        |

## What We're Using for MVP

1. **Wikidata** — Primary seed for Works catalog (plays, musicals, operas, ballets). ~28k items across categories.
2. **MusicBrainz** — Secondary enrichment for musicals/operas (composer, librettist, MBID, ISWC).
3. **Manual entry** — Everything else (recent productions, fringe, community theatre).

## Source

See `docs/research/track1-data-sources.md` for full research.
