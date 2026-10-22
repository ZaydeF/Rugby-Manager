# Super Rugby Manager — Match and season validation

Model: `playable-0.2.0`. Engine: seeded phase simulation. Validation date: 5 September 2026.

## Scope

A playable match-and-season build, following phases 2–4 of the brief. Select any of the 11 imported franchises, name a legal 23, choose kickers, set nine tactical controls, play or instantly resolve matches, advance through 16 rounds and six-team finals, and continue into the next season. Form, fatigue, morale and simple injuries affect performance separately from permanent ability. Future player development and recruitment are deferred.

## Historical comparison

4,000 seeded matches rotate the 11 franchises against different opponents. Both sides use assistant selection, healthy initial condition, balanced tactics and automated substitutions. These are aggregate calibration checks, not forecasts or a replay of historical lineups. The reference is the supplied 77-match season.

| Metric, per match unless stated | Supplied 2026 | Simulation |
|---|---:|---:|
| Total points | 57.545 | 55.281 |
| Tries | 8.351 | 8.146 |
| Penalty goals | 1.065 | 1.036 |
| Penalties conceded | 18.078 | 17.600 |
| Tackles | 298.065 | 296.838 |
| Missed tackles | 45.961 | 45.550 |
| Metres | 906.481 | 934.356 |
| Line breaks | 13.649 | 13.412 |
| Turnovers won | 12.351 | 12.607 |
| Yellow cards | 0.896 | 0.883 |
| Red cards | 0.052 | 0.054 |
| Absolute score margin | 16.065 | 16.510 |
| Home win share | 0.610 | 0.603 |

Simulated draws: 2.5%. Total score range across the batch: 10–120. These tails are observations, not hard caps. Broad averages are close, but matching means does not prove realistic distributions, individual rankings or every tactical matchup.

Set pieces are counted as unique contests in the engine. Imported scrum and lineout actions often credit multiple players for a collective event, so a direct count comparison would be misleading. Simulated successful scrums average 7.92 and lineouts 18.61 per match.

## Tactical sensitivity

500 matches per scenario, reusing the same schedule and seeds. Only the home side changes; the opponent remains balanced. Random streams diverge when tactical decisions change events. The table reports home-side means. Fatigue averages the 23 selected players.

| Scenario | Metres | Handling errors | Turnovers | Penalties | Fatigue | Win share |
|---|---:|---:|---:|---:|---:|---:|
| balanced | 485.5 | 4.53 | 6.58 | 8.83 | 15.7 | 62.2% |
| fast | 579.6 | 5.35 | 7.10 | 9.77 | 19.2 | 61.8% |
| slow | 394.6 | 3.64 | 5.96 | 7.80 | 12.2 | 57.2% |
| aggressive | 498.1 | 4.48 | 7.80 | 10.82 | 18.0 | 63.2% |
| passive | 468.5 | 4.30 | 5.24 | 6.44 | 13.4 | 55.2% |
| highRisk | 555.3 | 6.30 | 7.17 | 9.35 | 15.7 | 59.8% |
| lowRisk | 395.9 | 2.46 | 6.10 | 7.75 | 15.7 | 61.6% |
| stronger | 541.2 | 4.47 | 7.40 | 7.59 | 15.7 | 85.2% |

The stronger scenario adds 12 ability and assessed-attribute points (capped at 99) to the home squad. It checks that quality matters. High tempo produces more attacking ground and fatigue; higher risk/offload freedom produces more ground and handling errors; aggressive breakdown commitment produces both more turnovers and conceded penalties. An early calibration excessively rewarded conservative settings; the final model adds explicit attacking rewards and checks that the average margin gap between opposing risk/tempo settings stays below eight points in this batch. This is not an exhaustive proof of strategic balance.

## Functional checks

- Nine foundation tests: original player identities and records, nullable real facts, shrinkage, ordering, SQLite integrity, deterministic reimport and rollback on invalid data.
- Every franchise can select a position-valid 23. Duplicates, injured selections and incompatible positions are rejected before kick-off.
- Same seed produces the same complete event stream. Phase stepping and a JSON save/resume midway through the match match the instant outcome exactly.
- Substitutions enforce available replacements, positional cover, no re-entry and no replacement of a carded player. Yellow cards exclude a player until their timer expires; red cards exclude them for the remainder.
- Twelve full campaigns, covering all 11 user franchises, finish with 77 regular-season matches plus six finals. Each club plays 14 regular-season matches. Total points for and against reconcile. Qualification, finals pairings and reseeding are checked.
- Duplicate result recording cannot double-count the table or form effects. Active, completed-round and season-complete saves pass structural and identity validation. Malformed and foreign backups are rejected.
- Player and team scores/actions reconcile in all 4,000 baseline matches. Tries, conversions and penalty goals reproduce the scoreboard.
- Career storage handler tests cover authenticated ownership, account isolation, round-trip saving, stale-revision conflicts, malformed data, size limits and missing storage. The R2 adapter is mocked; hosted persistence is not yet end-to-end verified.

## Model boundaries

1. Career year 2027 uses the 2026 draw shifted forward 364 days and the imported squads. Everyone starts healthy. This is a fictional future campaign, not an assertion about real current injuries or future club membership.
2. Broad role slots are enforced: two props, hooker, two locks, three loose forwards, scrum-half, fly-half, two centres and three outside backs; the bench contains eight defined broad roles. Prop side, wing/fullback and centre side are manager assignments. Emergency centre/outside-back and lock/loose-forward cover reduces ability by 10%.
3. The finals format is top six, 1 v 6 / 2 v 5 / 3 v 4. Three winners advance, ordered by original seed, and the highest-ranked loser becomes fourth seed. Semis are 1 v 4 and 2 v 3; the higher semi seed hosts the final. Reference: [Crusaders explanation of the 2026 finals](https://crusaders.co.nz/latest/news/breaking-down-the-super-rugby-pacific-finals-puzzle-eight-scenarios-and-what-they-mean-for-us/).
4. Win = 4, draw = 2; try bonus requires three more tries than the opponent; losing bonus requires a margin of seven or fewer. Knockout ties use 20 minutes extra time then a kick shoot-out. Red cards are permanent within the match; detailed replacement-red-card protocols, HIA/front-row exceptions, disciplinary hearings, drop goals and law-specific tie contingencies are not modeled.
5. Tactical kicking uses overall ability as a conservative distance proxy; source goal accuracy does not establish tactical kicking skill. Possession, field position and territory drive linked events; this is an abstraction of phases, not a physical player-tracking model.
6. Subsequent seasons preserve champions, results, final standings and player totals, with downloadable season records. They currently reuse the same squads and ability, reset the new-season conditions, and do not yet generate contracts, recruitment, ageing, academies, internationals or awards beyond the title.
7. Autosave is account-backed through a private per-user R2 JSON snapshot, with conditional revision checks. It runs every eight seconds during live play and after paused changes. A download is available independently. A storage error or conflicting device is shown rather than falsely claiming success. Browser interaction and deployed storage testing were not requested and have not been performed.

## Reproduce

```sh
python scripts/import_2026.py
python scripts/test_foundations.py
node scripts/test_simulation.ts
node scripts/test_career_storage.ts
node scripts/validate_simulation.ts 4000
node scripts/validate_tactics.ts
python scripts/report_simulation.py
```

Core rules live in `lib/sim/config.ts`; causal event formulas in `lib/sim/engine.ts`; competition progression in `lib/sim/career.ts`. Ratings remain separate under `scripts/ratings/`. JSON validation summaries are retained with the source.
