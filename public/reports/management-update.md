# Super Rugby Manager — Management and offseason development

Update 0.3. Career save format 3. The historical rating model stays `playable-0.2.0`; the career now maintains its own squads, contracts, attributes and developed ability.

## How to play

Open **Squad & market** for Career squad, Squad planner, Recruitment, Player management and Offseason review. Select a player's name for their career profile, recent form, contract, injury status, estimated potential, development focus and annual development history.

- Renew contracts during the season. Sign uncontracted free agents when needed. Moves between franchises open after the season.
- Submit salary, role and duration terms, review the response and confirm an agreed offer. A player may request more money or a larger role. Budgets and roster depth can block a deal.
- Release players with displayed compensation, provided enough squad cover remains. Transfer listing authorizes AI clubs to recruit that player at the game's quoted release fee during the offseason.
- After the final, choose **Offseason review**. The annual development calculation runs once, and AI clubs review their contracts. Review your changed players, renew expiring contracts, and recruit.
- Advance recruitment weeks to let AI clubs act and players recover. At least one week must pass before the next season; six are available. Expiring contracts end when the next campaign begins. The game blocks progression if the retained squad lacks required cover.

## Career data and save compatibility

The 2026 source remains immutable. Current club and ability are stored independently for every real player ID. New matches use those career values; completed match reports retain the original participants, clubs and statistics.

A format-2 career upgrades automatically after loading or importing. The migration adds contracts, finances, potential and management state without rewriting fixtures, results, conditions, active-match events or its random state. The first successful cloud save after migration retains the previous format-2 snapshot as a separate, account-owned pre-update backup, accessible under Save & rules. A later save does not overwrite that checkpoint. Ordinary career backup export remains available.

The same authenticated R2 storage and revision checks protect current saves. Storage-handler tests use a mocked R2 adapter; deployed browser interaction and hosted persistence have not been end-to-end tested for this update.

## Contracts and club finances

All starting contracts, salaries, roles, budgets and potential are **game-generated estimates**, not assertions about real rugby contracts. Monetary figures use an NZD-style game economy. This does not reproduce national-union top-ups, salary caps or global transfer regulations.

Starting contracts end between the current year and two years later. Annual salary is derived from ability and squad role, with a $45,000 floor. The base formula is `45,000 + 210 × max(0, CA − 50)^2`, multiplied by role factors of 1.15 / 1.08 / 1.00 / 0.90 / 0.80 for Star / Important / Regular / Rotation / Development. Salary demands also incorporate a small, capped form adjustment. Salaries round to $1,000.

Initial payroll capacity is 120% of starting payroll, with a $7m minimum. Transfer funds begin at $1.8m and receive a further $1.8m each season. Payroll capacity grows 2% per season; both funds and capacity are bounded at $100m for save stability. Release fees and compensation use separate transfer funds; salaries consume annual payroll capacity.

The release fee for another franchise's contracted player is 40% of annual salary per remaining contract year, rounded to $1,000. Free agents and offseason expiries have no transfer fee. Early release compensation is 25% of remaining modeled salary. These are deliberately simple game rules.

Own-player renewals update terms through at least the currently contracted end year. The discussion shows the actual proposed end year before confirmation. Agreed offers are checked again when confirmed so a changed budget or squad cannot complete stale terms. Completed signings invalidate competing outstanding offers for that player.

## AI and squad viability

AI clubs review expiring players, keep necessary cover, release a limited number of redundant players, and recruit according to positional need, ability, estimated headroom and cost. They do not buy additional players indefinitely in an already-covered role. A one-year continuity option at existing affordable terms preserves necessary AI cover if a renewal cannot otherwise be funded.

Required retained squad cover is six props, three hookers, four locks, five loose forwards, three scrum-halves, three fly-halves, three centres and five outside backs. These are conservative **squad-depth floors**, not matchday jersey counts. Clubs may have up to 46 contracted players.

The two lock/back-row bench slots permit the already modeled emergency interchange, while assistant selection prefers the natural role. An actual off-position substitution carries the existing 10% match-ability penalty. Primary historical positions are not rewritten. Front-row and halfback roles stay distinct.

## Annual progression and regression

Each player receives one development entry per completed season, containing before/after ability, verified age or unknown, minutes, mean match rating, injury burden and numerical influences. Re-entering the review cannot apply the changes again.

The model is intentionally simple, conservative and configurable. The estimated annual change combines:

1. **Age and position:** under 23 adds 0.8; ages 23–25 add 0.35; the prime-age effect is neutral. Decline begins at 32 for props, hookers and locks, and 30 for other roles, increasing by 0.45 per year to a maximum 2.8-point age penalty. Unverified ages contribute zero.
2. **Playing time:** `0.6 × min(minutes / 700, 1) − 0.35`.
3. **Season form:** the player's season mean rating relative to qualifying peers in the same position, shrunk by `minutes / (minutes + 500)` and bounded to ±0.7. This avoids rewarding every back over every forward merely because their match-rating opportunities differ.
4. **Potential headroom:** bounded growth opportunity based on the difference between estimated potential and current ability, multiplied by playing-time exposure, with a gentle reduction as the career advances.
5. **Injury burden:** −0.075 per estimated injury week accumulated in recorded simulated matches, bounded to −1.1. This is a gameplay burden proxy, not a medical forecast or exact count of days missed.
6. **Morale:** `(morale − 70) × 0.005`, bounded to ±0.15.
7. **Individual variation:** deterministic, seed-based variation within ±0.15.

The combined change is bounded to **−4 / +3 ability points per season**, a 40 minimum and a 97 maximum, and cannot exceed the player's potential ceiling. Rounding can introduce tiny differences in displayed arithmetic. Known older players' potential ceiling also declines with their age effect, while remaining at least their current ability.

Development focus distributes the change among assessed attributes: Attack, Defence, Skills, Kicking, Set piece, Physical or Balanced. Focused attributes receive more of a gain or less of a decline; the position-weighted mean is then aligned with the target overall ability. A focus does not turn unassessed goal kicking or set-piece data into invented measured skills. Attributes remain nullable where unsupported.

Potential is internal game state, displayed as an uncertain range and a scouting tier. Unknown-age players initially receive only 2–6 points of estimated headroom. Verified younger players can receive more; established older players receive little. These are not empirical forecasts of real players' ceilings.

## Verified ages and limitations

Eight birth dates were matched to the supplied player IDs from official club or national-union sources:

| Player | Birth date | Source |
|---|---|---|
| Will Jordan | 24 February 1998 | [New Zealand Rugby](https://stats.allblacks.com/all-players/profile/Will-Jordan-AB-1191) |
| Fabian Holland | 9 October 2002 | [New Zealand Rugby](https://www.allblacks.com/news/all-blacks/all-blacks-squad-named-to-face-france) |
| James Slipper | 6 June 1989 | [Rugby Australia](https://wallabies.rugby/news/james-slipper-announces-retirement-from-test-rugby-2025101) |
| Beauden Barrett | 27 May 1991 | [Blues](https://www.blues.rugby/beauden-barrett-player-profile) |
| Wallace Sititi | 7 September 2002 | [New Zealand Rugby](https://stats.allblacks.com/all-players/profile/Wallace-Sititi-AB-1218) |
| Damian McKenzie | 20 April 1995 | [Chiefs](https://chiefs.co.nz/player/damian-mckenzie/) |
| Cam Roigard | 16 November 2000 | [Hurricanes](https://www.hurricanes.co.nz/squad/player/cam-roigard) |
| Scott Barrett | 20 November 1993 | [New Zealand Rugby](https://stats.allblacks.com/all-players/profile/Scott-Barrett-AB-1155) |

Age is evaluated on 1 July of the simulated season year. The other 446 players retain unknown ages and a neutral age term; they can still progress or regress through form, minutes, injuries, morale and potential. This incomplete biographical coverage is a material limitation of long-term realism, rather than a reason to invent real ages. Retirement and generated replacement populations remain future work alongside academies.

## Morale and player concerns

Every fourth round, eligible players may raise an infrequent playing-time concern after at least five club games. Higher promised roles expect more starts. Players currently injured are excluded from new concerns. A player raises at most one concern per season, and each club has at most one active concern.

Responses are a promise of two starts in the next five club matches, an explanation of competition, or no assurances. Morale changes are modest. The promise is evaluated against actual subsequent starts and may be fulfilled or broken. If the season ends before its five-match window, the concern closes without a penalty. Form remains capped at ±4 match-performance points and stays separate from permanent ability.

## Validation

- Existing match/season checks pass, including deterministic save/resume, legal substitutions, score integrity and complete campaigns.
- Format-2 migration preserves an active match, random state, conditions and fixtures byte-for-byte after removing the newly added management fields.
- Contract tests cover role expectations, salary counters, budget rejection, stale confirmations, duplicate confirmations and protected releases.
- Transfers change current squad membership without changing completed match records; the resulting save remains valid.
- Development tests cover age, neutral unknown ages, performance, exposure, injury penalties, potential caps, coherent attribute weighting and once-only application.
- Eight consecutive management seasons complete from 2027 through 2034, reaching the 2035 preseason with all 454 IDs retained, viable squads, valid budgets and loadable saves. The test records 1,543 renewals, signings, releases and expiries; these are contract/move records, not 1,543 external transfers.
- Storage tests cover authenticated ownership, conflicts, validation, migration checkpoint retention and exclusion of other accounts from that checkpoint. The storage adapter is mocked.

Implementation: `lib/management/`. Reproduce with `node scripts/test_management.ts`, `node scripts/test_career_storage.ts` and `node scripts/test_simulation.ts`. Current machine-readable results are in `data/generated/management-validation.json`.

Academies, newgens, U21 competition, All Blacks selection, North/South rugby, detailed staff and retirement remain later updates. The simplified annual development requested for this update is already active.
