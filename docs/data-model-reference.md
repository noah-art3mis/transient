# Data Model Quick Reference

**Date:** 2026-04-05
**Status:** Final for v1. Full schema in `docs/research/convergence1-data-model.md`.

## Model: Two-Level (Work + Production)

```
Work (the play/musical/opera)
  └── Production (a specific staging at a venue)
       └── LogEntry (your personal record of attending)
```

No Performance entity. Understudy/per-night tracking deferred — use review text or tags.

## Entities

### Work

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | text | Yes | Only required field |
| `original_title` | text | No | For non-English works |
| `creators` | jsonb `[{name, role}]` | No (defaults `[]`) | Roles: "playwright", "book", "music", "lyrics", "devised by", "composer", "librettist" |
| `year_written` | int | No | Nullable for devised work |
| `creation_method` | text | Yes (default `scripted`) | `scripted`, `devised`, `other` |
| `media_type` | text | Yes (default `theatre`) | `theatre`, `musical`, `opera`, `dance`, `circus`, `concert`, `other` |
| `description` | text | No | Synopsis |
| `adapted_from` | uuid FK → works | No | Self-referential. WSS → R&J |
| `external_ids` | jsonb | No (defaults `{}`) | Keys: `wikidata_qid`, `musicbrainz_mbid`, `theatricalia_play_id` |
| `search_vector` | tsvector | Auto-generated | From title + original_title + description |

### Production

| Field | Type | Required | Notes |
|---|---|---|---|
| `work_id` | uuid FK → works | No | Nullable for standalone devised work |
| `title_override` | text | No | When billing differs from work title |
| `company` | text | No | Theatre company |
| `venue` | text | No | Plain text for v1 (normalized venue table is post-MVP) |
| `director` | text | No | |
| `cast_members` | jsonb `[{name, role}]` | No (defaults `[]`) | Opening-night cast |
| `year` | int | No | Useful when exact dates unknown |
| `start_date` / `end_date` | date | No | Run dates |
| `poster_url` | text | No | Supabase Storage path |
| `is_touring` | boolean | Yes (default `false`) | Tour = one Production with flag |
| `external_ids` | jsonb | No (defaults `{}`) | Keys: `wikidata_qid`, `ibdb_production_id` |

### LogEntry

| Field | Type | Required | Notes |
|---|---|---|---|
| `production_id` | uuid FK → productions | Yes | What you saw |
| `user_id` | uuid FK → auth.users | Yes | Who logged it |
| `date_seen` | date | Yes (default today) | The only field to confirm |
| `rating` | numeric(2,1) | No | 0.5-5.0 in half-star increments |
| `review` | text | No | Add now or later |
| `is_private` | boolean | Yes (default `true`) | Private by default |
| `liked` | boolean | Yes (default `false`) | Heart flag, independent of rating |
| `tags` | text[] | Yes (default `{}`) | "world premiere", "with Mum", "standing ovation" |
| `is_rewatch` | boolean | Yes (default `false`) | Seen this production before? |

### Wishlist

| Field | Type | Required | Notes |
|---|---|---|---|
| `user_id` | uuid FK → auth.users | Yes | |
| `work_id` | uuid FK → works | XOR | Target a work ("any Hamlet") |
| `production_id` | uuid FK → productions | XOR | Target a production ("Almeida 2025") |
| `notes` | text | No | |

CHECK constraint: exactly one of `work_id` or `production_id` must be set.

## Minimum Viable Entry

| Entity | Minimum to create |
|---|---|
| Work | `title` |
| Production | (nothing beyond auto-generated id — even `work_id` is nullable) |
| LogEntry | `production_id` + `user_id` (date defaults to today) |

## Edge Case Rulings

| Case | Ruling |
|---|---|
| **Adaptations** | Separate Works linked by `adapted_from` FK. WSS and R&J are distinct Works. |
| **Touring** | One Production with `is_touring = true`. Note venue leg in review/tags. Separate Productions if cast/staging changes significantly. |
| **Revivals** | Same Work, new Production. The whole point of the two-level model. |
| **Devised work** | `creation_method = 'devised'`. Creators array: `[{name: "Company", role: "devised by"}]`. |
| **No author** | `creators` defaults to empty array. |
| **Circus** | `media_type = 'circus'`, `creation_method = 'devised'`. Work = creative concept, Production = tour iteration. |
| **Site-specific** | Production with `work_id = null` if inseparable from venue. |

## Relationships

```
User (auth.users)
  ├── 1:N  LogEntry
  └── 1:N  WishlistItem

Work
  ├── 1:N  Production
  ├── 0:1  Work (adapted_from)
  └── 0:N  WishlistItem

Production
  ├── N:1  Work (nullable)
  ├── 1:N  LogEntry
  └── 0:N  WishlistItem
```

## Source

See `docs/research/convergence1-data-model.md` for full rationale.
