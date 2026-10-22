# Super Rugby Manager — Inbox, Transfers and Future Players

This update adds the original brief's future-player phase and brings forward the actionable manager inbox. Career format 4 preserves existing senior results, developed abilities, history and active matches.

## Where to start

Open **Inbox** to read offers, negotiate and advance to the next reply. Open **Squad & market → Recruitment** to approach a player or add them to your shortlist. Open **Development** for your academy, Future Stars trial, U21 league and retirement planning.

### Offers and negotiations

Every bid for one of your players goes to your inbox. Listing a player invites interest; it never authorises an automatic sale. You can accept, reject, counter, withdraw or request two extra days once. Accepting a transfer fee still leaves the player to agree personal terms and decide whether to join.

A contracted signing follows three stages:

1. The clubs negotiate a transfer fee.
2. The buying club and player negotiate salary, term and playing role.
3. The buyer confirms its final offer and the player decides, normally within two recruitment days.

Free agents, your academy promotions and your own renewals begin at personal terms. Conversations preserve previous messages and offers. An unfinished contract discussion from an older format is closed during migration and can be reopened through Recruitment.

Clubs assess cost, positional cover, transfer listing, contract expiry and the cost of replacement. AI buyers reserve funds for live offers, pursue alternatives after failed approaches and may bid for unlisted players. Essential positional cover and the senior squad limit remain protected.

Players consider salary, promised role, contract security, team results, familiarity with their present club and rival interest. One step below the expected role increases the requested salary; a much smaller role can be rejected outright. Repeated unsuccessful counteroffers reduce patience. New discussions after a breakdown require a three-day cooling period.

Salary expectations retain the ability-based model and modest form adjustment, then apply bounded modifiers for the factors above. Longer security can reduce the need for a salary premium. The player decision compares the value of final offers; a rival can win, and one completed signing cancels the other active conversations about that player. No free-text AI model or external service is needed for these decisions.

Both payroll and fee reservations are shown before a new approach. Completion rechecks budgets, ownership, squad size, cover and manager consent. A completed signing cannot execute twice. Announced retirees do not consider a move to a new club.

### Window and inbox rhythm

The offseason has 42 recruitment days across six weeks. **Continue to next update** advances at most a week and stops at a reply, an urgent decision or a week boundary. It pauses once for an urgent offer; continuing again without responding may let that offer expire. Reply deadlines cannot extend beyond the window closing date.

Senior-round completion also advances ongoing contract discussions. In-season discussions can be advanced separately in the inbox. Between-franchise moves remain limited to the offseason; renewals and free-agent discussions are available during the season.

Shortlisted players trigger rival-approach and signing updates. The final week brings a reminder, and the closing day brings a league transfer roundup. Starting the next campaign early closes unfinished offers. There is no automatic acceptance of ignored bids.

Playing-time concerns appear as actionable inbox items using the existing modest morale and tracked-promise system. Academy, development and retirement announcements also arrive in the inbox.

## Academies and fictional players

Every club receives an initial squad of 33 fictional development players, aged 17–19. This makes the U21 competition playable immediately, including in migrated careers. When loading a career partway through a season, the new fictional U21 league catches up to the completed senior rounds without changing senior results or real-player conditions. They are separate from the 454 original real-player records.

After each senior season, each franchise receives 24 trial candidates. Intakes vary, with occasional weaker or stronger classes and rare high ceilings. Generated players have stable IDs, fictional names, explicit simulated birthdates, attributes, potential, development traits and fictional nationality/region fields. Those fictional fields do not assign eligibility to real players; representative rugby remains a later phase.

Before contracts are decided, the user can run a full Future Stars trial. The 24 candidates are joined by academy guests to form two legal matchday 23s. The trial uses the rugby match engine and reports player minutes, ratings, tries, tackles, metres, turnovers and lineouts. It does not change permanent ability or reveal true potential.

Unsigned prospects initially show ability and potential ranges. The trial narrows uncertainty while retaining a persistent scouting error. A single great game is evidence to consider, not proof of an international ceiling.

Offer up to 12 academy places per annual intake. The academy has a separate, simplified $400,000 stipend budget: $10,000 per player and a maximum of 40 places. Graduating players free places before intake decisions. Promoting or releasing a signed prospect does not reset the annual 12-place limit. Finalising the intake closes the unsigned candidates' participation; their identities remain in the intake record.

Academy members have development contracts through their graduation year. At U21 graduation they can seek a senior contract. A senior promotion uses the inbox's personal-terms and player-decision flow and must fit the senior payroll and squad limits. AI clubs also promote suitable prospects and recruit for their youth positions.

### U21 Development League

The league has 11 rounds, 55 matches and one bye per club. It runs automatically alongside the first 11 senior rounds. Results use four points for a win and two for a draw, with points difference breaking ties. Current-season reports and player statistics are available; champions, tables and leading performers persist across seasons.

Eligible players are generated academy members under 21 at the season review date, plus contracted senior newgens under 21 who did not appear in the corresponding senior round. Real players with unknown ages are not assumed to qualify. No player appears in both competitions in the same round.

When graduation, promotion or injury leaves an empty positional slot, a lower-rated fictional local guest can fill that U21 matchday place. These appearances are labelled **(guest)** in reports. Guests receive no academy or senior contract, do not spend your stipend budget, and leave the guest programme after the season. This keeps fixtures playable without silently making academy signings for the manager. Registered prospects remain better development investments.

Youth matches use the senior match engine, including positional selection, injuries and fatigue. Their compact reports store player statistics and key events rather than every engine event, to control save size. Trial matches are exhibitions and do not add injury or fatigue to the season.

### Annual development and retirement

Development still happens once per offseason. U21 exposure contributes at 65% of senior minutes; the player's combined performance and injury history feed the existing annual model. A generated development trait adds a small modifier. Focus directs attribute changes. The existing potential ceiling and annual −4/+3 ability bounds remain in place.

Known age guides retirement planning: the simplified retirement threshold is 39 for props, hookers and locks, and 37 for other positions. Low-rated generated free agents can also leave the professional pathway after age 25. Players with unverified real ages are not given invented birthdays or age-based retirement dates. A retiring player can stay for one final continuity season when necessary to protect the next season's positional cover.

Verified real birthdate coverage has expanded from eight to twelve. The four added records are Ollie Norris, Brodie McAlister, Du'Plessis Kirifi and Timoci Tavatavanawai, from the primary [New Zealand Rugby squad announcement and player profiles](https://www.allblacks.com/news/all-blacks/all-blacks-squad-named-to-face-france). Existing eight sources remain listed in the management update and linked from player profiles. The other 442 real players retain a neutral age term. All generated players have known fictional ages. Incomplete real biographical coverage remains a limitation for long saves.

## Saves and checks

Older careers upgrade on load without changing recorded senior results, active match randomness or existing real-player conditions and abilities. A pre-update snapshot is retained on the first successful format-4 save and can be downloaded through Save & rules. In-progress older offseasons receive their intake and at least two weeks to use the new window. Ownership and stale-session conflict protection remain unchanged.

Checks cover:

- Legal senior selections, seeded match replay, substitutions, complete campaigns and finals.
- User consent for incoming transfers, expiry without a sale, staged club/player negotiations and competing offers producing exactly one signing.
- Budget reservations, duplicate approaches, cooling periods, deadlines and limited stalling.
- Deterministic replies after save/reload, annual intake limits and promotion without bypassing those limits.
- Existing-career migration, format validation against both the complete database and the Worker’s compact catalog, and authenticated storage with a mocked R2 adapter.
- Eight consecutive management campaigns, through the 2034 offseason into 2035, with senior squads and budgets remaining viable, generated senior players emerging and all 440 U21 fixtures played.

The recorded eight-season run had 115 generated players under senior contracts by its last offseason, and its save was about 13.7 MB, below the current 35 MB import/storage limit. This is a tested horizon, not a claim of unlimited storage or complete real-life retirement modelling. Browser interaction testing was not performed.

Reproduce with `node scripts/test_future.ts`, `node scripts/test_market_edges.ts`, `node scripts/test_management.ts`, `node scripts/test_career_storage.ts` and `node scripts/test_simulation.ts`. Machine-readable career results are in `data/generated/future-validation.json`.

All Blacks selection, the North–South series, representative histories and deeper staff systems remain subsequent phases.
