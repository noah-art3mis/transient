# Track 2: Product Audit — Letterboxd and Competitor UX

**Date:** 2026-04-05
**Context:** Informing MVP scope for Transient, a Letterboxd-style app for theatre using a Work → Production → Log Entry data model.

---

## Table of Contents

1. [Letterboxd — What Works](#letterboxd--what-works)
2. [Letterboxd — What Doesn't Translate](#letterboxd--what-doesnt-translate)
3. [Competitor Audit](#competitor-audit)
4. [How People Track Theatre Today](#how-people-track-theatre-today)
5. [The Logging Moment](#the-logging-moment)
6. [Feature Candidates](#feature-candidates)

---

## Letterboxd — What Works

### The Logging Flow

Letterboxd's mobile logging flow is approximately 4 taps to a minimal entry and 6–8 taps for a rich one:

1. Tap `+` (bottom-center of app)
2. Search film title
3. Tap film from results
4. Confirm/change date (defaults to today)
5. Optionally: star rating (tap stars)
6. Optionally: write review (text field)
7. Optionally: add tags
8. Save

The critical design decision: **date defaults to today**. This makes the "I just saw this" case friction-free. Rewatches are supported explicitly — you can log the same film multiple times on different dates.

There is a secondary path: mark a film "watched" without a diary date. This is for backfilling your history when you don't remember exactly when you saw something. The system treats these differently: diary entries appear in the activity feed and count toward stats by date, while "watched" marks simply add to your tally.

**What works:** The + button is always present. The search-first flow means you never navigate to a film page first and then log — you log and find the film in one motion. This is psychologically correct: you want to record an event, not browse a catalogue.

### Film Page Layout

A Letterboxd film page includes (roughly in order):

- Large poster art (dominant visual)
- Title, year, director
- Aggregate rating (community average stars) + histogram of ratings
- Watch status controls: Watched / Like / Rate / Watchlist (always visible)
- Where to watch (JustWatch integration)
- Synopsis
- Cast & crew (scrollable)
- Genres, themes, nanogenres, language, country
- Popular reviews (excerpts from community)
- Popular lists (lists that include this film)
- Related films / More by director

**What works:** The film page is both a reference and a social object. You can see at a glance what friends thought, what lists it appears in, and where to watch it. The rating controls are persistent — you can log or rate without leaving the page.

### Diary View

The diary shows log entries in reverse chronological order (list view) with film poster thumbnail, title, date watched, star rating, and a review excerpt if one exists. It functions as a personal viewing history with dates. Pro users can filter diary entries by year, genre, etc. The diary and the "films watched" list are distinct — the diary shows dated events, the watched list is a simple set.

**What works:** The diary answers "what did I see and when." It respects that you might see the same film multiple times (each gets its own diary entry). The visual weight of poster thumbnails makes it feel like a personal archive, not a spreadsheet.

### Search and Discovery

- Text search across films, lists, members, and reviews
- Browse by genre, decade, country, language, popularity
- "Popular films" and "New releases" on the home feed
- Personalised recommendations based on watch history
- Integration with streaming availability (JustWatch)
- Community-curated "Featured Lists" (official Letterboxd picks)
- Nanogenres (highly specific mood/style tags, e.g. "cozy crime")

**What works:** Genre pills, decade filters, and lists are the three discovery mechanisms people actually use. The "friends watched" signal on browse screens is powerful — seeing that three people you follow rated something 4+ stars is better than any algorithm.

### Social Features

Letterboxd uses a **follower model** (asymmetric, like Twitter). You follow; they don't have to follow back. The activity feed shows:

- Films logged or rated by people you follow
- Reviews written by people you follow
- Lists created or liked by people you follow
- Comments on entries

One thoughtful constraint: if you backfill many old entries at once, the feed shows a maximum of one item per hour from you, preventing you from flooding your followers. You cannot DM. Reviews are public (or private, for Pro). Comments appear on review pages, not in a separate inbox.

**What works:** The follower model lowers the social cost to participate. Seeing a friend's one-line review of a film you just watched creates "I want to write something too" behaviour. The lack of DMs keeps it a single-purpose object — this is a film record, not a messaging app.

### Lists

Lists are ordered or unordered collections of films. Any user can create them. They can be:

- Public (appear on profile and in search)
- Private (secret link)
- Shared with followers (secret link, restricted)
- Ranked or unranked

Letterboxd also maintains official curated lists (canonical best-of lists, award winners, etc.). Lists accumulate likes and comments. List statistics (for Pro) show cast/crew breakdown, decade distribution, genre balance.

**What works:** Lists are a second social surface. A great list spreads through the community like a piece of content. "Films I saw in 2025" and "My favourite soundtracks" and "MUBI watchlist" all coexist as equally valid list types. The ranked list supports the "best of" use case without forcing a format on everything.

### Stats Page (Pro)

The stats page provides:

- Total films watched, this year vs all-time
- Hours / days / years of viewing time
- Breakdown by decade, genre, country, language
- Most-watched directors, actors, cinematographers
- Rating distribution (your own curve)
- Films rated above/below community average
- Progress against canonical milestone lists (e.g. TSPDT 1000)
- A world map of films by country of origin
- Annual breakdown by week

**What works:** The stats page turns quantity into identity. "I've watched 847 films" is a number; "I watch mostly 1970s European drama and I rate things 0.5 stars lower than average" is a self-portrait. The data is the same; the framing is what makes it meaningful.

---

## Letterboxd — What Doesn't Translate

### The Data Is Flat (One Work = One Film)

Letterboxd's entire model rests on films being fixed objects. A film has one canonical entry: directed by X, released in year Y, runtime Z. Every user's log entry points to the same record.

Theatre breaks this in two ways:

1. **A work can be produced many times.** "Hamlet" is not one thing. The RSC 2024 production with David Tennant is a different object than the Donmar 2009 production with Jude Law. If you track at the work level only, you lose the key datum: which production did I see?

2. **A production runs at a specific venue for a specific run.** Even within a production, the cast might change. You might see the same production twice with different leads. The useful unit of logging is the **production** (a specific run at a specific venue, with a specific creative team), not the abstract work.

Letterboxd has no equivalent to this. There is no concept of "different productions of the same film." All logs of "2001: A Space Odyssey" point to one record.

**What breaks:** A flat film model fails for theatre. You'd either conflate productions (bad) or create duplicate entries per production (unscalable). The Work → Production hierarchy is load-bearing.

### Discovery Relies on Streaming Availability

A core Letterboxd value proposition is: "Find it on Netflix." Theatre has no equivalent. You cannot stream most live productions. Discovery for theatre is fundamentally about:

- What is running now, near me?
- What will run next season at venues I care about?
- What was that production I heard about?

None of these map to the JustWatch model. Letterboxd's discovery infrastructure (streaming badges, watchlist alerts) simply does not apply.

**What breaks:** The "where to watch" feature is useless. The "add to watchlist" feature needs rethinking — for theatre, a watchlist item means "I want to see this if/when a production runs near me," which is a much harder fulfillment problem.

### Stats Require Dense Metadata That Doesn't Exist

Letterboxd can say "your most-watched director is Agnes Varda" because every film has a single credited director stored in TMDb. Theatre metadata is sparse, inconsistent, and multi-attributed. A production might have a director, a playwright, an adapter, a choreographer, a musical director, a set designer — all equally "creatives." Attribution is complex and data is hard to source.

Additionally, "hours watched" doesn't quite work for theatre. Runtime is rarely fixed — productions can vary by 20–30 minutes due to pacing, running changes, standing ovations. You don't know you saw "6 hours, 23 minutes of theatre this year" with confidence.

**What breaks:** Rich stats require rich, reliable metadata. Theatre databases are incomplete. Stats will be sparser and less accurate. The decade/country/language breakdowns that make Letterboxd stats interesting have weaker equivalents for theatre.

### Rating Is For a Production, Not a Work

On Letterboxd, rating is for the film — one canonical object. On Transient, rating is for the production, and possibly for the specific performance you saw. You might give the script 4 stars and the production 2 stars. You might love the 2019 transfer but have issues with the 2024 revival. The flat "rate this film" model doesn't accommodate this nuance.

**What breaks:** The rating model needs to be at the production level, not the work level. There may also be value in separating production rating from personal experience rating (e.g., "outstanding production, but I was too tired to fully engage").

### No "Now Playing Near Me" Moment

Letterboxd is useful when you're browsing from your sofa. Theatre is primarily a local, in-person activity with short booking windows. The discovery need is often time-sensitive: "what's on this month that I might want to book." Letterboxd has no equivalent of this urgency.

**What breaks:** Discovery for theatre needs to factor in venue, city, and run dates — none of which Letterboxd handles. The watchlist alert feature (notify me when this film is on a streaming service you have) would need to become something like: notify me when a production of this work runs near me — which requires calendar and geographic data far beyond Letterboxd's scope.

### Ephemeral Nature of Theatre

Theatre is by definition transient (hence the name). A production closes and is gone. There are no home video releases, no re-watches available. The emotional valence of logging is different: you didn't just watch a film, you attended an event that no longer exists. Logging it is an act of preservation, not just cataloguing.

Letterboxd doesn't handle this emotionally — the UI is the same whether you're logging a Netflix watch or a once-in-a-lifetime experience. Transient has an opportunity to lean into the ephemeral quality: the log entry is a memorial to an event that is now gone.

---

## Competitor Audit

### Summary Table

| App | Log Shows | Rate | Review | Work vs Production Distinction | Discovery | Social | Coverage | Notes |
|---|---|---|---|---|---|---|---|---|
| **Show-Score** | No (track only) | Yes (0–100) | Yes (structured) | No — show only | Yes (NYC/London) | Follows, feed | NYC, London, limited elsewhere | Strong structured review format; owned by TodayTix |
| **BroadwayWorld My Shows** | Yes | Yes | Yes | Partially — production records | Yes (listings) | Limited | Broadway-centric, expanding | Launched Sept 2025; backed by large database |
| **Mezzanine** | Yes (diary) | Yes (stars) | Yes | Yes — production screens | Limited | Yes (follow friends) | Broadway, West End (~1,500 productions) | Closest to Letterboxd model; iOS only; program scan feature |
| **Aklaim** | Yes (performance log) | Yes (stars) | Yes | Partially — musical-focused | Yes (browse) | Yes (community) | Musicals-focused, Broadway/West End | Calendar view; performance-level logging; wishlist |
| **Theatregoer** | Yes (detailed) | Yes | Notes only | No | No | No | User-driven (any show) | Attach tickets; seat tracking; iCloud sync; import from spreadsheet |
| **StagePort** | Yes | Yes | Mini-reviews | No | No | Yes (compare friends) | Unknown | Badges/gamification; framed as "Letterboxd for theatre" |
| **TheaterLog** | Yes (personal tracker) | Unknown | Unknown | No | No | No | User-driven | Lightweight personal tracker |

### Show-Score

**What you can do:** Submit a 0–100 score; pick up to 5 adjectives; write a "See it if..." and "Don't see it if..." sentence (140 chars each); track shows for alerts; browse by city, type, date.

**Data model:** Show-level only. No Work → Production distinction. A "show" is a specific production run, but there's no parent "work" object grouping, say, all productions of "The Cherry Orchard."

**Missing vs Letterboxd:** Diary (dated log history); personal stats; watchlist; lists; social feed.

**Does well that Letterboxd doesn't:** Highly structured review format makes reviews actionable and browsable. The "See it if / Don't see it if" constraint forces reviewers to think about audience fit rather than just personal opinion. The 0–100 scale captures nuance that 5 stars cannot. Discovery by city and production type is practical for actual theatregoers.

**Concern:** Show-Score shifted to a 5-star emoji system in recent changes, which the community strongly criticised as a regression. Previously rich member reviews were converted to the new format, and edit access was removed. This is a cautionary tale about changing a review format after it's established.

### BroadwayWorld My Shows

**What you can do:** Log shows attended; rate; write reviews; organize by Broadway/West End/touring/regional; track performance count.

**Data model:** Backed by BroadwayWorld's production database going back decades. Likely production-level logging (specific productions), but no explicit Work abstraction documented.

**Missing vs Letterboxd:** Full social features; stats; lists; discovery beyond listings.

**Does well that Letterboxd doesn't:** Backed by the most comprehensive English-language theatre database in existence, covering decades of productions worldwide. Regional coverage beyond just Broadway/West End.

### Mezzanine

**What you can do:** Log shows with date, rating, review, photos; build wishlists; follow friends; see stats; scan program to auto-add.

**Data model:** Has explicit "production screens" — this is the closest existing app to the Work → Production model, though the exact architecture is unclear. Database covers ~1,500 productions, 40 years of Broadway and West End history.

**Missing vs Letterboxd:** Small database (1,500 vs millions); iOS only; limited discovery; community is tiny.

**Does well that Letterboxd doesn't:** Program scan for frictionless logging; chart and map-based stats (venues visited on a map is specifically theatre-relevant); proximity to the right data model.

**Concern:** Still relatively niche (minimal Product Hunt engagement). iOS-only limits reach.

### Aklaim (formerly Very Stagey)

**What you can do:** Log individual performances (not just shows); mark as watched; wishlist; rate and review; search by name/composer/criteria; calendar view; share to social; track seat type.

**Data model:** Musical-focused — database of musicals with cast, production, and song information. Logs at the performance level, which is more granular than most competitors. No explicit Work → Production hierarchy documented but musical-centric means it's implicitly show-focused.

**Missing vs Letterboxd:** Play coverage (strongly musicals-biased); global coverage beyond Broadway/West End; robust social graph.

**Does well that Letterboxd doesn't:** Performance-level logging (you can log that you saw the Wednesday matinee specifically); calendar view of your attendance history is theatre-native (you had a ticket for a specific date and time); share-to-Instagram functionality built in; per-seat-type tracking.

### Theatregoer

**What you can do:** Add shows with date/time/venue/seats/price; attach tickets; rate; write notes; see stats; share with friends; import from spreadsheet; iCloud sync.

**Data model:** User-driven — no central database. You create your own show entries. This is the "spreadsheet app" position.

**Missing vs Letterboxd:** Discovery; social feed; community data; curated database.

**Does well that Letterboxd doesn't:** Maximum flexibility — works for any show anywhere because you enter all data yourself. Price and seat tracking (useful for budget-conscious theatregoers). Ticket attachment. Spreadsheet import (respects existing users' data).

---

## How People Track Theatre Today

When no good dedicated tool exists, people fall back to a revealing set of workarounds. The workarounds tell us what features matter most.

### Spreadsheets (Most Common)

The most common method. Typical columns include:

- Show title
- Venue
- Date attended
- Seat (row/number/section)
- Ticket price / how obtained (full price, rush, lottery, press)
- Rating (personal, often out of 5 or 10)
- Companion (who I went with)
- Notes / mini-review
- Director
- Cast highlights

Some users add: playwright, production company, type (play/musical/opera/dance), mood tags, whether it was a first viewing or return visit.

**What this reveals:** People care most about the dated record (when did I go?) and the personal context (who was I with, what did I pay, where did I sit). Creative attribution (director, playwright) is tracked by committed enthusiasts but not everyone. Rating is universal; free-text review is common but variable in length.

### Airtable

A step up from basic spreadsheets. Airtable users specifically highlight the ability to sort and filter (e.g., "all shows at this venue," "all shows rated 4+") and to use different field types (number for rating, link for ticketing info, attachment for programme photos). Some users track ticket acquisition method as a specific field — indicating the "getting the ticket" process is part of the experience.

### Notion

The Broadway Watchlist template on Notion tracks: show name, status (seen/want to see), rating, review, dates, venue. The actor/playwright Play Tracker template (aimed at working actors) has a different model: title, character, dates, director, notes — prioritising production context over personal experience.

**What this reveals:** Notion users are more structured than spreadsheet users and tend to have a "want to see" list alongside a "have seen" list. The wishlist function is not an afterthought.

### Google Calendar

Some users log show attendance directly in calendar events, including seat info and ratings in the event description. This is the minimum viable solution: it captures date and title, which is all many people need.

**What this reveals:** Date + title is the irreducible minimum. Everything else is enrichment.

### Physical notebooks and programmes

Many theatregoers keep physical diaries or annotated programmes. The programme is itself a primary source: it contains the full cast/creative list, production credits, and show information. The act of writing in a notebook after a show is a ritual that a digital app might compete with or complement.

**What this reveals:** There is latent demand for a "capture the programme" flow. If an app can recognise a programme (via camera/scan) and auto-populate production details, it removes a significant data entry burden — Mezzanine has proven this is technically feasible.

### Show-Score reviews (informal log)

Some people write Show-Score reviews purely to have a record, not primarily to share. The review is their personal log. This is telling: even a community review platform is being appropriated as a personal diary tool.

**What this reveals:** People want a record that is theirs. The social/public layer is secondary. A "private log" mode is not optional — it is table stakes.

---

## The Logging Moment

### The Scenario

You've just walked out of a theatre. It's 10:30pm. The show just ended. You might be standing in a crowd on the pavement, queueing for the cloakroom, or sitting in a taxi. You have maybe 60–90 seconds of logging attention before your companions start talking, before you look for your bus, before the adrenaline gives way to exhaustion.

What do you have in front of you?
- Your memory of the show name and the venue (strong, right now)
- A physical or digital ticket (possibly) with show name, date, venue, and seat
- A programme (possibly) with full cast and creative list

What don't you have?
- Your phone fully focused (you're moving or talking)
- The playwright's name off the top of your head (maybe)
- The director's name (less likely)
- A fully formed opinion (too immediate)

What do you want to do?
- Mark "I saw this" while it's fresh
- Not lose the memory that you went
- Maybe capture a first impression ("stunning," "disappointing," "hard to describe")
- Not be forced to write a review right now

What do you want to do later (at home, the next day)?
- Write a proper review
- Rate it more carefully
- Look up the cast and note standout performances
- Add it to a list ("Best of 2025" or "Shows I've seen at the Almeida")

### Minimum Viable Log Entry

A log entry needs exactly three pieces of information to be useful:

1. **What** — Production title (and ideally venue to disambiguate)
2. **When** — Date attended (defaults to today)
3. **Who logged it** — Implied by account

Everything else is enrichment. The flow to reach this minimum should be no more than 3–4 taps.

### Rich Log Entry

A complete log entry includes:

- Production (linked to database record with work, venue, creative team, run dates)
- Date attended
- Performance time (matinee vs evening — relevant for cast alternates)
- Seat (section/row/number — useful for "was this worth the price?" analysis)
- Ticket price and acquisition method (full price, lottery, rush, press, gift)
- Personal star rating (production as a whole)
- Optional: separate ratings for book/script, direction, design, performance
- Written review (private by default, optionally public)
- Tags (mood, themes, genre, context: "first date," "solo," "work event")
- Companion(s) — who attended with you
- Photos (programme cover, stage, ticket)
- Rewatch flag — if you've seen this production before

### The Tension: Capture Now vs. Reflect Later

Letterboxd solves this with a two-stage model: log immediately (bare minimum), enrich later (edit the entry to add review, tags). Transient should adopt the same approach. The mobile app needs a fast "tap to log" flow for the pavement moment. The full edit interface — for writing a proper review — is a secondary screen that can be as rich as needed.

The worst pattern: requiring a full review before you can save. The second worst: requiring you to navigate a complex search-and-select flow to find the production in the database while you're freezing outside a theatre.

**Design implication:** The production search must work on partial information. If I type "Hamlet Almeida 2025" or even just "Hamlet" it should surface the relevant production immediately. Date and venue disambiguate; the app should use these to rank results.

---

## Feature Candidates

Ranked from most to least essential for MVP. This is not a complete backlog — it is a prioritised map of what actually matters to users based on the audit above.

### Tier 1: Must Have (Core Loop)

These features define whether the app is worth using at all. Without them, you have no product.

1. **Log entry: production + date** — The irreducible minimum. Tap, find production, date defaults to today, save. Under 5 seconds for a minimal entry.

2. **Production database with Work → Production hierarchy** — The key structural advantage over every competitor. "Hamlet" (work) → "Almeida 2025" (production). Users log against productions; works aggregate across them.

3. **Star rating (per log entry)** — Universal user expectation. 5 stars with halves (matching Letterboxd convention). Applied at production level.

4. **Private log / personal diary** — Default private. Users should not need to publish anything. The log is theirs.

5. **Log history / diary view** — Chronological view of everything you've logged, with date, production title, venue, rating. This is the proof that the app is working for you.

6. **Minimum viable production record** — Each production needs: title, work, venue, dates of run, primary creative team (director, playwright/composer). Sourced from a database; user should never need to type these.

### Tier 2: Should Have (Makes It Good)

These features differentiate Transient from a spreadsheet and justify building an app rather than using Airtable.

7. **Wishlist / want to see** — A list of works or productions the user wants to attend. Separate from the log. This is half the value of Letterboxd's watchlist; for theatre it's "I'd see this if it runs somewhere I can get to."

8. **Written review (per log entry)** — Free text, added after the fact. Private by default, publishable optionally. Not required to save a log entry.

9. **Quick-capture mode** — Fast logging UI designed for the pavement moment. Minimal fields, big tap targets, date auto-set to today.

10. **Venue tracking** — Which venues have you attended? A map or list of venues is a particularly theatre-relevant stat — "I've seen shows at 23 different theatres across 8 cities."

11. **Tags** — Free-form tags on log entries (e.g., "world premiere," "with Mum," "standing ovation," "walk-out").

12. **Basic stats** — Total shows logged; shows this year; by venue; by work type (play/musical/opera); rating distribution.

13. **Search within log** — Find your own past entries by title, venue, date, tags. This is what people want when they ask "have I seen this? What did I think?"

14. **Programme scan / camera import** — Scan a physical programme to populate production details. Proven feasible by Mezzanine. Dramatically reduces entry friction.

### Tier 3: Nice to Have (Makes It Great)

These features build the social and discovery layer that made Letterboxd culturally significant rather than just useful.

15. **Public profiles and social log** — Optionally make your log public. See what friends have seen.

16. **Follow / activity feed** — Follower model (asymmetric). See friends' recent logs and ratings.

17. **Lists** — User-created lists of productions or works. "My favourite Shakespeares" or "Shows I've cried at." Public or private.

18. **Richer stats (Pro tier)** — Most-seen playwrights, directors, venues; rating comparison with followers; year-in-review infographic.

19. **Companion tracking** — Log who you went with. Enables "all shows I've seen with [person]" as a view.

20. **Seat + price tracking** — Integrates the spreadsheet use case. "Was the view from row P worth £85?" type queries.

21. **Production discovery** — Browse upcoming and current productions by work, venue, city, playwright, director. This requires a real-time data pipeline, not just a static database.

22. **Work page** — An aggregation page for a work (e.g., "Hamlet") showing all logged productions, community ratings across productions, history of stagings.

23. **Notifications for wish-listed works** — Alert when a new production of a work you've wished for is announced near you. Requires real-time event data and location. Post-MVP.

### Tier 4: Deferred

24. **Ticket integration** — Import from email/Apple Wallet. Theatregoer does this; it's useful but complex.
25. **Photo/programme archive** — Upload images to log entries. Storage cost and moderation burden.
26. **Cast-level reviews** — Rate individual performances. Very granular; creates complexity.
27. **Critic review aggregation** — Show-Score territory. Requires partnerships and curation.
28. **Alternate cast tracking** — Who was on for the lead tonight? Requires near-real-time cast data.
29. **Community-curated lists** — Official "canonical" lists like Letterboxd's. Requires editorial resources.

---

## Key Conclusions

**The Work → Production hierarchy is non-negotiable.** Every competitor that ignores it produces a worse product. The ones that attempt it (Mezzanine, partially Aklaim) are closest to a satisfying experience.

**Private-first is table stakes.** Users track theatre before they decide to share it. The social layer is opt-in.

**The logging moment is 60 seconds on a pavement.** The mobile fast-capture flow is the highest-leverage UX design problem in the MVP.

**The programme scan is the differentiating interaction.** If logging means "hold up your phone, the app reads the programme, done" — that's a fundamentally better experience than any form-filling competitor. Mezzanine pioneered this; Transient should match and exceed it.

**Stats are identity, not just data.** "40 shows in 2025 across 12 venues" is a self-portrait. Build this from day one even if the data is sparse.

**Discovery is a post-MVP problem.** The logged experience (diary, stats, social) is tractable. The discovery experience (what should I book next?) requires real-time data infrastructure that is a separate product track.
