# Transient: Discovery & Decision Plan

A Letterboxd-style app for transient media, primarily theatre. Users log and review productions grouped under canonical works. Built as a personal project using React Native (or similar) for web + mobile.

## Core Concept

- **Work** is the top-level entity (e.g., "Hamlet")
- **Production** is a subentry under a work (e.g., "Almeida Theatre, 2025")
- Users log and review at the production level
- Both catalog/discovery and personal logging matter equally
- Theatre-first, but the model should be flexible enough for other transient media (classical music, circus, etc.)

## Track 1: Data & Domain

### Discover

- **What databases/APIs exist for theatre?** Research IBDb (Internet Broadway Database), Theatricalia, MusicBrainz (for classical music expansion), and others. Assess coverage (Broadway-only? West End? Regional? International?), data quality, and API availability.
- **How do existing platforms model "work vs production"?** Does any database already distinguish between a play and a specific staging of it? What metadata do they track at each level?
- **What metadata matters for theatre?** Playwright, director, cast, venue, dates, company, language, original vs adaptation. Which are essential vs nice-to-have?
- **How fuzzy is "a work"?** Hamlet is clear. Devised theatre, immersive shows, circus acts, site-specific work — how far can the concept of a canonical work stretch before it breaks?
- **Are there standard identifiers?** Do theatre works have something like ISBNs or TMDB IDs, or is everything fragmented across databases?

### Decide

- **Data model depth:** Work -> Production (two levels), or Work -> Production -> Performance (three levels, tracking individual dates attended)?
- **Required vs optional fields** on work and production entries.
- **Edge case handling:** Adaptations (is West Side Story linked to Romeo and Juliet?), revivals, touring productions that visit multiple venues.
- **Seeding strategy:** Start empty and add as you go, or bulk-import from a source to have a catalog from day one?

## Track 2: Product & UX

### Discover

- **What does Letterboxd get right?** Identify the specific interactions that make it satisfying: the logging flow, the diary view, how ratings aggregate on a film page, lists, the social feed. Which translate to theatre and which don't?
- **What existing theatre-logging apps exist?** ShowScore, BroadwayWorld, Scenesational, or even people tracking shows in spreadsheets/Notion. What do they do, what do they miss?
- **What's the logging moment like?** When you see a show, when do you want to log it? Right after? The next day? What information do you have at that moment vs. what you'd need to look up?
- **How do people browse/discover theatre?** By playwright? By venue? By company? By genre? By year? Understanding the natural entry points shapes navigation.

### Decide

- **Rating system:** 5 stars, 10-point scale, no rating (just reviews), or something else.
- **What a log entry contains:** Date seen, rating, free-text review, tags, venue, who you went with. What's the minimum viable log?
- **Core screens:** Home/feed, work page, production page, diary/log, search. What else? Profile? Stats? Lists?
- **"Want to see" / watchlist equivalent:** Track upcoming shows you're interested in?
- **Search and entry creation flow:** When you log a production that isn't in the system yet, what's the UX for adding it inline?
- **Export/portability:** CSV, JSON export of your data?

## Track 3: Tech & Architecture

### Discover

- **React Native vs Expo:** Expo simplifies a lot but has constraints. Does it cover what's needed? How mature is React Native for Web for this kind of app?
- **Backend options:** Supabase, Firebase, PocketBase, or a custom backend. Trade-offs for a personal project: ease of setup vs flexibility vs cost vs data ownership.
- **Database modeling:** Relational (Postgres) fits the Work -> Production hierarchy naturally. Document stores (Firestore) are easier to start with but harder to query relationally.
- **Existing data import feasibility:** If Track 1 turns up usable APIs/databases, what format is the data in? How much transformation is needed?
- **Hosting costs:** Free tiers, self-hosting options. What's realistic for something only you use?

### Decide

- **Exact stack:** Framework, backend, database, hosting.
- **Auth:** Needed at all? If it's just you, maybe local-first storage or a simple password. If you ever want to share, you'd need real auth.
- **Offline support:** Can you log a show without internet? This significantly affects architecture (local-first vs server-first).
- **Image storage:** Production posters, venue photos — where do they live?
- **API design:** REST vs GraphQL vs direct database queries (e.g., Supabase client).

## Convergence Points

The three tracks can be researched in parallel, but they converge at three decision points:

### Convergence 1: Data Model Design

- **Requires:** Track 1 (what metadata exists) + Track 2 (what users need to see/log)
- **Produces:** The schema — Work, Production, Log Entry fields and relationships
- **Unlocks:** Track 3 can finalize database choice

### Convergence 2: MVP Scope

- **Requires:** All three tracks at least partially answered
- **Produces:** A concrete feature list for v1 — what's in, what's deferred
- **Key question:** Do you seed data first, or build the app and add data as you go?

### Convergence 3: Build

- **Requires:** Data model + MVP scope + tech stack decided
- **Produces:** An implementation plan you can execute

## Suggested Timeline

- **Week 1-2:** Research all three tracks in parallel (discovery phase)
- **Week 3:** Converge on data model and MVP scope (decisions phase)
- **Week 4+:** Build
