# Review/Rating Platform Technical Research

Deep technical research into Letterboxd, Rotten Tomatoes, Goodreads, and similar platforms. Compiled April 2026.

---

## Table of Contents

1. [Letterboxd (Films)](#1-letterboxd-films)
2. [Rotten Tomatoes (Films/TV)](#2-rotten-tomatoes-filmstv)
3. [Goodreads (Books)](#3-goodreads-books)
4. [Other Platforms](#4-other-platforms)
   - [RateYourMusic / Sonemic](#rateyourmusic--sonemic-music)
   - [MyAnimeList](#myanimelist-animeamanga)
   - [Backloggd](#backloggd-video-games)
   - [Serializd](#serializd-tv-shows)
   - [StoryGraph](#storygraph-books)
   - [IMDb](#imdb-filmstv)
   - [Metacritic](#metacritic-multi-media)
5. [Common Technical Patterns](#5-common-technical-patterns)
6. [Open Source References](#6-open-source-references)
7. [Theatre Metadata Landscape](#7-theatre-metadata-landscape)
   - [Major Databases (No Public APIs)](#major-theatre-databases-no-public-apis)
   - [Sources With APIs](#data-sources-with-apis)
   - [Open Source Theatre Projects](#open-source-theatre-projects)
   - [Existing Theatre Tracking Apps (Competitors)](#existing-theatre-tracking--review-platforms-competitors)
   - [International Databases](#international-theatre-databases)
   - [Gap Analysis](#gap-analysis-theatre-vs-filmmusic)
8. [Key Takeaways for Building a Theatre Platform](#8-key-takeaways-for-building-a-theatre-platform)

---

## 1. Letterboxd (Films)

**Scale**: ~26M users (2026), founded 2011 in Auckland, NZ. Acquired 60% by Tiny (Canada) in Sept 2023. ~110 employees across 6 continents.

### Tech Stack

| Layer           | Technology                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Backend         | Java on custom in-house CMS framework                                                           |
| App Server      | Apache Tomcat                                                                                   |
| Web Server      | nginx with in-house load balancing                                                              |
| Database        | PostgreSQL with read replicas                                                                   |
| ORM             | Hibernate                                                                                       |
| Cache           | Redis (metadata), Varnish (HTTP-level, custom fork)                                             |
| CDN             | Cloudflare                                                                                      |
| Frontend        | Server-side rendered HTML, jQuery, ProseMirror (rich text editor), Tailwind CSS + Vite (recent) |
| iOS App         | Native Swift/Objective-C (built by Cactuslab)                                                   |
| Android App     | Kotlin with Ktor (auto-generated API clients via OpenAPI)                                       |
| Data Source     | TMDb API (syncs within 30 hours)                                                                |
| Streaming Data  | JustWatch                                                                                       |
| Recommendations | Nanocrowd/ViewerVoice (nanogenre clustering from review language)                               |

The founders (Karl von Randow and Matthew Buchanan) built the CMS framework through their studio Cactuslab. Karl also created Charles Proxy and Camera+. The architecture is traditional (Tomcat + nginx + PostgreSQL + Varnish + Redis) rather than cloud-native/serverless.

**Open Source Footprint** (github.com/Letterboxd): 7 public repos including a Varnish Cache fork (C), OpenAPI Kotlin client generator, ProseMirror selection menu plugin, and Swagger-core fork.

Sources:

- https://www.quora.com/What-is-the-technology-stack-behind-Letterboxd
- https://github.com/Letterboxd
- https://cactuslab.com/work/letterboxd-for-ios/

### Data Model

**Core Entities:**

- **Film**: TMDb ID, Letterboxd ID (LID), title, original title, year, synopsis, runtime, poster/backdrop, trailer URLs. Related to: genres, contributors (directors, actors, writers), countries, languages, studios. Aggregate stats: rating histogram, weighted average, watch count, list appearances, like count, review count.
- **Member (User)**: Username, display name, bio, avatar, pronoun, location, account tier (free/Pro/Patron/HQ), privacy settings, favorite films, followed streaming services, followers/following.
- **Rating**: Member + Film + value (0.5-5.0 in 0.5 increments, 10 discrete values). Timestamp. Exists independently of reviews/diary.
- **Review**: Member + Film + rich text (HTML via ProseMirror). Optional rating. Spoiler flag. Like/comment counts.
- **Diary Entry (LogEntry)**: Member + Film + watched date + logged date. Optional rating, optional review. Rewatch flag. User-defined tags. The record of _watching_ on a specific date.
- **List**: Owner, title, description, tags. Ranked flag (entries get ordinal positions). Privacy: public/private/friends/unlisted. Entries have optional per-film notes.
- **Watchlist**: Per-member ordered collection. Essentially a special-case list.
- **Activity**: Event stream per member (ratings, reviews, diary entries, likes, comments, list updates, follows).

**Key Design Insight**: Ratings, reviews, and diary entries are **three separate concepts**. You can rate without reviewing, review without rating, log without rating, or combine any of these. The export CSV structure confirms this separation (separate files for diary.csv, ratings.csv, reviews.csv, watched.csv, watchlist.csv).

**Export Limitation**: Exports use Letterboxd URI slugs, not TMDb IDs, making external interoperability difficult by design.

Sources:

- https://www.feadin.eu/en/posts/letterboxd_i_love_you_but_we_need_to_talk_about_your_exports/
- https://docs.rs/letterboxd (Rust client reveals API structures)

### Rating System & Scoring

- **Scale**: 0.5 to 5.0 stars in 0.5 increments (10 values, equivalent to 1-10)
- **Display**: Interactive star widget; hover left/right half of star for half/full ratings
- **Aggregation**: **Weighted average** (not simple mean). Conceptually similar to Bayesian average: films with few ratings are pulled toward the global mean; films with many ratings reflect their raw average.
- **Anti-manipulation**: In 2023, Letterboxd made the "most significant change" to their weighting since launch, improving detection of "unusual patterns of rating activity." Specifics intentionally undisclosed.
- **Academic finding**: A research paper ("Behind the Stars," WebMedia/SBC) found evidence of Bayesian shrinkage plus additional normalization/compression pulling ratings toward center. Goes beyond simple Bayesian average.
- **Histogram**: Film pages show raw distribution at each half-star level.

Sources:

- https://letterboxd.com/journal/the-score-new-weighted-average-ratings/
- https://sol.sbc.org.br/index.php/webmedia/article/download/37951/37729

### API

- **Base URL**: `https://api.letterboxd.com/api/v0/`
- **Status**: Beta (for years). Access by request only (`api@letterboxd.com`). Approval takes months, not guaranteed.
- **Architecture**: RESTful, JSON, OpenAPI-specified. OAuth2 (password, client credentials, authorization code, refresh token). Access tokens expire after 3600s.
- **Restrictions**: No access for data analysis, recommendations, LLM projects, personal projects, or anything recreating paid features. Pagination capped at 100,000 objects.
- **Some endpoints are "First Party" only** (Letterboxd's own apps) due to TMDb licensing.
- **Community wrappers**: Python (PyPI), Rust (crates.io), JavaScript (npm) -- all limited by access constraints.

Sources:

- https://api-docs.letterboxd.com/
- https://letterboxd.com/api-beta/

### What Developers Praise

- **Product-market fit through focus**: Film-only activity feed, no algorithm, no ads in feed. Creates a healthier social experience than general social media.
- **Data model elegance**: The separation of ratings/reviews/diary entries gives users flexibility.
- **Half-star scale**: Sweet spot between granularity and simplicity.
- **Inspiration for clones**: The "Letterboxd for X" pattern is the dominant template for niche cataloging platforms.

### What Developers Criticize

- **API is extremely restrictive**: Most common developer complaint. "Beta" for years, entire use categories banned, slow manual approval. Forces developers to scrape.
- **Export is intentionally limited**: No TMDb IDs, inconsistent formats. "Designed for compliance rather than data portability."
- **Recommendations are basic**: Before Nanocrowd, none. Even now, limited.
- **No developer ecosystem**: Restrictive API means no meaningful third-party apps.

---

## 2. Rotten Tomatoes (Films/TV)

**Scale**: Owned by Versant (spun off from Comcast, 2025). Operates under Fandango Media. Engineering in Englewood Cliffs, NJ and Orlando, FL.

### Tech Stack

| Layer             | Technology                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Cloud             | AWS (confirmed by internal URLs: `rt-client-facade-v2-6-1.aws.prod.flixster.com`)                |
| Backend Languages | Python, C#, Java, TypeScript                                                                     |
| Architecture      | Migrating from monolith to microservices, event-driven                                           |
| Auth              | AWS Cognito (passwordless since Aug 2022 via Google, Facebook, email magic links)                |
| Editorial CMS     | WordPress with Jetpack                                                                           |
| Ads               | Google Publisher Tag (GPT) + Versant MPS                                                         |
| Frontend          | JSON-LD structured data (schema.org). 25% higher CTR after adding structured data to 100k+ pages |
| AI/ML             | LLM integration for metadata; job postings mention MCP Servers                                   |

Sources:

- https://www.showbizjobs.com/jobs/nbcuniversal-staff-engineer-rotten-tomatoes-in-orlando/jid-369vqn
- https://jobs.smartrecruiters.com/Versant3/744000118606982-staff-engineer-rotten-tomatoes

### Data Model

**Core Entities:**

- **Movie/Film**: id, title, year, slug (`/m/[movie_slug]`), mpaa_rating, runtime, synopsis, genres, director, actors, release_dates (theater/streaming), posters (multiple sizes), tomatoScore (0-100), tomatoIcon (certified_fresh/fresh/rotten), popcornScore (0-100), popcornIcon, critics_consensus, average_rating (0-10), tomatometer_count, fresh/rotten counts.
- **TV Show**: Hierarchical: Series > Seasons > Episodes. Each season gets its own Tomatometer.
- **Critic/Reviewer**: Name, publisher, top_critic flag, approval status.
- **Critic Review**: review_type (Fresh/Rotten binary), review_score (original scale), date, content/pull-quote. Linked to movie + critic.
- **Audience Rating**: Star rating (0-5, 3.5+ = positive), text (optional), verified flag (Fandango ticket confirmation). Linked to user account.

**JSON-LD Markup**: Embeds schema.org Movie, TVSeason, TVEpisode, AggregateRating types.

Sources:

- https://www.kaggle.com/datasets/stefanoleone992/rotten-tomatoes-movies-and-critic-reviews-dataset
- https://www.rottentomatoes.com/faq

### Dual Scoring System

#### Tomatometer (Critics)

The process is **surprisingly manual**:

1. Human curators track down reviews from all Tomatometer-approved critics
2. Curators read each review and classify as Fresh or Rotten (subjective for reviews without numeric scores)
3. Some approved critics self-submit and choose their own Fresh/Rotten designation
4. Calculation: `(Fresh reviews / Total reviews) * 100`

**No weighting**. A mildly positive 3/5 counts exactly the same as a 5/5 rave. The Tomatometer measures **breadth of approval, not intensity**.

**Separate Average Rating**: Each critic's score is normalized to 0-10 and averaged. Displayed as secondary metric (e.g., "7.2/10").

#### Popcornmeter (Audience)

- Users rate 0.5-5 stars. Rating >= 3.5 = positive.
- Percentage = (ratings >= 3.5) / total \* 100
- Two sub-scores: Verified (Fandango ticket confirmed) and All.

#### Thresholds

| Icon                 | Threshold                                                                              |
| -------------------- | -------------------------------------------------------------------------------------- |
| Fresh (red tomato)   | >= 60% Tomatometer                                                                     |
| Rotten (green splat) | < 60% Tomatometer                                                                      |
| Certified Fresh      | >= 75% + minimum reviews (80 wide/40 limited) + 5 Top Critic reviews + score stability |
| Hot (audience)       | >= 60% Popcornmeter                                                                    |
| Stale (audience)     | < 60% Popcornmeter                                                                     |
| Verified Hot         | >= 90% verified + 500 verified ratings (wide)                                          |

Certified Fresh is retained unless score drops below 70%. Verified Hot removed if below 80%.

#### Score Display Minimums (by box office forecast)

| Forecast   | Min Reviews for Tomatometer | Min Verified for Popcornmeter |
| ---------- | --------------------------- | ----------------------------- |
| $120M+     | 40                          | 500                           |
| $60M-$120M | 20                          | 300                           |
| <$60M      | 10                          | proportionally lower          |

Sources:

- https://thehustle.co/01222020-rotten-tomatoes-reviews
- https://www.rottentomatoes.com/about
- https://editorial.rottentomatoes.com/article/introducing-verified-audience-score/

### Approved Critics & Top Critics

**Approved Critics** must meet criteria in Insight, Audience reach, Quality, Dedication:

- Written: 2+ years, 200k+ monthly unique visitors (SimilarWeb) or established publication
- Video: 30k+ YouTube subscribers
- Podcasts: 200+ Apple Podcasts ratings, 4+ episodes/month
- Newsletters: 5k+ subscribers

**Top Critics**: 5+ years professional reviewing, 4-6+ reviews/month, publications with 5M+ visits over 6 months. Top Critics are displayed but **have no special weight** in the Tomatometer.

### Verified Audience Score (Anti-Review-Bombing)

Launched May 2019:

- Links Fandango account; checks email matches ticket purchase AND showing time has passed
- One verified review per transaction
- Post-screening push notifications via Fandango app prompt reviews
- Currently only Fandango verification (exploring third-party exhibitor barcodes)

### Critics Consensus

**Written by human editors**, not generated algorithmically. Curators identify recurring themes across reviews and synthesize a 1-2 sentence summary.

### API

- **Official API**: REST, managed by Fandango Developer Network. Approval takes up to 60 days. **$60,000+/year** license fee.
- **Internal/Undocumented API** (used by the website):
  - Browse: `GET https://www.rottentomatoes.com/api/private/v2.0/browse` (params: minTomato, maxTomato, services, certified, sortBy, type)
  - Search: categorized results across movies, TV, actors, critics
  - No API key required for internal endpoints
- **Third-party ecosystem**: Many scrapers and wrappers exist due to prohibitive API cost (rottentomatoes-python, rotten_tomatoes_client, etc.)

Sources:

- https://developer.fandango.com/rotten_tomatoes
- https://github.com/jaebradley/rotten_tomatoes_client

### Controversies & Vulnerabilities

**Bunker 15 Manipulation (2023)**: PR firm paid critics $50+ per positive review for 5+ years. Exploited loosened 2018 eligibility requirements. Negative reviews redirected to blogs RT doesn't track. Example: _Ophelia_ went from 48% (Rotten) to 62% (Fresh) after 7/8 paid positive reviews.

**Review Bombing**: Led to verified audience score system (2019). But Fandango-only verification excludes most ticket buyers.

**The Binary Collapse Problem**: A 100% film isn't the "best" -- it's one no critic disliked. A universally "okay" 3/5 film scores 100%, while a polarizing masterpiece (half 5/5, half 1/5) scores 50%. The system rewards safe over bold.

**Critic Expansion (post-2016)**: Reviewer pool grew significantly, including lesser-known outlets. Correlated with rising average Tomatometer scores and growing critic/audience divergence.

Sources:

- https://www.statsignificant.com/p/is-rotten-tomatoes-still-reliable
- https://dexerto.com/tv-movies/rotten-tomatoes-scores-manipulated-pr-firm-paying-critics-reviews-2282558/

---

## 3. Goodreads (Books)

**Scale**: 150M+ users, launched Dec 2006/Jan 2007, acquired by Amazon March 2013 for undisclosed amount. ~110+ employees.

### Tech Stack

| Layer           | Technology                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Backend         | Ruby on Rails (founder coded it solo learning Rails in 2006)                                                                        |
| Database        | MySQL (strong circumstantial evidence), likely Amazon RDS post-acquisition                                                          |
| Frontend        | React (modern, async-loading), with legacy Rails views underneath. jQuery, CoffeeScript, GSAP                                       |
| Hosting         | AWS (post-acquisition)                                                                                                              |
| CDN             | CloudFront; assets from `s.gr-assets.com` and `m.media-amazon.com`                                                                  |
| Auth            | Amazon sign-in integration                                                                                                          |
| Mobile          | Native iOS (Swift/Obj-C) and Android (Java)                                                                                         |
| Recommendations | Discovereads ML engine (acquired 2011), uses restricted SVD, nearest neighbors, mean extraction. Analyzes "20 billion data points." |

Sources:

- https://mixergy.com/interviews/goodreads-otis-chandler/
- https://stackshare.io/goodreads/goodreads

### Data Model

**Key Design: Works vs. Editions**

Goodreads uses a two-level hierarchy:

- **Work**: The abstract creative concept (e.g., "To Kill a Mockingbird"). Aggregate ratings computed from all editions.
- **Edition (Book)**: A specific manifestation -- publisher, ISBN, format (hardcover/paperback/audio/ebook), language, cover art, page count. Has its own Goodreads book_id.

One Work has many Editions. Ratings attach to editions but aggregate up to the Work level. Community volunteer **librarians** manage combining/separating editions.

**Full Entity List:**

| Entity           | Key Fields                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| Work             | work_id, original_title, original_pub_year, aggregate_rating, ratings_count                          |
| Book/Edition     | book_id, work_id, title, isbn, isbn13, asin, publisher, pub_date, format, language, num_pages, cover |
| Author           | author_id, name, bio, image, fans_count, works_count, avg_rating                                     |
| User             | user_id, username, profile, friend_count, review_count                                               |
| Review           | review_id, user_id, book_id, rating (1-5), text, date_added, date_read, spoiler_flag                 |
| Shelf            | shelf_id, user_id, name, exclusive_flag, sortable, featured, sticky                                  |
| Shelf-Book       | user_id, book_id, shelf_name, date_added/read/started, position                                      |
| UserStatus       | status_id, user_id, book_id, page, percent, comment, created_at                                      |
| Series           | series_id, title, description, works_count                                                           |
| ReadingChallenge | user_id, year, goal, books_read_count                                                                |

**Dataset scale** (UCSD research dataset): 2,360,655 books, 1,521,962 works, 829,529 authors, 400,390 series.

Sources:

- https://cseweb.ucsd.edu/~jmcauley/datasets/goodreads.html
- https://help.goodreads.com/s/article/Librarian-Manual-How-to-combine-editions

### Key Features

**Bookshelves**: Three default exclusive shelves (Read, Currently Reading, Want to Read) plus user-created custom shelves. Two types:

- **Exclusive**: Book can only be on one exclusive shelf (including defaults). Used for "DNF", "Wishlist", etc.
- **Non-exclusive**: Book can be on many simultaneously ("favorites", "sci-fi", "2024-reads").

Shelf names double as genre/tag data -- if many users shelve a book as "science-fiction", that becomes a genre tag.

**Reading Progress**: Page number or percentage on "Currently Reading" shelf. Each update creates a UserStatus visible in feeds. Percentage relies on page count data (frequently inaccurate).

**Reading Challenges**: Numeric goal for books per year. Tracks books moved to "Read" shelf. Book-count only (no page count). Adjustable during the year.

**Author Program**: Authors claim profiles with proof of publication. Get dashboard, blog, events, giveaways, Q&A.

### Rating System

- **Scale**: 1-5 stars, integer only (no half-stars). Labels: 1="didn't like it" through 5="it was amazing"
- **Aggregation**: Appears to be **simple arithmetic mean** (no public evidence of Bayesian weighting). Displayed to two decimal places.
- **Statistical problem**: 80% of books with 50+ ratings cluster between 3.5 and 4.2 stars. The effective range is less than one star, giving poor discriminatory power.
- **Pre-publication ratings allowed**: Books can have thousands of ratings before release.

### API (Deprecated)

- **REST API** returning **XML only** (never JSON, despite years of requests)
- **Auth**: API key as query param (simple endpoints) or OAuth 1.0 (write/private)
- **Rate limit**: 1 request/second
- **Deprecated December 2020**: Keys older than 30 days deactivated, no new keys issued, no replacement
- **Comprehensive endpoints** existed: book search/show, author search/show, reviews CRUD, shelves CRUD, user profiles, series, groups, reading progress, notifications, comparisons, recommendations
- **Data sources**: Amazon Product Advertising API, Ingram Content Group (2012-2013), WorldCat, Library of Congress

Sources:

- https://github.com/adamkrogh/goodreads-dotnet/wiki/API-methods
- https://news.ycombinator.com/item?id=25405737

### Known Technical Problems

**Performance**: "Excruciatingly slow." 504 timeouts common. React frontend loads asynchronously (skeleton then data). No evidence of modern search (Elasticsearch/Solr).

**Stagnation**: "No meaningful improvements since 2014." 2025 "redesign" was purely cosmetic (new logo, colors), zero functional changes. Publishing industry accuses Amazon of buying to prevent competition, not to improve.

**Data Quality**: Wrong page counts, misattributed editions, duplicates. Genre data relies entirely on user shelf names with no curation. AI-generated counterfeit books under real authors' names (2023 problem).

**Rating Integrity**: Pre-publication ratings, paid review services ($40 for 20 reviews), anonymous review bombing, no way to filter publisher-seeded advance copies.

**Architecture** (inferred from symptoms): Rails monolith minimally refactored since 2006-2007. MySQL straining under 150M users. Limited caching/CDN optimization. Small engineering team for massive scale.

### Community Consensus

**HN/Reddit agreement**: The technical work of building a Goodreads replacement is straightforward. The real barrier is the network effect of 150M users and millions of reviews. "The technical aspect is the smallest problem."

**What worked**: Work/Edition data model, shelf system (exclusive vs. non-exclusive), community librarian program, social graph for book activity, first-to-scale advantage.

**What failed**: Zero post-acquisition investment, API killed, search never improved, recommendation engine stagnated, no moderation tools, data quality relies on volunteer labor, 5-star integer scale produces compressed distributions.

Sources:

- https://onezero.medium.com/almost-everything-about-goodreads-is-broken-662e424244d5
- https://lithub.com/the-problems-with-goodreads/
- https://news.ycombinator.com/item?id=36575003

---

## 4. Other Platforms

### RateYourMusic / Sonemic (Music)

**Scale**: 1.3M registered users, 6.6M releases, 147M ratings, 819k+ lists. Founded December 2000.

**Rating**: 0.5-5.0 stars (half-star increments). Uses weighted averages (formula undisclosed, known to be more than simple averaging).

**Unique Features**:

- **Descriptor system**: Community-voted tags for mood (warm, uplifting), lyrical content (educational, political), form (concept album, suite). Separate from genres.
- **Genre tree**: Deeply hierarchical, community-maintained. Considered the most comprehensive genre taxonomy of any platform.
- **Charts**: 50+ filter options (descriptor, subgenre, language, label, "diverse" charts with one entry per artist, popularity weighting).
- **Pre-moderation**: All new/edited content must be approved before going live. High data quality, slow throughput.
- **Sibling sites**: Glitchwave (games) shares Sonemic infrastructure.

### MyAnimeList (Anime/Manga)

**Scale**: Largest anime/manga database. Acquired by Gaudiy (2025). Frontend uses 62+ technologies including jQuery.

**Rating**: 1-10 integer scale. **Bayesian estimation** for rankings: only scores from users who completed 20%+ of the anime are counted. Rankings recalculated twice daily. Formula: `WR = (v / (v + m)) * R + (m / (v + m)) * C` where m=50.

**Official API**: v2, OAuth2, JSON. Also an unofficial Jikan API (reverse-engineered).

**Unique**: List statuses (watching/completed/on-hold/dropped/plan-to-watch), seasonal charts, comprehensive character/staff database with cross-references.

### Backloggd (Video Games)

**Scale**: Free with $3/month Backer tier. Integrates with IGDB (Twitch) for metadata.

**Tech**: Likely Ruby on Rails (ecosystem signals). No official API; unofficial community-built scraper API exists.

**Unique**: Game statuses (shelved/retired/abandoned), time tracking, platform ownership tracking, daily journaling. Clean Letterboxd-like UI for games.

### Serializd (TV Shows)

**Scale**: 200k+ users, 10k+ DAU. Created by one developer + one designer. Launched April 2023. Free.

**Tech**: Uses TMDB for data. Web + iOS + Android with feature parity.

**Unique**: **Per-episode reviews** (not just per-show), episode release notifications, viewing statistics, streaming platform metadata.

### StoryGraph (Books)

**Scale**: 4M+ users. Founded 2019 by Nadia Odunayo (largely solo developer).

**Tech Stack (confirmed)**:

- Ruby on Rails, PostgreSQL (migrated from Heroku to YugabyteDB for distributed SQL)
- Devise (auth), Sidekiq (background jobs), Makara (read/write splitting)
- Turbo Native (Hotwire) for cross-platform iOS/Android
- Dedicated AI/ML recommendation engine (opt-in/toggleable)

**Unique**: Mood/pace/theme-based discovery, reading preferences questionnaire, quarter-star ratings, content/trigger warnings (community-contributed), AI features fully toggleable.

**Developer praise**: Remarkable Rails scaling achievement at 4M+ users as largely a solo developer.

### IMDb (Films/TV)

**Scale**: Largest film/TV database. Owned by Amazon. AWS infrastructure.

**Rating**: 1-10 integer. **Industry-standard Bayesian formula** (most documented):

```
WR = (v / (v + m)) * R + (m / (v + m)) * C

v = number of votes for the title
m = minimum votes required (25,000 for Top 250)
R = average rating for the title
C = mean vote across all titles (~6.8)
```

Additional weighting by: user voting history length, rating recency, account age, fraud detection. Experienced voters carry more weight. Exact methodology secret.

### Metacritic (Multi-Media Critic Aggregation)

**Scoring**: Metascore is a **weighted average of critic scores** on 0-100 scale:

1. Each critic review converted to 0-100 (even non-numeric reviews get assigned scores)
2. Each publication assigned a weight based on prestige/consistency/quality (<6 tiers)
3. For movies/music, scores normalized on a curve before averaging
4. User scores separate, simple average 0-10

**Criticism**: Opaque weighting, converting non-numeric reviews to numbers is subjective, easily manipulated user scores.

---

## 5. Common Technical Patterns

### Rating Systems Comparison

| Approach          | Formula                                      | Pros                                                    | Cons                                                         | Used By              |
| ----------------- | -------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------ | -------------------- |
| Simple Average    | sum/count                                    | Easy                                                    | Skewed by few votes, unreliable at low N                     | Goodreads (apparent) |
| Bayesian Average  | `(v*R + m*C)/(v+m)`                          | Handles low-vote items; bounded; converges to true mean | Must choose m; pulls everything toward global mean initially | IMDb, MAL, AniList   |
| Weighted Average  | Per-user weights (proprietary)               | Accounts for user credibility, fraud                    | Complex, opaque                                              | Letterboxd, RYM      |
| Binary Percentage | Fresh count / Total \* 100                   | Simple to understand                                    | Loses intensity; rewards safe over bold                      | Rotten Tomatoes      |
| Weighted Critic   | Publication-weighted average + normalization | Expert opinion; resistant to brigading                  | Subjective weights; excludes user voice                      | Metacritic           |

**Key implementation insight**: The Bayesian average formula is the industry starting point. The weight function `w = m/(m+n)` approaches 0 when an item has few ratings (defaulting to system mean) and 1 as ratings accumulate. Choose m based on your data's vote-count distribution.

### Metadata: External APIs vs. User-Contributed

**External API approach** (most common):

- TMDb: Letterboxd, Serializd, most movie/TV clones
- IGDB (Twitch): Backloggd, Glitchwave
- MusicBrainz/Discogs/Spotify: Music platforms
- Google Books/Open Library: Book platforms
- NeoDB: Integrates 19+ external sources simultaneously

**User-contributed approach**: RateYourMusic (community adds/moderates all data with approval gates), MAL (staff + community mix).

**Best practice**: External APIs for core metadata (titles, dates, credits, images), then user-contributed enrichments on top (genres, tags, descriptors, corrections).

### Social Feature Architecture

**Activity Feed patterns**:

- **Fan-out on write** (normal users <10k followers): When user acts, immediately write to all followers' feed tables. Read = simple query.
- **Fan-out on read** (high-follower accounts): Store events once, compute feeds at query time.
- **Hybrid** (industry standard): Write fan-out for most users, read fan-out for celebrities.
- **Event model**: actor -> action -> object [-> target] with actor_id, action_type, object_type, object_id, timestamp.
- **Real-time**: Server-Sent Events (SSE) preferred over WebSockets for read-only feeds; Redis Pub/Sub as message bus.
- **Aggregation**: Group related events in time windows ("3 friends also watched X").
- **Caching**: Top ~100 feed entries in Redis; cursor-based pagination.

### List/Collection Features (Universal Pattern)

All successful platforms implement:

- **Status tracking**: Watching/Completed/Dropped/Plan to Watch (MAL pattern, adopted universally)
- **Custom lists**: User-created, orderable collections
- **Favorites/Bookmarks**: Quick-save separate from lists
- **Diary/Journal**: Date-stamped consumption log (Letterboxd diary, Backloggd journal)

### Search & Discovery

- Full-text search on titles, people, users (standard)
- Faceted filtering (RYM leads with genre/descriptor/year/language/label)
- Recommendation engines: Collaborative filtering + content-based filtering. StoryGraph adds mood/pace axes.
- Charts/Rankings: Bayesian-weighted top lists, filterable by period/genre

### Content Moderation

| Model           | How                                                        | Quality      | Speed        | Used By           |
| --------------- | ---------------------------------------------------------- | ------------ | ------------ | ----------------- |
| Pre-moderation  | All content reviewed before publishing                     | Highest      | Slowest      | RYM               |
| Post-moderation | Content live immediately, reviewed after                   | Medium       | Fastest      | Most platforms    |
| Hybrid          | AI auto-filters clear violations, humans handle edge cases | High         | Fast         | Industry standard |
| Community       | Trusted users gain moderator privileges                    | Varies       | Medium       | RYM, MAL          |
| Federation      | Each instance sets own rules                               | Per-instance | Per-instance | BookWyrm, NeoDB   |

---

## 6. Open Source References

### BookWyrm (Goodreads Alternative) -- Most Mature

- **GitHub**: github.com/bookwyrm-social/bookwyrm (2.7k stars)
- **Stack**: Python/Django, PostgreSQL 14+, Celery + Redis, Bulma.io CSS, Gunicorn, Docker, nginx
- **Key**: ActivityPub federation (interoperates with Mastodon). Custom activity types for book-specific data. 74.6% Python, 10,583 commits.
- **Learning**: Clean Django model -> ActivityPub serialization. How to extend ActivityPub for domain-specific data.

### NeoDB (Multi-Media Cataloging) -- Most Comprehensive

- **GitHub**: github.com/neodb-social/neodb
- **Stack**: Python/Django, ActivityPub (modified Takahe server), containerized
- **Key**: Single platform for books, movies, TV, music, games, podcasts, **performances**. Integrates 19+ external data sources. Mastodon-compatible API. ATProto/Bluesky support.
- **Learning**: Best reference for multi-media cataloging. Shows how to normalize diverse media types into a single data model.

### Cloneboxd (Letterboxd Clone)

- **GitHub**: github.com/ddanielsantos/cloneboxd (archived)
- **Stack**: TypeScript, React + Relay, Koa + GraphQL, MongoDB, TMDB API, Vite, Chakra UI
- **Learning**: GraphQL-based review platform; Relay for declarative data fetching.

### Other Letterboxd Clones

- MERN stack (MongoDB/Express/Node/EJS + TMDB): github.com/Sorracha-A/Letterboxd-Clone
- React + Firebase: github.com/janaiscoding/letterboxd-clone
- React + GraphQL + Prisma: github.com/drothschild/letterboxed-clone
- Flutter + Firebase: github.com/tanishq5414/postalboxd
- PHP + AWS RDS + TMDB: github.com/ClintHarding/Letterboxd-Clone

### Rating Library (Ruby)

- **GitHub**: github.com/wbotelhos/rating
- Implements IMDb Bayesian formula: `WR = (v/(v+m)) * R + (m/(v+m)) * C`
- Scoped ratings (rate same item in different contexts), cached aggregation, configurable via YAML.

### Trakt API (TV/Movie Tracking)

- **GitHub**: github.com/trakt/trakt-api
- **Stack**: ts-rest + zod (type-safe), Hono server, Deno runtime, OpenAPI spec
- RESTful with scrobbling, watch history, ratings, lists, social features.

### AniList API (GraphQL Reference)

- **Docs**: docs.anilist.co
- 500k+ anime/manga entries. AniList's own websites run on this API -- reference for "API-first" cataloging platforms.

---

## 7. Theatre Metadata Landscape

**There is no single TMDb equivalent for theatre**, anywhere in the world. The landscape is fragmented. For a **Brasilia-focused platform**, this is actually less of a problem than it sounds -- the international databases (IBDB, Playbill, etc.) are Broadway/West End-centric and largely irrelevant. What matters is the Brazilian ecosystem.

### 7a. Brasilia Theatre Scene

#### Major Venues

| Venue                                               | Notes                                                                                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Teatro Nacional Claudio Santoro**                 | Flagship. Designed by Oscar Niemeyer. Multiple halls (Sala Villa-Lobos, Sala Martins Pena, Sala Alberto Nepomuceno). Periodic closures for renovation. |
| **CCBB Brasilia** (Centro Cultural Banco do Brasil) | One of the most visited cultural centres in the world. National touring productions.                                                                   |
| **Teatro SESC Paulo Autran** (SESC Garagem)         | SESC's Brasilia venue. Theatre, music, workshops.                                                                                                      |
| **Teatro Dulcina de Moraes**                        | On the Funarte complex. Important for independent/experimental work.                                                                                   |
| **Espaço Cultural Renato Russo** (508 Sul)          | Public cultural space. Experimental and community theatre.                                                                                             |
| **Teatro Plinio Marcos** (Funarte)                  | Smaller, experimental and independent.                                                                                                                 |
| **Teatro Goldoni**                                  | Private. Commercial comedies and stand-up.                                                                                                             |
| **Teatro da Caixa** (Caixa Cultural Brasilia)       | Bank-sponsored cultural centre. Regular performing arts.                                                                                               |
| **Centro de Convenções Ulysses Guimarães**          | Hosts larger touring musicals and concerts.                                                                                                            |
| **Teatro dos Bancarios**                            | Run by banking workers' union. Active mid-size venue.                                                                                                  |
| **Teatro Mapati**                                   | Independent venue.                                                                                                                                     |

#### Character of the Scene

- **Mix of touring and local**: Big commercial musicals (Brazilian touring productions) at CCBB, Teatro Nacional, Centro de Convenções. Local independent companies produce year-round.
- **Strong comedy/stand-up presence**: Stand-up is huge in Brazil; Brasilia has a very active circuit.
- **Experimental/university**: UnB (Universidade de Brasilia) has an Artes Cenicas department. Several independent collectives.
- **Government-adjacent**: As the federal capital, Brasilia has direct access to federal cultural funding (Lei Rouanet, Funarte, FAC).
- **FAC (Fundo de Apoio a Cultura)**: The Distrito Federal's own cultural fund. Major driver of local production. Many local companies survive through FAC grants.
- **Instagram/WhatsApp driven**: Many smaller productions are announced only on Instagram, with tickets sold via WhatsApp or at the door. Any comprehensive platform must account for this informal channel.

### 7b. Brazilian Data Sources With APIs

These are the actually useful data sources for a Brasilia-focused platform:

#### Sympla API (Primary -- Ticketing)

- **URL**: https://developers.sympla.com.br/
- **What**: Major Brazilian events/ticketing platform. Very widely used for theatre ticketing in Brasilia.
- **Data**: Events, dates, venues, categories, ticket availability.
- **Access**: Public developer API. OAuth2. JSON.
- **Verdict**: **#1 most useful source** for current/upcoming ticketed events. Many independent Brasilia theatre productions sell through Sympla.

#### Mapas Culturais API (Primary -- Government Cultural Mapping)

- **URL**: https://github.com/mapasculturais/mapasculturais
- **What**: Open-source cultural mapping platform developed by Brazilian Ministry of Culture (Instituto TIM + Hacklab). Used by state/municipal governments across Brazil to map cultural agents, spaces, events, and projects. The DF (Distrito Federal) likely runs an instance.
- **Stack**: PHP (Slim framework + Doctrine ORM)
- **API**: Full REST API. Endpoints: `/api/agent/find`, `/api/space/find`, `/api/event/find`, `/api/project/find`. Returns JSON. Filter by type, location, date range, keywords.
- **Data model**: Agents (people/organizations), Spaces (venues with geolocation), Events (with occurrences/dates), Projects (funding programs). Events linked to Spaces and Agents.
- **Verdict**: **If the DF instance is active, this is the best structured source for venues, theatre companies, and events in Brasilia.** Check `cultura.df.gov.br` for the instance.

#### SALIC / VerSalic API (Federal Arts Funding)

- **URL**: https://versalic.cultura.gov.br/ (portal) / https://api.salic.cultura.gov.br/ (API)
- **What**: Public transparency portal for Lei Rouanet (federal arts incentive law). Every project receiving Lei Rouanet funding is listed.
- **Data**: Project name, proponent, municipality, art segment (including "Artes Cenicas" -- performing arts), approved budget, execution dates.
- **API**: RESTful, JSON. Endpoints: `/projetos`, `/proponentes`, `/incentivadores`. Can query: `area=artes+cenicas&UF=DF`.
- **Verdict**: Historical and current funded projects. Not real-time event listings, but a database of funded theatre projects in DF/Brasilia.

#### Ingresse API (Secondary -- Ticketing)

- **URL**: https://developer.ingresse.com/
- **What**: Another Brazilian ticketing platform. Less dominant in Brasilia than Sympla.
- **Access**: Developer API (check current status).
- **Verdict**: Secondary ticketing data source.

#### Portal Brasileiro de Dados Abertos

- **URL**: https://dados.gov.br/
- **What**: Brazilian open data portal. Has datasets from Ministry of Culture.
- **Search for**: "cultura", "artes cenicas", "Lei Rouanet"

### 7c. Brazilian Institutional Sources (No APIs, Scrapeable)

| Source                          | URL                                       | Notes                                                                                                         |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Enciclopedia Itau Cultural**  | https://enciclopedia.itaucultural.org.br/ | Closest thing Brazil has to a theatre encyclopedia. Entries for companies, artists, works. Not a listings DB. |
| **SESC-DF**                     | https://www.sescdf.com.br/                | Publishes event listings. Scrapeable.                                                                         |
| **CCBB Brasilia**               | https://ccbb.com.br/brasilia/             | Programming calendar. Structured, scrapeable.                                                                 |
| **Caixa Cultural**              | https://www.caixacultural.gov.br/         | Brasilia unit programming.                                                                                    |
| **Secretaria de Cultura do DF** | https://www.cultura.df.gov.br/            | FAC-funded project data. Published editais and results.                                                       |
| **FUNARTE**                     | https://www.funarte.gov.br/               | Administers theatres (Plinio Marcos, Sala Funarte in Brasilia). Publishes calls/reports as PDFs.              |

### 7d. Brasilia Theatre Review/Listing Sites

| Site                                       | Notes                                                                                                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Correio Braziliense** -- Diversao e Arte | https://www.correiobraziliense.com.br/diversao-e-arte/ -- Main Brasilia newspaper. Local theatre reviews and listings.                                                                    |
| **Metropoles**                             | https://www.metropoles.com/ -- Major Brasilia-focused digital news. Culture/entertainment section covers local theatre.                                                                   |
| **Curta Mais**                             | https://www.curtamais.com.br/ -- Brasilia-specific culture/lifestyle portal. One of the best local sources.                                                                               |
| **Catraca Livre**                          | https://catracalivre.com.br/ -- National "what's on" portal with Brasilia section.                                                                                                        |
| **Guia da Semana**                         | https://www.guiadasemana.com.br/brasilia -- National listings with Brasilia section.                                                                                                      |
| **BroadwayWorld Brazil**                   | https://www.broadwayworld.com/brazil/ -- Covers mostly large musical touring productions. Focuses on SP/Rio, occasionally Brasilia for big tours. Not useful for local independent scene. |

### 7e. Competitors / Existing Theatre Tracking

**No Brazilian "Letterboxd for theatre" exists.** This is a genuine gap.

Existing platforms that exist internationally are all Broadway/West End-focused and irrelevant for Brasilia:

| Platform               | Scope                      | Relevance to Brasilia                                                               |
| ---------------------- | -------------------------- | ----------------------------------------------------------------------------------- |
| BroadwayWorld My Shows | 350k+ productions globally | Has Brazil section but focuses on large SP/Rio musicals. Minimal Brasilia coverage. |
| Mezzanine              | Broadway/West End          | Not relevant                                                                        |
| Show-Score             | NYC + London               | Not relevant                                                                        |
| Stagedoor              | London                     | Not relevant                                                                        |

**How Brazilian theatregoers currently track**: Instagram (the de facto platform), WhatsApp groups, personal spreadsheets/Notion, or not at all.

### 7f. International Databases (Reference Only)

These are worth knowing about for data model inspiration, but not directly useful for Brasilia content:

| Database            | Country              | Why It Matters                                                                                                                                 |
| ------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **iUKTDb**          | UK                   | Best data model to study: Work -> Production -> Venue -> Listing with permanent IDs (QTIX Codes). 142k works, 1.2M events.                     |
| **AusStage**        | Australia/NZ         | Gold standard for open performing arts data (MySQL dump + SPARQL). 500k+ records. Model for what an open Brazilian equivalent could look like. |
| **StageBrainz**     | GitHub (global)      | Data model inspired by MusicBrainz: Organities, Productions, Shows, Works, Characters. Embryonic but worth studying.                           |
| **Mapas Culturais** | Brazil (open source) | Already mentioned above. The most relevant open-source reference since it's Brazilian government infrastructure.                               |

### 7g. Gap Analysis: Brasilia Specifically

| Need                      | Available?               | Best Source                                                         |
| ------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Current show listings     | Partial                  | Sympla API + Mapas Culturais + scraping CCBB/SESC                   |
| Venue data                | Yes                      | Mapas Culturais (with geolocation)                                  |
| Cast/crew for productions | **No structured source** | Must be community-contributed or scraped from news/social media     |
| Historical productions    | **No**                   | FAC/SALIC has funded project data only. No comprehensive archive.   |
| Reviews/ratings           | **No**                   | Scattered in Correio Braziliense, Metropoles. No aggregated source. |
| Theatre companies/artists | Partial                  | Mapas Culturais (agents), Enciclopedia Itau Cultural (encyclopedic) |
| Photos/posters            | **No structured source** | Instagram, newspaper archives                                       |
| Play texts/synopses       | **No**                   | No Brazilian equivalent of Doollee                                  |

### 7h. Recommended Metadata Strategy for Brasilia

1. **Sympla API** -- Seed current/upcoming events automatically. Most Brasilia theatre sells through Sympla.
2. **Mapas Culturais API** -- Venues (with geolocation), theatre companies, cultural agents. Check if DF instance is active.
3. **SALIC API** -- Historical funded performing arts projects in DF. Good for seeding a historical record.
4. **Community-contributed data** -- Cast/crew, synopses, photos must come from users. This is the RYM model. Design for it from day one.
5. **Scrape local media** -- Correio Braziliense, Metropoles, Curta Mais for reviews and listings as supplementary data.
6. **Instagram integration** -- Many productions exist only on Instagram. Consider ways to let users link/import from Instagram posts.
7. **Build the archive** -- No historical record of Brasilia theatre exists in structured form. Your platform could become that archive over time. This is culturally valuable and a unique selling point.

Sources:

- https://developers.sympla.com.br/
- https://github.com/mapasculturais/mapasculturais
- https://versalic.cultura.gov.br/
- https://api.salic.cultura.gov.br/
- https://dados.gov.br/
- https://enciclopedia.itaucultural.org.br/
- https://www.sescdf.com.br/
- https://ccbb.com.br/brasilia/
- https://www.cultura.df.gov.br/
- https://www.curtamais.com.br/
- https://www.correiobraziliense.com.br/diversao-e-arte/
- https://www.metropoles.com/
- https://www.broadwayworld.com/brazil/

---

## 8. Key Takeaways for Building a Brasilia Theatre Platform

### Theatre-Specific Data Modeling Challenge

Theatre has a unique hierarchy that film/books don't: **Obra (Work)** -> **Producao (Production)** (specific staging at a venue with a director/cast) -> **Apresentacao (Performance)** (a specific show on a specific night). This is more complex than Goodreads' Work/Edition model because:

- The same play can be radically different across productions
- Cast can vary night-to-night
- Performances are ephemeral -- you can't "rewatch" a specific performance
- Venue is a first-class entity (unlike film, where the cinema doesn't matter)
- In Brasilia specifically: many productions are FAC-funded one-off runs that may never be restaged

Study **iUKTDb's data model** (Work -> Production -> Venue -> Listing with permanent IDs) and **Mapas Culturais' model** (Agents, Spaces, Events, Projects) as references.

### Metadata Strategy for Brasilia

The hybrid approach (see [Section 7h](#7h-recommended-metadata-strategy-for-brasilia)):

1. **Sympla API** for current ticketed events (most Brasilia theatre sells through Sympla)
2. **Mapas Culturais API** for venues, theatre companies, cultural agents (government open-source platform)
3. **SALIC API** for historically funded performing arts projects in DF
4. **Community-contributed data** for cast/crew, synopses, photos (the RYM model -- design for this from day one)
5. **Scrape local media** (Correio Braziliense, Metropoles, Curta Mais) as supplementary
6. **Instagram awareness** -- many Brasilia productions exist only on Instagram/WhatsApp. Consider user-linking workflows.
7. **Build the archive** -- no historical record of Brasilia theatre exists in structured form. Your platform becomes that archive.

### Recommended Technical Patterns

1. **Rating System**: Bayesian averages (IMDb formula). Half-star (0.5-5.0, 10 values) is the proven sweet spot (Letterboxd, RYM).

2. **Proven Tech Stacks**:
   - Ruby on Rails + PostgreSQL (StoryGraph: solo-dev scaled to 4M+ users. BookWyrm: rich social features)
   - Python/Django + PostgreSQL (BookWyrm, NeoDB, Mapas Culturais is PHP but same pattern)
   - TypeScript/Node + PostgreSQL (Hardcover uses Next.js + Hasura/GraphQL)

3. **Social Architecture**: Fan-out-on-write for activity feeds. Event model (actor/action/object). Redis caching. SSE for real-time.

4. **Lists Are First-Class**: Every successful platform treats user-created lists as core. Lists drive discovery, engagement, and community.

### Learn From Failures

- **Goodreads**: Don't use simple averages (compressed distributions). Don't neglect search. Don't let data quality depend solely on volunteers.
- **Rotten Tomatoes**: Binary scoring loses nuance. Verify authenticity of reviews. Manual curation doesn't scale.
- **All platforms**: API access is the lifeblood of a developer ecosystem. Don't neglect it.

### Building the Community

The technology is the easy part. For a Brasilia-focused platform, community-building strategies include:

- **Partner with local theatre companies and collectives** -- they want visibility
- **Engage UnB Artes Cenicas** -- students and faculty are the natural early adopters
- **Connect with SATED-DF** (performers' union) -- access to the professional community
- **Leverage FAC-funded productions** -- these are public-interest projects that benefit from documentation
- **Seed venue data from Mapas Culturais** so the platform is useful before reviews exist (upcoming shows, venue info)
- **Instagram bridge** -- let users easily reference/link their Instagram theatre posts
- **Correio Braziliense/Metropoles critics** -- invite local theatre critics to the platform
- **Empty-state value**: Even without reviews, a unified Brasilia theatre calendar pulling from Sympla + CCBB + SESC + Caixa Cultural is genuinely useful and doesn't exist today
