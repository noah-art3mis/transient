# Track 1: Theatre Database and API Research

**Date:** 2026-04-05
**Purpose:** Assess available data sources for seeding the Transient app catalog (Work → Production data model).

---

## Summary Table

| Source | Type | Public API | Work/Prod Distinction | Coverage | License |
|---|---|---|---|---|---|
| IBDB | Broadway-only database | No | Production only | Broadway (NY) comprehensive | All Rights Reserved |
| Spectra.theater (IOBDB) | Off-Broadway database | No | Production only | Off-Broadway comprehensive | No scraping |
| Theatricalia | UK/international theatre | No | Play + Production | ~20,000 productions | Open source (Django) |
| Wikidata | General knowledge graph | Yes (SPARQL) | Yes (work + production) | Famous works good; recent/fringe sparse | CC0 |
| MusicBrainz | Music encyclopedia | Yes (REST) | Yes (work + recording + release) | Musicals/operas recorded; unrecorded stage works sparse | CC0/Public Domain |
| AboutTheArtists | Broad US theatre credits | No | Production only | Very broad US coverage | Proprietary, scraping forbidden |
| IMSLP | Music scores library | Yes (MediaWiki) | Work only (no productions) | Classical scores excellent; musicals limited | IMSLP custom (public domain works) |

---

## Detailed Findings

### 1. IBDB — Internet Broadway Database

**URL:** https://www.ibdb.com/
**Maintained by:** The Broadway League (national trade association)

**API availability:** None. There is no official public API. A third-party GitHub project (Broadway-Data-API by ytmimi) exists as a community workaround, but it is not official and of unknown reliability or freshness.

**Entities modelled:**
- Shows (productions, not abstract works)
- Theatres / Venues
- People (cast, crew, creative team)
- Organizations
- Seasons
- Awards
- Songs

**Coverage scope:** Broadway (New York City commercial theatre) only. Very comprehensive for its scope — all Broadway productions since the 19th century through present day. Does not cover Off-Broadway, Off-Off-Broadway, regional, or international theatre.

**Data format and access:** Web interface only. Advanced search by show, person/organization, theatre, season, function (director/actor/playwright/etc.), gender, dates, and character name.

**Work vs. production distinction:** No meaningful work-level abstraction. Each entry is effectively a production (a run at a specific theatre with specific dates). Multiple productions of the same show are separate entries but the show name links them loosely.

**Terms of use:** Explicitly prohibits reproduction, scraping, or creating derivative works. Personal non-commercial copying of individual pages only. No API access or data licensing programme found.

**Verdict for Transient:** Rich, authoritative data for Broadway specifically, but inaccessible programmatically. Could serve as a reference/verification source for manual data entry. Cannot be used as a bulk data seed.

---

### 2. Spectra.theater (formerly Lortel / IOBDB)

**URL:** https://www.spectra.theater/
**Previously:** Internet Off-Broadway Database (lortel.org/iobdb), retired March 2025 and redirected to Spectra.

**API availability:** None found. No public API or data download documented.

**Entities modelled:**
- Productions (title page credits)
- Original cast and understudies
- Production staff
- Venues
- Opening/closing dates

**Coverage scope:** Off-Broadway productions from 1958 to present. Also covers a wider range including US professional, stock, amateur, and school productions. Partnership with Lucille Lortel Foundation gives authoritative Off-Broadway depth.

**Work vs. production distinction:** Production-centric. No explicit work-level abstraction.

**Access:** Free public web access, no registration required.

**Terms of use:** The original IOBDB data had no scraping terms documented, but Spectra as a commercial tech company is likely to restrict bulk extraction. No explicit open data licence found.

**Verdict for Transient:** Excellent Off-Broadway complement to IBDB. Again, useful as a reference but not bulk-seedable programmatically.

---

### 3. Theatricalia

**URL:** https://theatricalia.com/
**GitHub:** https://github.com/dracos/Theatricalia
**Maintained by:** Matthew Somerville (individual maintainer)

**Current status:** The site is live and the GitHub repo shows recent workflow runs (Actions CI activity), suggesting it is still actively maintained, though primarily by one person.

**API availability:** No API exists. The maintainer has acknowledged the need to add API/linked data access but has not completed it. No raw data download available either.

**Data exposed:**
- Plays (works)
- Productions (linked to plays)
- People (cast and crew)
- Theatres / Venues (~1,500+)

**Coverage:** Launched with RSC productions from 1879, Birmingham Repertory Theatre through 1971, University of Bristol Theatre Archive, and the Royal National Theatre archive. Approximately 20,000 productions and 60,000+ people. Primarily UK-focused with some international.

**Work vs. production distinction:** Yes. Theatricalia has a play entity (the abstract work) and a separate production entity (a specific staging). This is the closest structural match to the Transient data model (Work → Production).

**Standard identifiers:** Wikidata has three Theatricalia identifier properties:
- `P1242` — Theatricalia play ID (links a Wikidata play item to its Theatricalia page)
- `P2468` — Theatricalia theatre ID (links a venue)
- `P2469` — Theatricalia person ID

This means Theatricalia's plays are cross-referenced in Wikidata, enabling look-ups even without a Theatricalia API.

**Tech stack:** Django + MySQL, open source on GitHub under an unspecified licence.

**Verdict for Transient:** Best structural match for the Work → Production model. UK/historical coverage is solid for canonical works (Shakespeare, major rep repertoire). No API is a significant limitation. Could potentially be self-hosted or a data dump requested from the maintainer. The Wikidata cross-references add indirect value.

---

### 4. Wikidata

**URL:** https://www.wikidata.org/
**SPARQL endpoint:** https://query.wikidata.org/sparql

**API availability:** Yes. Full free public SPARQL endpoint at query.wikidata.org. Also REST-like access via `https://www.wikidata.org/wiki/Special:EntityData/Q{id}.json`. No authentication required. Rate limits are soft (60-second query timeout on SPARQL endpoint).

**Relevant item types (Q numbers):**
- `Q25379` — play (theatre) [abstract work]
- `Q182659` — musical (abstract work)
- `Q1344` — opera (abstract work)
- `Q43099500` — performing arts production
- `Q7777570` — theatrical production
- `Q47467768` — operatic production
- `Q59163902` — musical production

**Key properties (P numbers):**
- `P31` — instance of (used to type items as play, musical, opera, theatrical production, etc.)
- `P136` — genre
- `P170` — creator / author
- `P86` — composer
- `P1040` — cast member (on production items)
- `P57` — director
- `P4` — inception / premiere date
- `P17` — country
- `P856` — official website
- `P2468`, `P1242`, `P2469` — Theatricalia IDs (cross-link)

**Work vs. production distinction:** Yes, and explicitly modelled. The WikiProject Performing Arts data structure separates the abstract work (play, musical, opera) from the performing arts production (specific staging). Production items point back to the work via `P921` (main subject) or structured relationships. Multiple productions of the same work each have their own Wikidata item.

**Example SPARQL query for theatrical works:**
```sparql
SELECT ?work ?workLabel WHERE {
  ?work wdt:P31 wd:Q25379 .  # instance of: play
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 100
```

For musicals: replace `wd:Q25379` with `wd:Q182659`.

**Coverage assessment:**
- Famous/canonical plays (Shakespeare, Chekhov, Ibsen, Sondheim musicals, major operas): generally good
- Broadway/West End productions of famous works: reasonable
- Recent, fringe, or regional productions: sparse to nonexistent
- Non-English works: variable, better for nationally significant works
- A 2020 Wikimedia grant noted there was "very little information in Wikidata about theatre companies and even fewer about performance works" — this has improved but gaps remain for anything below major productions

**Licence:** CC0 — all Wikidata data is in the public domain. Full database dumps available.

**WikiProject Performing Arts:** Active community effort at `Wikidata:WikiProject Performing arts` with documented data structure, typologies, and data modelling guidelines. Ongoing ingestion of institutional databases (Swiss theatre archives, etc.).

**Verdict for Transient:** Best open programmatic source available. CC0 licence means data is freely usable. SPARQL endpoint provides flexible querying. Well-structured work/production distinction. Coverage of famous works is solid; recent/fringe/non-notable productions will need manual entry. The Theatricalia cross-references make it useful as an indirect bridge to Theatricalia data too.

---

### 5. MusicBrainz

**URL:** https://musicbrainz.org/
**API docs:** https://musicbrainz.org/doc/MusicBrainz_API

**API availability:** Yes. REST-based JSON/XML webservice, free for non-commercial use. Rate limit: 1 request/second average with a meaningful User-Agent header. Full database dumps available (JSON and PostgreSQL format, updated periodically).

**Data model — key entities:**
- **Work** — the abstract intellectual creation (opera, musical, song). This is the equivalent of Transient's Work.
- **Recording** — a specific audio capture of a performance
- **Release** — a published audio product (cast recording, studio album)
- **Release Group** — groups different editions/formats of the same release
- **Artist** — composer, lyricist, performer
- **Event** — concerts and performances (less developed than works/recordings)

**Work hierarchy for opera (recommended structure):**
```
Opera (Work)
  └── Act (Work, "part of" Opera)
       └── Number/Aria (Work, "part of" Act)
```
Scenes are not modelled as independent works.

**Theatre/musical coverage:**
- Has a specific style guide for "Theatre" releases (non-opera theatre with music/songs/dialogue)
- Opera works are well-modelled and extensively populated — major operas have full work trees
- Musicals that have cast recordings are present (as Release + Work entities)
- Purely spoken plays with no music are out of scope for MusicBrainz

**Licence:** Majority of data released to public domain. Database dumps freely downloadable.

**Relevance to Transient:**
- Excellent for musicals and operas where a cast recording exists — these have full work-level metadata (composer, librettist, premiere year, ISWC identifiers)
- Not useful for plays (no music)
- The Work entity in MusicBrainz is a strong analogue to Transient's Work for musical theatre
- MBID (MusicBrainz Identifier) is a stable UUID per entity, good for cross-referencing

**Verdict for Transient:** Strong supplementary source for musicals and operas. Not a primary source (no productions, no staging details, no cast-in-role credits for stage). Best used to enrich Work metadata (composer, librettist, year, MBID) for musical theatre works seeded from other sources.

---

### 6. AboutTheArtists

**URL:** https://www.abouttheartists.com/

**API availability:** None. No public API.

**Coverage:** Claims to be the world's most complete live theatre record — over 1 million peer-reviewed credits from Broadway to community theater. US-centric but broad. Updated continuously by public and staff.

**Entities:** Productions, Credits (per production), People, Venues.

**Work vs. production distinction:** Production-centric. No explicit work abstraction found.

**Terms of use:** All data is copyrighted exclusively by AboutTheArtists.com. Scraping and duplication explicitly prohibited. AI training and derivative databases explicitly prohibited. Data republishing rights can be negotiated by contacting support@abouttheartists.com.

**Verdict for Transient:** Broad US coverage including community theatre is appealing in principle. However, the strict proprietary licence makes it unusable for bulk seeding without a formal data agreement. Worth contacting for a possible data partnership, but not viable as a freely-usable source.

---

### 7. IMSLP — International Music Score Library Project

**URL:** https://imslp.org/
**API:** https://imslp.org/wiki/IMSLP:API

**API availability:** Yes. MediaWiki-based API (IMSLP runs on MediaWiki). Returns JSON lists of people and works. A Python library (`imslp` on PyPI, also `mwclient`) enables programmatic access. No authentication required for read access.

**Data model:** Work-centric. Each page represents a musical work. Metadata includes composer, key, genre, date, instrumentation. Score files (PDFs) are the primary content.

**Coverage:** 736,000+ scores, 226,000+ works, 27,400+ composers as of late 2023. Heavily classical. Opera scores well represented. Musical theatre: limited — IMSLP focuses on public domain works (composers deceased 70+ years in most jurisdictions), so most 20th-century musicals are absent.

**Work vs. production distinction:** No production data at all. IMSLP is a scores library, not a productions database.

**Licence:** Works are public domain or IMSLP-licensed. The metadata (not the scores) is usable for cross-referencing.

**Verdict for Transient:** Useful as a cross-reference for classical operas — IMSLP work IDs can enrich Work metadata and link to scores. Not relevant for productions. Not relevant for most musical theatre (post-1920s works are under copyright). Niche utility only.

---

## Additional Sources Identified

### Spectra.theater (beyond IOBDB)
Beyond hosting the IOBDB data, Spectra describes itself as connecting plays, characters, creatives, production credits, venues, and artists. Founded 2022, still developing. No API found but the company is tech-focused and may open up data access in future. Worth monitoring.

### BroadwayWorld
Claims 335,000+ performers and 250,000+ productions. Web-only, no public API found. Proprietary.

### Playbill
Historical programme archive, some digital data. No public API found.

### GloPAD (Global Performing Arts Database)
Academic resource providing multilingual metadata on performing arts images, video, and text. Primarily a research/archival resource, not structured for the Work → Production use case.

### National Theatre (UK) Archive
The National Theatre's archive was previously included in Theatricalia but has since been removed from that site. NT has its own digital archive at ntarchive.nationaltheatre.org.uk but no public API.

### Theatre Museum / V&A Collections
Victoria and Albert Museum holds significant theatre collections with some open data via the V&A API, but this is artefact/object focused (programmes, costumes, set designs), not structured productions data.

---

## Standard Identifiers Found

| Identifier | Scope | Notes |
|---|---|---|
| IBDB show ID | Broadway productions | No API; stable URL pattern: ibdb.com/broadway-production/{id} |
| Theatricalia play ID (P1242) | Plays/works | Wikidata cross-reference; no direct API |
| Theatricalia theatre ID (P2468) | Venues | Wikidata cross-reference |
| Theatricalia person ID (P2469) | People | Wikidata cross-reference |
| Wikidata QID | Universal | CC0; SPARQL queryable; covers works + productions |
| MusicBrainz MBID | Musical works + recordings | UUID format; free API; CC0 |
| ISNI | People and organisations | Batch API requires paid membership |
| VIAF | People and organisations | Free lookup; cross-references national authority files |
| ISWC | Musical works | International Standard Musical Work Code; held in MusicBrainz |

---

## Conclusions

### Best sources for seeding the Transient catalog

1. **Wikidata** — the strongest candidate for bulk seeding of Works. CC0 licence, SPARQL API, explicit work/production distinction, covers plays + musicals + operas with stable QIDs. Run SPARQL queries to extract all items typed as `Q25379` (play), `Q182659` (musical), and `Q1344` (opera) along with their theatrical production items. Coverage of major/famous works is solid.

2. **MusicBrainz** — strong secondary source specifically for musicals and operas. Use to enrich Work metadata (composer, librettist, MBID, ISWC) for musical theatre works. Full database dump available. CC0.

3. **Theatricalia** — best structural match for Work → Production (it has both entities). UK/RSC/National Theatre historical coverage is strong. No API is a blocker for automated seeding, but a data dump could potentially be requested from the maintainer, or the open-source codebase could be self-hosted. Worth reaching out to Matthew Somerville directly.

### Gaps requiring manual entry

- **Recent productions** (past 2–3 years): Wikidata coverage is thin for anything below major commercial productions. New Transient entries for recent shows will largely require manual input by users or curators.
- **Fringe and community theatre**: Essentially no machine-readable open source exists. AboutTheArtists has coverage but it is proprietary.
- **Non-English theatre**: Wikidata has some international coverage but is uneven. European institutions (Comédie-Française, Burgtheater, etc.) have been partially ingested into Wikidata via WikiProject Performing Arts data ingestion projects.
- **Off-Broadway / Off-West End**: IOBDB/Spectra has comprehensive Off-Broadway data but no API. Theatricalia has some UK fringe. This is a significant gap for open data.
- **Production-level detail** (full cast lists, creatives, dates, venue): Even where Wikidata has production items, they are often sparsely populated. Wikidata is better for Works than for full Production detail.

### Recommended identifiers for Transient's data model

- Store **Wikidata QID** on both Work and Production items as the primary cross-reference identifier. This is the most interoperable and widely supported.
- Store **MusicBrainz MBID** on Work items for musicals and operas.
- Store **IBDB show ID** on Production items for Broadway productions (even if manually entered).
- Store **Theatricalia play ID** on Work items where known (look up via Wikidata P1242).
- Consider a generic `external_ids` JSONB field to store additional identifiers (Spectra, Playbill, etc.) without schema migrations as sources evolve.
