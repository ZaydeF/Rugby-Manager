# Career Pulse — implementation and release notes

## Shipped

- A manager's desk with fixture countdown/stakes, season expectations, five board confidence measures, contextual selection dilemmas, medical-clearance decisions, contract expiry count, player watchlist, standings and form leaders.
- Weekly briefings, monthly board reports, preseason/midseason/playoff/end-season checkpoints, qualification morale response, plus a season scrapbook and trophy presentation.
- Persistent shared career stories: debuts recorded within the save, appearance milestones, first recorded starts/tries, winning/losing runs, upsets, record margins, contract movements, birthdays, retirement stories and previous-season memories. Headlines use recorded simulation data.
- Round Centre for SR and NPC; results, table movements, player and young-player awards, positional Team of the Round, Player of the Month, Player of the Season and XV of the Season.
- Captain and vice-captain appointment/history, matchday fallback, modest leadership contribution in the match engine; seven bench plans used by the substitution engine.
- Four medical-return plans. Extra recovery blocks selection; bench return requires bench selection; 25/40 minute targets trigger legal substitutions even when routine assistant substitutions are disabled. Full return adds fatigue exposure. Limits cannot force an illegal substitution.
- Restore last 23, retain starters/refill gaps, copy bench, changed-starter count, fatigue flags and availability checks.
- Matchday contextual briefing alongside existing side-by-side 23s and Match Intelligence. Captain/kicker/bench plan, prior meeting, opponent notes/tendencies, selection checklist. Post-match evidence-based tactical findings and leading performance.
- Player Pulse, role/minutes/fitness/form/morale, comparison, watchlist, club/contract links, honours and career timeline; existing rich attributes and development are preserved.
- Club pages: identity, observed tactics, positional strength/depth, injuries and representative counts, records, head-to-head, form, trophies, historical finishes, finances for the managed club, notebook and save-era All-Time XV after 20 games.
- Competition hub: both competitions, current and archived seasons, fixtures, table, team statistics, expanded player metrics, last 3/5 appearance filters, position/U23 filters, awards and champions.
- Global player/club search, recent players/clubs, back navigation/scroll restoration, persistent device-local view preferences, inbox categories/search/read controls and important-unread badge. Tactics and statistic tabs persist.
- Shield successful-defence/tenure counter. Record chase alerts for club appearances, season tries and points.

## Save migration and storage

Career Pulse is an optional, validated `world.pulse` field on the existing version-6 save. Older saves gain a compact current-season match history from real retained results. Old awards are not invented. Existing players, rolled PA, contracts, memberships and in-progress matches retain their identities and simulation state.

New matches retain individual performance detail for the most recent three seasons. Older details roll into competition-season/player/club totals, preserving all-time club statistics, results, lineups, stories and awards. Last-three/last-five filters explicitly describe their retained-detail scope; full season totals remain available. Existing saves without earlier detailed evidence cannot retroactively reconstruct those details.

UI preferences (filters and recent views) are device-local; captains, watchlists, medical plans, notebooks and career history are saved with the career.

## Validation

- TypeScript compilation and production build.
- 34 targeted simulation, calendar, representative, release, youth and Career Pulse tests passed before final refinements. Final test counts recorded in the development log.
- Five-season SR and NPC career simulations: each reaches 2031, 800 matches; saves validate at checkpoints, migration round-trips match, story/match/award IDs are unique.
- Old-save migration, archived stats preservation, no duplicate archiving, captain validation, real medical-minute substitutions, medically rested exclusion and next-event match safety.
- Account-save readback, stale revision protection and deterministic match resume covered by existing regression tests.
- Browser checks: dashboard, global search, correctly positioned player modal, watchlist, captain/bench settings, persistent stats filters, next-event matchday stop, team preview, quick-sim penalty pause.

## Honest limits

- Anonymous preview cannot exercise authenticated cloud saving; server-side save tests cover storage round-trips and conflicts. No user production career is used or overwritten in testing.
- No defenders-beaten metric is invented: the engine does not yet record it. Line breaks, offloads, metres and tackling evidence are used instead.
- Match final scoring moment is labelled exactly that; it is not falsely asserted to be a causal turning point.
- Captaincy has a small match contribution, not a new personality/influence simulation. Board confidence does not sack the manager or introduce a job market.
- Birthdays are surfaced, but the established career-year age convention is preserved to avoid changing development balance in a presentation update.
