# Screen Inventory

**Date:** 2026-04-05
**Status:** v1 scope. 5 tabs + 2 modal screens = 7 screens total.

## Navigation

```
(tabs)/
  ├── Diary (home)        ← default screen
  ├── Search
  ├── Wishlist
  ├── Stats
  └── Settings

log/
  ├── new                 ← modal (from + FAB)
  └── [id]                ← modal (edit existing entry)

production/
  └── [id]                ← pushed from search results
```

## Screens

### 1. Diary (Home Tab)

The default screen. Reverse-chronological log of everything you've seen.

| Element | Detail |
|---|---|
| Header | "Diary" + year filter pill (2026, 2025, All) |
| Each row | Date ("15 Mar") · Work title (bold) · Venue (subtitle) · Stars · Heart icon · Review indicator |
| Empty state | "No shows logged yet. Tap + to log your first show." |
| FAB | "+" bottom-right, always visible → opens Log screen |

### 2. Log Entry (Create / Edit)

Two-step flow: find production, then fill details.

**Step 1 — Find production:**
- Text input, autofocused
- Results: works matching search (title, creators, media type badge)
- Tap work → productions expand below (venue, year)
- Tap production → moves to step 2
- "Can't find it?" → inline creation (work title + media type → production venue + year)

**Step 2 — Log details (single scrollable form):**

| Field | Widget | Default |
|---|---|---|
| Production | Read-only display (confirms selection) | — |
| Date seen | Date picker | Today |
| Rating | Star widget (0.5-5.0, tap to set/clear) | None |
| Liked | Heart toggle | Off |
| Rewatch | Toggle ("Seen this production before?") | Off |
| Review | Multiline text (starts collapsed) | Empty |
| Tags | Text input with comma separation, pill display | Empty |

Actions: Save (primary), Cancel (secondary).

### 3. Search (Tab)

| Element | Detail |
|---|---|
| Search bar | Text input at top, searches `works.search_vector` |
| Each result | Work title · Creator ("by Arthur Miller") · Media type badge · Production count |
| Tap work | Expands to show productions (venue, year, director) |
| Tap production | Goes to Production Detail |
| "Log this" | On any production row → opens Log screen pre-filled |

### 4. Production Detail

| Section | Content |
|---|---|
| Header | Work title (large) · "Venue, Year" subtitle · Director · Run dates · Media type badge |
| Cast/creative | Scrollable list from `cast_members` + parent work `creators` |
| Your log entries | List of your entries for this production (date, rating, review excerpt) |
| Actions | "Log this production" button · "Add to wishlist" button |

### 5. Wishlist (Tab)

| Element | Detail |
|---|---|
| Each row | Work title (if targeting Work) or Production title + venue (if targeting Production) · Notes · Date added |
| Interaction | Swipe to remove · Tap to go to detail |
| Empty state | "Nothing on your list yet. Browse shows and tap the bookmark icon to add." |

### 6. Stats (Tab)

| Section | Content |
|---|---|
| Summary cards | Total shows (all time) · Shows this year · Venues visited (distinct count) |
| Rating distribution | Bar chart: count at each half-star (0.5 through 5.0) |
| By media type | Breakdown: plays, musicals, operas, etc. |
| By year | Shows logged per year |

### 7. Settings (Tab)

| Element | Detail |
|---|---|
| User info | Email, display name (from Supabase Auth) |
| Actions | Sign out |
| Data | "Export my data" (CSV or JSON) |
| About | App version, source code link |

## Inline Creation Flow (from Log screen)

When search returns no match:

```
"Can't find it? Add new work"
  → Title: [pre-filled from search text]
  → Media type: [theatre ▼]
  → Creator name: [optional]
  → Creator role: [playwright ▼]
  → Save Work
    → "Add a production?"
      → Venue: [text]
      → Year: [defaults to current year]
      → Director: [optional]
      → Save Production
        → Log form opens pre-filled
```

## Source

See `docs/research/convergence2-mvp-scope.md` for full scope and rationale.
