# Career World development log

Status: release candidate prepared for publication.

## Inspection
Existing v17 systems: one-team CareerPlayer contract ownership; canonical historical fantasy catalog; R2 revision/ETag saves with previous-snapshot recovery; 23-player atomic selection; Phase 2.5 match/tactics/substitution engine; coaching and head of youth; development; market negotiations/inbox; dressing-room dynamics; compact historical archives. Existing single-competition validation assumes 11 teams, 77 league fixtures, and North/South representative stages. No playable NPC or shared registrations existed.

## Foundation
- Supplied v0.7.5 SQLite database is authoritative. CSV membership exports are older/incomplete.
- Reproducible read-only importer retains 812 canonical IDs, locked CA/PA and signature overrides. Original SQLite retained, with SHA256 in generated catalog.
- 1,070 deduplicated active registrations across 11 SR teams and 14 NPC unions. No duplicated entities for multi-competition players.
- Import audit records missing dates, unknown positions and conflicting affiliations. Unresolved real players are not assigned invented positions. Tevita Latu's equally ranked conflicting NPC affiliations are withheld; Isaiah Malaulau uses explicit CURRENT_TEAM_PROFILE evidence.
- Exact-name/explicit-alias legacy identity mapping; typed match references remapped. Deprecated legacy history retained separately. Old North/South interface is not mounted in the new career route.

## Implementation
- World version 1 / save version 6 adds competition registrations, shared skills, rolled PA, development traits, competition ledgers, representative duty/squads, reviews, interest and generated club-depth players.
- Existing match engine and Selection25/RugbyWorkbench reused. Rich event skills added without altering arithmetic for legacy matches lacking rich attributes.
- Two career choices; primary competition is controlled by user while background competition is AI-operated.
- NPC: 70 league matches, 10 unique opponents, 5 home/5 away, two pools and crossovers, top-eight finals.
- Shared SR → international → NPC → offseason loop. Clubs replenish missing positional cover with explicitly fictional depth players.
- Development acts on position-specific attributes and persists one hidden PA roll. Position/age, minutes, challenge, form, coaching, injury and restrained hidden traits affect growth.
- All Blacks watch, positional announcement, new selections/recalls/omissions and history; explicitly evidenced national eligibility. Unknown franchise affiliation never grants eligibility.
- Existing R2 save concurrency protection retained. Separate world validation branch; manual verification and downloadable backups retained.

## Validation / bugs
- Initial two-year SR and NPC runs passed full world save validation at every step; four competition reviews and twelve national squad records in each run.
- NPC draws checked across ten seeds: unique opponents and exact home/away balance.
- Fixed negative-zero development deltas for exact JSON round trips.
- Initial ten-seed, ten-year prospect test revealed under-development (well-used elite prospects peaked too low). Growth model being recalibrated before release.
- Browser testing uses isolated preview; no production career modified.

## Outstanding release gates
Complete migration tests including generated players and active matches; validate integrated market/coaching UI; several-thousand-match calibration; multi-seed development distributions; browser selection/profile/save flows; full build; source commit and publish. Broader global rugby and detailed contracts remain outside this update's scope.

## Release validation
- 3,000 completed matches: mean combined score 62.94, margin 15.19, 8.48 tries, 16.74 penalties, 0.88 cards, 974 metres, 289 tackles and 10.12 turnovers. Home win rate 51.3%. These are game calibration outputs, not claimed real-world statistical validation.
- 1,440 synthetic player careers, 12 seeds, 10 years. Exposure scenarios vary minutes, performance and repeated injury. 703 finished within one point of their ceiling at some point; 150 missed it by five or more. Includes players initially close to PA; not a claim about elite-prospect success rates.
- Two complete years for SR and NPC careers: all intermediate states validated; full JSON persistence of PA, attributes, ledgers, registrations and national history.
- Legacy migration preserves 363 generated players and an active match. Snapshot/readback/conflict protection tested through the actual save handler with an in-memory R2 test double. Persistent before-world-v6 recovery snapshot added.
- Five domain/save tests and two rendered UI tests cover new careers, all 25 teams' valid 23s, eligibility, signature attributes, deterministic match resume, migration, R2 revisions, and both competition interfaces. Thirteen existing selection/dynamics regression tests passed.
- Production build succeeds. Interactive browser QA could not complete: the isolated browser blocks the preview virtual application module with ERR_BLOCKED_BY_CLIENT. No production data was modified for QA.

## Intentional limits and deferred work
- Explicit nationality/pathway evidence covers only part of the real database. Unverified players cannot enter Test selection; membership never grants eligibility. 94 missing DOB values retain supplied numeric ages where available; 19 unresolved playing positions are unavailable rather than invented.
- International appearances are simplified consequences, not a full international fixture engine. Exact historical Test caps are not reconstructed; displayed caps are simulated within this career.
- NPC scouting-interest hooks and existing negotiations are connected. Detailed dual-contract rules, loans and a full global recruitment market remain outside scope.
- NPC academy arrivals and senior opportunities are implemented. A separate full NPC U21/B-team competition and school-origin presentation are deferred; source school tables are retained in the supplied SQLite database.
- Old North/South code remains only for compatibility with legacy validation/archives; it is not mounted in active career navigation or used by the new world engine.
- More advanced club objectives, exhaustive all-time XV presentation and interactive browser regression need a follow-up. Existing dressing-room features require fuller world integration; the core contracts/coaching controls remain accessible.


## Player profile hotfix
- Fixed legacy relative positioning overriding the portalled profile dialog: profiles now stay centred in the viewport with bounded scrolling on mobile and desktop.
- Removed the announcement inset reset that also cancelled modal centring.
- Added profile text styling outside the career root because dialogs render under the document body. No career data or migrations changed.

## Profile centring correction
- Tailwind 4 uses the independent translate property; the prior transform correction composed with it and shifted profiles twice. Explicitly reset translate and use one transform, disabling entrance/exit transforms on these dialogs.

## Connected U21 pathway release
- Added automatic development fixtures alongside regular SR/NPC rounds using the existing rugby match engine and compact YouthReport. No extra canonical players are created for positional guests.
- Added per-player Balanced, Priority minutes, Senior only and Rest instructions, exposure and senior-readiness comparison in NPC Watch/Development. Plans persist in optional world.youth; older v6 saves need no destructive migration.
- Exclude players with senior appearances that week, injuries, international duty, high fatigue, unknown age or age 21+. Shared condition carries development-match injuries and workload.
- Persist competition-specific U21 ledgers across years; reset compact fixture detail on rollover.
- Weight U21 exposure at 0.60 competition quality, adjust for appropriate challenge, include form and injuries, and apply within existing SR/NPC development checkpoints rather than adding an extra annual growth/decline pass.
- Validation: five existing canonical/migration/save checks; three new youth determinism, eligibility, rest, no-double-appearance and development weighting checks; two component-render checks; TypeScript and production build.
- Limits: simplified development fixtures, not a standalone B-team championship. Match-only guests are labelled and not recruitable. No browser interaction test performed. School origins and full club objectives remain deferred.

## Career cohesion / daily calendar release
- Restored checkout after workspace maintenance; continued from published v21 source.
- Rebuilt Home as connected dashboard and added two-squad matchday preview. Added two-competition stats, ranking controls and current-year scoring/club appearance reconstruction.
- Added optional world.date; daily/next-event controls never auto-play a user's due fixture. Existing v6 careers initialise their date from the current competition round. Annual market now advances one day per action.
- Fixed direct NPC-to-SR signing rules and UI gating; preserves NPC affiliation, forces zero fee and bypasses provincial cover veto. Contextual NPC salary demands and shared contract-end calculation. AI signing cadence/caps and one move per year. Removed old world-incompatible offseason actions.
- Added supplied weighted school/feeder data to annual NPC intake, persisted school/home union fields. No real player biography was changed.
- Increased youth growth response to headroom and meaningful minutes, while retaining hidden ceilings, challenge/quality, injury and age effects.
- New optional fields remain compatible with older v6 saves. Historical fields only reconstructed where original match evidence exists; never invented for archived years.
- Full scope, validation and next-release plan: docs/career-cohesion-v2.md.

## Provincial pathways v2 / representative availability
- Replaced round-count duty with dated campaigns and explicit limited provincial releases; added separate November All Blacks XV and dated Test/Tour/XV appearances.
- Added Shield home challenges, provincial retainer offers/replies/expiry, six-candidate/four-place school assessments and bounded AI youth opportunities.
- Fixed depleted positional-cover failure found during long careers; recovery now follows calendar days, and November representative exposure is included at annual development.
- Additive save migrations preserve baseline skills, hidden PA and old caps. See world-pathways-v2.md for exact simplified rules and deferred scope.
- Validation: 19 focused tests, TypeScript and production build passed. Two seeds × five complete seasons, 3,112 daily advances, 126 explicitly simulated user fixtures, 584 tracked young-player careers. Save/reload at every rollover; zero hidden-ceiling violations. Full results: world-pathways-v2-validation.json.
- Five-year Pledger outcomes in the two AI-opportunity samples: 82.9 and 76.2, with 2,781 and 1,899 senior/representative minutes respectively. This is a limited sample; long-term international promotion and coaching balance still warrant broader future tuning.

## Squad clarity and career rewards
- Fixed immediate releases and repaired explicit historical release ghosts; unified single/bulk main and provincial contract actions.
- Stable CA-based ability stars; uncertain potential remains separate.
- Added persistent, replayable All Blacks XV announcement snapshots and linked player/season development reporting.
- Added actionable offseason squad planning, provincial assistant renewals and season reward summaries.
- 27 targeted tests passed. TypeScript and production build gates applied. Details: squad-clarity-update.md.

## 2026-09-14 — Match Intelligence 2.0

Added evidence-led matchday reports, live diagnosis, enabled personnel-based opponent plans and observable adjustments, full-time periods/intervention reports, and bounded cross-season opponent memory. User penalty control supports delegated/key/all decisions in watched and quick-sim matches, persisted pending decisions and one-off posts/touch/scrum/tap choices. Fixed the world match screen halftime reset. New matches avoid duplicated contest modifiers; pre-update active matches retain their arithmetic. Save extensions are optional, versioned and validated. See match-intelligence-update.md and match-intelligence-calibration.json for scope, tests, calibration and limitations.
