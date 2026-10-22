# Development log — Super Rugby Manager

## 2026-09-08 — Roadmap Phase 2: Rugby tactical engine 2.0

- Added detailed attacking, defensive, lineout, scrum, kicking and scoring plans, driven by on-field units and condition.
- Added a seven-play library, three-play arsenal, once-per-round familiarity and live queued calls.
- Added tactical execution logs, cross/box/contestable/territory kicks, receipt decisions, mauls, scrum penalties and separately recorded drop goals.
- Added a tabbed rugby workbench, saved plans, touchline decisions and tactical report counts.
- Preserved active legacy matches via engine marker. Twelve legacy replays matched exactly; 640 tactical scenarios and five career seasons passed structural checks.
- Height/aerial data remains incomplete: aerial strengths are provisional skill estimates; height-specific bonuses are deferred.
- Pack 1.2.0, engine 0.3.0. Full coverage, limits and evidence: reports/phase2-rugby-engine.md.


## 2026-09-08 — Roadmap Phase 1: player identity & scouting

- Installed all 428 supplied DOB records, accepted five flagged conflicts, and completed date coverage for 450 retained real players.
- Applied four active-roster exclusions with stable historical IDs and academy cover.
- Added saved scouting assignments, confidence, refresh/cancel, stale reports, profile links and inbox routing.
- Standard career surfaces use stars and attribute ranges; developer mode retains exact values.
- Preserved existing ratings, match coefficients, edited dates, historical development and active matches.
- Foundation, preparation, representative, squad/save and focused Phase 1 tests passed. Five-season structural run passed; year-five decoded save 11.91 MB.
- See reports/phase1-player-identity.md for scope and limitations. The prior twenty-season 35 MB save-cap issue remains open.


## 2026-09-05 — Phase 1

### Completed

- Inspected all seven CSV and two JSON files; recorded columns, missing cells, row counts and SHA-256 hashes.
- Preserved 454 real source IDs, 11 dynamically discovered franchises, 77 matches, 16 rounds, 3,499 match/round-score rows and each set of 7,192 price/ownership observations.
- Added relational SQLite schema, raw provenance, nullable future biographical/management fields and atomic reproducible import pipeline.
- Implemented eight role-sensitive attributes, conservative earliest-price prior, sample shrinkage, confidence tiers, unrounded current ability and traceable derivation.
- Reviewed all 80 positional leaders. Narrowed the prior globally after a low-minute artefact; retained remaining weak-evidence cases visibly.
- Created squad, player detail, comparison, all-position leaderboards, schema inspection, source audit and methodology screens.
- Added franchise switching, name/position filters, sortable tables, attribute/statistics views, actual match histories and CSV/SQLite/report downloads. The chosen franchise persists on the current browser.
- Used the provided Football Manager screenshots for information hierarchy and density. Original dark navy and muted mint interface; no invented real player portraits or crests.

### Validation

- Import enforces unique keys and all player, round, fixture, team, score and date joins.
- Player-by-player season action sums and fantasy totals reconcile; all 17 zero-minute appearances remain visible.
- Nine foundation tests cover IDs, nullable facts, evidence shrinkage, rank ordering, all 80 leaders, SQLite integrity, exact repeatability and duplicate rejection without database damage.
- Production build and TypeScript validation both pass. Browser testing was not requested and has not been performed.

### Decisions and known limitations

- Phase 1 only. This is a working data-and-ratings application, not yet a playable season simulation.
- SQLite is the canonical imported foundation; the app serves a generated read-only snapshot. It is not a cloud career-save backend. No gameplay writes are implemented.
- No source identity or squad is guessed. Contract/age/eligibility/PA/current state remain unknown.
- Set-piece productivity is an involvement proxy; goal kicking is limited to accuracy. Unverified `TC` is unused.
- Small samples, late price priors, no-appearance ratings, positional score compression and correlated features are disclosed in the methodology. The model is provisional pending rugby/game calibration.
- Live uploads are deferred; the current complete-snapshot importer runs from the source checkout.
- No confirmed runtime bugs after the completed code/build checks; interactive browser behaviour remains unverified.

### Deferred, in brief order

1. Match engine with several-thousand-match distribution checks against the historical data.
2. Valid matchday selection, tactics and substitutions (requires sub-position/lineup information or explicit configurable rules).
3. Calendar, schedule, standings, finals and career-save backend.
4. Dynamic form, fatigue, injury, morale, contracts and recruitment.
5. Development, newgens, academy trial and U21 pathway.
6. Verified representative eligibility, All Blacks selections and a three-match North/South series.
7. Portal, narratives, awards, records and multi-season progression.

## 2026-09-05 — Playable match and season update

Supersedes the Phase 1-only status above. Model `playable-0.2.0` introduces a shared league scale and seven sourced international-award priors. Will Jordan is 92; Fabian Holland is 88 with no 2026 appearance penalty. Attribute shape, source IDs and uncertainty are retained.

Added the causal seeded match engine, matchday 23, nine tactical controls, kickers, manual/AI substitutions, cards, live text and field display, pause/fast/instant controls, complete reports, calendar, AI rounds, bonus points, six-team finals, champion history and reusable future-season loop. Basic form, fatigue, morale and injuries affect match performance. Career snapshots use authenticated account ownership and conditional R2 writes, with backup import/export.

Validation: 4,000 final baseline matches, eight 500-match tactical/strength scenarios, 12 complete seasons covering all franchises, deterministic save/resume, substitutions, invalid saves, source foundations and storage-handler tests. See `simulation-validation.md` for measured results and explicit simplifications. Browser interaction and hosted storage are unverified. Recruitment, development, future players and representative rugby remain later phases.

## 2026-09-05 — Management and annual development

Approved Phase 5 plus a simplified annual progression/regression step. Added career-owned player ability and club membership, conservative potential ranges, eight verified birth dates, simulated contracts and finances, negotiation and confirmation, renewals/releases, positional squad planning, career profiles and records, role-based concerns and promises, AI renewals/recruitment, a six-week offseason window and once-per-season development.

Format-2 saves migrate without changing matches or results, and the first migrated cloud save preserves an account-owned pre-update checkpoint. Current and historical club membership are intentionally separate. Eight consecutive management seasons complete through 2034 with valid budgets, viable squads and 454 preserved player IDs; salary-floor and long-term cover defects discovered during testing were corrected. See `management-update.md` for exact rules, evidence, checks and limitations. Unknown ages remain unknown; generated potential and contract terms are labelled estimates. Browser and hosted-storage end-to-end checks have not been performed.

## Update 0.4 — Inbox negotiations and future players

Implemented the approved future-player phase and moved the actionable inbox forward. Transfer conversations now retain club and player replies, manager consent, counters, deadlines, patience, rival interest and final decisions. Live offers reserve payroll and fees. Added academy intakes, a full Future Stars trial, limited academy contracts, senior promotions, automated U21 fixtures and reports, annual youth development and age-supported retirement planning. Added four primary-source real birthdates (12 total); unknown real ages remain neutral.

The long-run check exposed U21 positional shortages after graduations and promotions. Added explicitly labelled, lower-rated local guest cover for empty matchday slots; this does not create an academy contract or spend the user's stipend budget. All 440 youth fixtures completed in the subsequent eight-season run. The same run reached the 2035 preseason with viable senior squads, 115 generated senior players and a roughly 13.7 MB save.

Format-4 migration preserves existing results, active matches and original-player state. A pre-update checkpoint is retained on first successful save. Contracts, deadline edge cases, competing bids, academy-place limits, storage ownership/conflicts, Worker-catalog validation and the established simulation checks pass. Type and production-build checks are run before publication; browser QA is outside the requested scope.

Rules and limitations: `docs/future-players-update.md`. Representative rugby remains the next original-brief phase.

## Career Pulse — 18 September 2026

Added the shared career story/match/award ledger and integrated it through the dashboard, competition hub, club pages, inbox and profiles. Added leadership and return-to-play decisions, bench plans and lineup continuity. Kept canonical ratings and hidden potential unchanged. Saved schema additions are optional and validated, with explicit legacy reconstruction and archive compaction. See `docs/career-pulse-update.md` for detailed scope/limitations and `docs/career-pulse-validation.json` for multi-season evidence.

Fixed during validation: chronological next-fixture selection in briefings; needless preseason next-event stop; captain contribution being overwritten by initial match variance; save growth from retaining redundant older per-match statistics. Browser confirmed profiles remain visible at the top and filters persist between tabs.

Final verification: 23 targeted tests passed on the final source, covering Career Pulse, canonical saves/migrations/account storage, match intelligence/penalty decisions and daily calendar safety. TypeScript completed without errors. Five-season SR and NPC validation retained 800 matches per career; archived-detail compaction reduced each save to approximately 16 MB, below the existing 35 MB storage limit. Anonymous preview testing did not modify the production account save.

## 2026-09-20 — Matchday 3.0
Implemented continuous match presentation, persistent decision stops, configurable bench splits, shared positional execution rules, two-way substitution and field swaps, team kit icons/colours and a compact focus view. Preserved career schema version 6 with optional validated fields. Fixed a U21 guest-selection regression exposed by widened cover: automatic selection now reserves natural specialists; users can deliberately choose emergency cover. 28 targeted tests pass and TypeScript passes. See docs/matchday-3-update.md for scope and explicit simulation/data limits.
Browser verification: changed to a 6–2 bench without disturbing the XV; started a live match; clock and ratings advanced; opened focus view; selected reserve then starter and confirmed a substitution; jersey 16 remained visible in the hooker slot; play paused for a Highlanders penalty; choosing posts removed the decision prompt and resumed playback. Fixed focus-view grid compression discovered in QA. Production build and final type check succeeded. Preview is anonymous, so its expected sign-in save warning does not validate production authentication.
