# Super Rugby Manager — Management and annual development

Product Cohesion 1.0 is available as a **release candidate on the feature branch**.
It introduces six departments, a consistent graphite workspace, direct recruitment
and player pages, weekly preparation and evidence-led match reviews. Read
[the release report](docs/product-cohesion-release.md) for rules, calibration,
validation and open balance issues before merging it. The existing career setup,
fitness/readiness model and 3D match view are retained.

A working 2026 squad and rating explorer built from the user's supplied historical fantasy data. It includes a seeded match engine, matchday selection, tactics, seasons/finals, account-backed saves, career squads, contracts, recruitment, player concerns, squad planning and annual progression/regression.

## Reproduce

1. `python scripts/import_2026.py` imports the nine files in `data/raw/`.
2. `python scripts/test_foundations.py` validates the source identities, ratings and SQLite outputs.
3. `node scripts/test_simulation.ts` checks match integrity, selection, save/resume and 12 full seasons.
4. `node scripts/test_management.ts` checks migration, contracts, development and eight consecutive management seasons.
5. `node scripts/test_career_storage.ts` checks ownership, conflicts and pre-update backup retention.
6. `node scripts/validate_simulation.ts 4000` and `node scripts/validate_tactics.ts` reproduce calibration reports.
7. `npm run build` builds the application in the configured Sites environment.

The importer also accepts another source directory, with the same required field names. It rejects duplicate identities and broken joins. Keep the original raw snapshot and audit hashes together.

## Architecture

- `data/schema.sql`: canonical relational schema, nullable real facts and game-state placeholders.
- `data/raw/`: exact supplied source files.
- `scripts/import_2026.py`: strict validation, import, generated reports and presentation snapshot.
- `scripts/ratings/config.json`: coefficients and position weights.
- `scripts/ratings/model.py`: deterministic rating engine, isolated from the interface.
- `data/generated/career.sqlite`: reproducible foundation database.
- `public/data/universe.json`: derived read-only UI data.
- `app/manager.tsx`: interactive squad, profile, comparison, rankings and data review.
- `lib/types.ts`: typed UI contracts.
- `lib/sim/`: pure seeded simulation, season progression, selection and save validation.
- `lib/management/`: career player state, contract negotiations, recruitment, AI, concerns, migration and development.
- `data/verified-birthdates.json`: eight source-backed birth dates, independent of the immutable historical snapshot.
- `app/play/`: career setup, manager portal, live matches and season views.
- `app/api/career/`: authenticated R2 career snapshots with conditional writes.
- `data/reputation-priors.json`: sourced established-player priors.
- `data/generated/simulation-catalog.json`: minimal server-side validation catalog.
- `docs/`: complete brief, source audit, exact methodology and development log.

Names, squads and IDs are taken from the snapshot, not from memory. Missing age, eligibility, contracts, potential and current condition remain unknown. Historical fantasy points are never displayed as simulated match ratings. See `docs/rating-methodology.md` for formulas and current model limitations.

The 2026 historical snapshot remains reproducible and downloadable as SQLite. Careers are serialized JSON snapshots in the platform R2 `BUCKET`, keyed by a hash of the authenticated user's stable Site ID. Only server-supplied identity is used. Conditional writes detect conflicting tabs/devices; autosave runs during live play and on paused changes. JSON backup import/export is available. Storage errors preserve the current session and show recovery instructions. No cloud-storage availability is claimed until the updated Site is deployed with its binding.

The first campaign is a fictional 2027 season with healthy starting squads, using the 2026 draw shifted by 364 days. Repeated seasons retain champions, results, final tables and player season totals. The real-player population is retained while club membership, contracts and ability evolve. Annual development uses minutes, positional form, conservative potential, simulated injuries and verified age where available. Unknown ages remain neutral. Academies, newgens, retirement and representative rugby are deferred. See `docs/management-update.md` for the complete game rules and material limitations. Competition and medical rules are simplified and stated in Save & rules. Browser and hosted-storage end-to-end checks have not been performed; core logic and production compilation are tested.

### Update 0.4: inbox and future players

The career now includes actionable transfer threads, club/player counteroffers, reserved budgets and a 42-day offseason. The Development centre contains academy intakes, the Future Stars trial, U21 fixtures, senior promotions and retirement planning. Format-4 saves migrate older careers and preserve a pre-update snapshot. Read `docs/future-players-update.md` for rules and limitations; run `node scripts/test_future.ts` and `node scripts/test_market_edges.ts` for the new systems. Core modules live in `lib/market/` and `lib/future/`.
