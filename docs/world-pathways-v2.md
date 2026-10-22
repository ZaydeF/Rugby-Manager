# Provincial pathways v2 — release notes

## Implemented

- Replaced random four-to-seven-round national duty with persisted date ranges. The full NZ squad remains with the national campaign from July through 23 November. At most three lightly used, fit players can receive an explicit 14–28 September provincial release; they rejoin national duty afterwards. Availability, squad lists and the representative hub explain dates.
- Separate All Blacks XV selection on 26 October, based on ability, NPC form and positional balance. Explicit NZ eligibility; current senior squad excluded. Camp ends 16 November, following three simplified November fixtures. NPC final precedes camp in this game calendar.
- Representative appearances now accrue on dated fixtures, with starts, replacement minutes, ratings and match records. Test, non-Test tour and XV ledgers are separate. Selection alone awards no cap. Existing real Test evidence prevents an established international being presented as a debutant. Career totals are simulated save totals; unknown historical Test totals are not invented.
- New calendar displays representative events. NPC managers can open the representative hub too. Daily recovery now continues during the gap between club competitions instead of relying on phantom four-week recovery at national selection.
- Ranfurly Shield holder, challenge labels, match outcome transfer and persistent history. Regular-season NPC home fixtures only; a draw retains; playoffs excluded. Seed holder is Otago for the January 2026 world. Existing saves replay retained current-season NPC results; lost earlier Shield history is not fabricated.
- Provincial retention agreements are separate from SR employment. NPC managers can offer a retainer, receive a counteroffer/reply, confirm retention and preserve the provincial registration. Retainers count once in NPC wage commitments. SR expiry can return a player to a still-live provincial agreement. Provincial expiry does not cancel a franchise contract.
- NPC managers receive six school-leaver candidates at next annual intake and select four places. Persistent staff trial assessments use the head of youth's judgement, supplied school origins and position skills; hidden rolled PA is never revealed. Staff can recommend four; a June deadline completes unattended intakes. Other unions sign four automatically. This is an assessment, not a simulated school league or interactive trial match.
- AI development opportunities: bounded bench preference for prospects close to established ability, occasional NPC starts, no developmental rotation in playoffs, replacement development priorities. AI uses the database/scouting estimate, never hidden save PA. User selection controls remain intact.
- Representative exposure contributes to development. NPC end-of-year development now occurs at rollover, after November appearances, so XV minutes count. No extra age-decline checkpoint or PA reroll. Depleted cover is replenished before assistant selection to prevent late-career missing-prop blockers.

## Compatibility

Optional additive world fields: representative, shield, provincialContracts, provincialOffers, schoolTrials. Existing canonical IDs, player skills, rolled PA, registrations, fixture results, save revision handling and Test cap totals are retained. Old synthetic cap awards are not removed, and past international fixtures are marked historical rather than replayed. New dated records begin from migration onward. Tests operate on isolated saves; no production career is replaced.

## Research and modelling boundaries

- [NZR 2026 South Africa tour squad and itinerary](https://www.allblacks.com/news/all-blacks/all-blacks-squad-named-for-rugby-s-greatest-rivalry-tour): club tour matches are distinguished from Tests. NZ dates used for August–September.
- [NZR 2025 All Blacks XV squad](https://www.allblacks.com/news/all-blacks-xv-2025-squad-announced): November development tour provides the timing model, not an assertion of official 2026 XV fixtures.
- [NZR temporary release to All Blacks XV](https://www.allblacks.com/news/reece-and-jacobson-join-all-blacks-xv-to-play-england-a): supports explicit release rather than automatic squad-wide provincial returns.
- [Provincial Rugby Shield overview](https://www.provincial.rugby/npc/ranfurly-shield): home challenge concept. Seed reflects the beginning of the game world, not today's real-world holder.

Full July–November NZ retention, the limited September release policy, generic July opponents, other nations' calendars and future repeat schedules are deliberate game simplifications. Representative matches use simplified performance/appearance records, not the full interactive club match engine. Full international management, official future global calendars, non-NPC preseason Shield challenges, cross-union bidding for an SR player's affiliation and an interactive school trial match remain outside this release.

## Verification

19 focused save, migration, engine, UI-render and pathway tests passed; TypeScript and production build passed. Multi-season results are recorded in `world-pathways-v2-validation.json` using actual AI selections and simulated minutes across two seeds, five seasons each. Includes save/reload at each rollover and hidden-ceiling checks. This is a small balancing sample, not a prediction of individual careers. No browser QA was requested or performed.

Completed long-run check: 3,112 daily advances and 126 user fixtures across ten total seasons. Tracked 584 young-player trajectories; mean peak gain 3.31 CA, 126 within one point of their ceiling, zero above it. Pledger reached 82.9 and 76.2 in the two five-year samples (2,781 and 1,899 senior minutes). These outcomes include AI opportunity differences and contract expiry; they are not forced showcase careers.
