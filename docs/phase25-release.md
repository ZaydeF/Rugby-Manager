# Phase 2.5 — selection and tactical execution

Implemented against the approved research plan using the existing eight attributes. No real-player CA/PA, biography or eligibility changes.

- Pitch selection for the starting XV and eight bench places; atomic position-valid swaps, drag/drop, tap/keyboard placement, one-step undo, squad filtering, player drawers and profile links.
- Shared graphical current/potential stars. Senior-squad benchmark is frozen for a season, refreshed at rollover, excludes generated players while real senior players remain, and never changes underlying ability.
- One canonical tactical mapping, five starting identities, tempo/risk, six compatible slot jobs and positional defaults. Two saved plans preserve personnel selection. Existing strike preparation and advanced set-piece options retained.
- New matches carry `tacticalVersion: 25`. Attribute-specific carrier duels, support security/availability tradeoffs, short-lived possession quality and defensive disruption, kicking assignments and situational receiver involvement affect execution. Older active matches retain their original arithmetic and random path.
- Identity-specific indicators, observed-match briefing, bounded advice/cooldown, before/after change counts, recent executions and save-match-plan action. Existing substitute freshness/role coverage, minutes targets, and assistant controls retained.
- Engine release 0.3.1; existing foundation versions remain accepted. Old tactics mapping is explained on migration; new star context is explained at rollover.

## Validation

- TypeScript and production build pass.
- Existing rugby suite: 640 scenario matches, set-piece and familiarity checks, live calls and deterministic resumed saves.
- Phase 2.5 suite: 200 controlled equal-CA matches, selection validation, support tradeoffs, star stability and save/migration checks. Stronger carrying attributes produced higher metres and quick-ball rates.
- Exact legacy continuation: 12 Phase 1 matches and 8 Phase 2 matches.
- Three full career seasons including representative matches, academy/development, contracts, eligibility, squad depth and save validation. Final decoded save 11.46 MiB, compressed 1.45 MiB. This does not resolve the previously known very-long-career storage limit.
- No browser interaction testing performed. Touch/keyboard alternatives are implemented; device usability still benefits from user playtesting.

## Boundaries

Selection pitch and phase diagram are schematic, not player tracking. Aerial and specialist rugby attributes still use existing proxies. Presets show the matching attacking identity; detailed settings may be customised. Side-by-side positional comparison shows job fit, relevant attribute assessments, freshness and minutes targets. No new staff systems, full spatial engine, expanded database or flexible bench splits. No additional unbounded match-history storage.
