# Changelog

## [1.1.0] - 2026-04-06

### Added

- Full Wikidata catalog fetch with pagination (500 items/page across all categories)
- Batch inserts (200 rows/request) for seed load performance
- Service role key authentication for seed script to bypass RLS
- Unresolved Wikidata label filtering (items with QID-only titles are excluded)

### Changed

- Seed script upgraded from dev-only (~200 items) to full catalog (~8,800 unique works)
- Load command uses `SUPABASE_SERVICE_ROLE_KEY` instead of anon key

## [1.0.0] - 2026-04-06

### Added

- Expo Router app with 5-tab navigation (Home, Search, Log, Wishlist, Settings)
- Supabase auth flow (login/signup) with session auto-refresh
- Work, Production, and LogEntry CRUD
- Wishlist with XOR constraint (Work or Production)
- Half-step star ratings (0.5-5.0)
- Full-text search with GIN indexes
- Wikidata dev seed script (fetch + load subcommands)
- SPARQL transform utilities with creator grouping and deduplication
- i18n support (English and Brazilian Portuguese)
- Responsive web layout and design system
- NativeWind (Tailwind) styling with centralized color theme
- Data export from Settings screen
- ESLint, Prettier, and TypeScript strict mode
