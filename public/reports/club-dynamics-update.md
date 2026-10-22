# Club identity and dressing-room update

This update adds Club & dressing room to the management navigation. It uses existing playing-time concerns, contract negotiations, annual development and club history.

## Decisions and effects

- Every club receives a game-defined identity and league/youth target from squad depth, resources and reputation. These are simulation estimates, not claims about real boards.
- Before round one, the manager can commit once to standard, ambitious or cautious expectations. Ambition brings 5% of the annual allowance as extra cash in exchange for a harder league target and 25% more under-23 senior minutes. Cautious targets have no extra funding.
- Playing-time satisfaction responds gradually to starts compared with the contractual role. Injury periods do not create new dissatisfaction. Private development targets are not playing-time promises.
- Kept promises add six trust points; broken promises remove ten, once per promise. Unfinished five-match promises carry their starts and games into the next season while the player stays at the club.
- Five conversation topics use one shared four-round cooldown. Praise and challenges need three appearances, 160 minutes and a qualifying recent average. Development reviews need a plan; contract discussions need an expiry, listing or live negotiation. Conversations do not grant contracts or secretly promise minutes.
- Relationships alter renewal demands by a bounded multiplier of 0.94–1.12. Existing club reputation, wages, playing roles, competing offers and one move per transfer window remain active.
- Trust and fictional professionalism contribute at most ±0.2 to the annual development calculation through accumulated season exposure. All existing age, potential, injury and annual growth limits remain in place.
- Captain, vice-captain and up to three leaders gain influence from professionalism, trust, club appearances and tenure. Two healthy leaders with sufficient influence soften defeat by one morale point and help newcomers settle. No direct match-ability or chemistry bonus is added.
- End-of-season reviews compare the league finish and youth minutes with the commitment, allowing one or two places of injury context for a substantial first-choice injury burden. They record breakthroughs, productive signings, academy graduates, close results, upsets, try leaders and career-era appearance milestones when supported by the save. Reviews are advisory; this update does not introduce sackings.

## Careers and histories

Existing careers initialise the new systems without recalculating ratings, contracts or match outcomes. Midseason expectations are explicitly advisory. Leadership can be changed without changing tactical roles. Profiles show trust, satisfaction and attachment, and season memories are accessible on club pages.

Current and previous seasons retain full representative reports. Older representative matches retain scores, every participating player's statistics, injuries and up to 20 key moments; older phase-by-phase commentary is removed. Historical development explanations use a shared label dictionary and are displayed with their original reasons and values. Current club fixtures, active matches, season totals, transfers and eligibility records are preserved. Existing account-save revision and recovery protections remain unchanged.

A dismissible guide links directly to selection, development and club decisions.

## Validation

Automated checks cover migration, commitments, evidence gates, cooldowns, leadership ownership, promise outcomes and rollover, bounded renewal effects, season reviews, archive preservation and rendered controls. Existing coaching/pathway, selection and account-save checks are retained. The 20-season structural simulation (seed 75, 2027–2046) passed full and server-catalog validation, stable migration, positional depth, squad-size, wage-budget and single-transfer checks. Its final decoded save was 28.925 MiB (2.935 MiB compressed), below the unchanged 35 MiB account limit. This is evidence for the tested 20-season horizon, not an unlimited-career guarantee or final commercial balance approval. The R2-mocked account-save suite passed compressed writes, read-back verification, previous-save recovery, account isolation and stale-session protection.

Browser interaction testing was not requested for this update. NPC, expanded international management, portraits, medical-system redesign and commercial finance expansion remain future work.
