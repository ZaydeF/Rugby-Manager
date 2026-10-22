# Super Rugby Manager — Rating methodology v0.2

Model `playable-0.2.0`. Descriptive game estimates based on the supplied 2026 snapshot, a shared league scale and transparent priors supported by published 2024–25 World Rugby awards. The award facts are sourced; the numerical priors are explicit game-design choices. Aggregate match-engine calibration is available in `simulation-validation.md`. Individual ratings are not independently validated future-performance predictions.

## Data and identities

All nine inputs are inspected and retained. Player IDs remain the source's decimal strings. Teams come from `players.csv`; matches join by `tournament_id`, which identifies individual fixtures in this feed, and are stored as `match_id`. The original field name remains in source JSON. A future generated player must use a disjoint ID namespace, e.g. `newgen:<uuid>`.

The SQLite database preserves each player's original record and every player-match record as JSON alongside relational keys. Price, fantasy ownership and round points have separate tables. CSV blanks in real biographical fields are not imputed. Age, date of birth, nationality, international eligibility, potential, injuries, contract and current game state are nullable. North/South defaults to `UNKNOWN`. No starter status is inferred from minutes. Fantasy ownership is not rugby team selection.

17 rows have zero minutes and one fantasy point. They remain in the source and displayed history, reconcile with source fantasy totals, and are excluded from ability rates. Played appearances count only positive-minute rows; source appearances are kept separately. There are 43 players with no source appearances and 135 additional players with fewer than 240 minutes.

## Raw measures

For each player, sum statistics over positive-minute rows. Let `x80 = 80 × sum(x) / total_minutes`. If total minutes are zero, use no statistical evidence. All coefficients below are explicit design choices to be evaluated later, not empirically proven causal contributions to winning.

| Attribute | Formula |
|---|---|
| Attack, most positions | .025 MG80 + .8 TB80 + 1.5 LB80 + 1.4 TA80 + .8 LC80 + .3 O80 + .6 T80 |
| Attack, scrum/fly-half | .02 MG80 + .5 TB80 + LB80 + 2.5 TA80 + 1.8 LC80 + .3 O80 + .4 T80 |
| Defence | .45 TK80 + 2.2 TW80 + 1.2 I80 + 12 × (shrunk tackle accuracy − pooled positional accuracy) − .6 MT80 |
| Work rate | .6 TK80 + .02 MG80 + .5 O80 + .5 TW80 |
| Set piece | position-specific LT80 and SW80 weights + 2 LS80 − 1.5 LE80 |
| Goal kicking | (C + PG + 12 × pooled goal accuracy) / (C + PG + CM + PGM + 12); requires at least five attempts |
| Discipline | −(PC80 + .5 E80 + 2 YC80 + 5 RC80); higher is better |
| Engine | .65 × minutes / (80 × franchise matches) + .35 × minutes / (80 × positive-minute appearances) |
| Impact | 2 T80 + 1.7 TA80 + 1.4 TW80 + LB80 + I80 + .5 LS80 |

Tackle accuracy uses 30 pooled positional attempts: `(TK + 30 × positional accuracy) / (TK + MT + 30)`. Pooling uses the complete imported positive-minute sample.

Set-piece weights for `(LT, SW)` are prop `(0.1,1.0)`, hooker `(0.75,0.25)`, lock `(1.0,0.2)` and loose forward `(0.7,0.1)`. Backs receive `null`, not a zero penalty. Scrum wins are collective, opportunity-dependent events; the attribute cannot establish individual scrummaging technique. Hooker and lock lineout counts have different meanings and are never compared directly.

Goal kicking is compared with all assessed kickers who also have at least 240 minutes, because accuracy is not meaningful against non-kicking peers. It is deliberately labelled **Goal kicking**, not complete tactical kicking. The dataset's rare 50:22s and drop goal attempts are retained in raw totals but cannot support a reliable standalone tactical-kicking ability measure. No invented tactical-kicking rating is supplied.

Stat glossary: `MP` minutes, `T` tries, `TA` try assists, `C/CM` successful/missed conversions, `PG/PGM` successful/missed penalties, `TK/MT` successful/missed tackles, `TW` turnovers won, `I` interceptions, `O` offloads, `LB` line breaks, `LC` line-break assists, `MG` metres gained, `PC` penalties conceded, `LT` source lineouts won, `LS` lineout steals, `LE` lineout errors, `E` errors, `TB` defenders beaten, `SW` source scrum wins, `YC/RC` cards. Mapped season totals reconcile player by player. `TC` is retained but unused because no explicit source definition accompanies the supplied snapshot. Work rate is an involvement proxy, not a claim to measured carry or ruck counts.

## Percentiles and shrinkage

1. For each position and assessed attribute, form a reference group of players with at least 240 minutes. Engine also uses this reference. The goal-kicking exception is described above.
2. Compute a midrank percentile `q = (number below + 0.5 × number equal) / reference_count`. A tied constant metric gets 0.5. References include the player when eligible. No quantile transform uses players from an unrelated position, except goal-kicking accuracy.
3. Transform the percentile to an observed score: `S = 48 + 48 × q`.
4. Rank each player's earliest available fantasy price within position to obtain `qp` on 0–1. Set the conservative prior `P = 62 + 10 × qp`. Seventeen players have their earliest price after Round 1; these profiles are flagged. Those priors may contain within-season information. This is not a prediction backtest.
5. Set evidence weight `r = M / (M + 320)`. At 0, 160, 320, 640 and 960 minutes this is 0%, 33.3%, 50%, 66.7% and 75%. The price contributes only a narrow 10-point prior range; at 960 minutes the maximum price-percentile effect is 2.5 attribute points.
6. Attribute score `A = r × S + (1 − r) × P`. No minutes means prior-only. Missing or nonapplicable attributes remain `null`.
7. The initial statistical ability is the weighted mean of **unrounded** assessed attributes, with missing weights removed and the remaining weights renormalised to one. Python `round` determines displayed integers (ties to even); ranking uses six-decimal unrounded CA then stable player ID. JSON does not publish an invented PA or hidden simulated game state.

## League scale and established players

The initial statistical ability `B` is transformed for every player: `L = clip(72 + 1.55 × (B − 70), 45, 97)`. This makes 90+ the exceptional tier requested in the brief, while preserving the statistical ordering before established-player adjustments. The scale is a transparent game-design calibration, not a claim that performance percentiles alone prove world-class ability.

`data/reputation-priors.json` records seven matched players with published 2024–25 World Rugby awards. A Dream Team prior is 94 and a Breakthrough Player prior is 88, with one point subtracted for a 2024 award. Evidence updates these priors via `rE = M / (M + 1600)`, then `CA = P + clip(rE × (L − P), −6, 6)`. At zero minutes the established prior survives unchanged. Missing a season does not produce negative performance evidence.

| Player | Prior | Final CA | Basis |
|---|---:|---:|---|
| Will Jordan | 94 | 92 | 2025 Dream Team |
| Fabian Holland | 88 | 88 | 2025 Breakthrough Player |
| Cam Roigard | 94 | 94 | 2025 Dream Team |
| Harry Wilson | 94 | 88 | 2025 Dream Team |
| Damian McKenzie | 93 | 93 | 2024 Dream Team |
| Tyrel Lomax | 93 | 92 | 2024 Dream Team |
| Wallace Sititi | 87 | 86 | 2024 Breakthrough Player |

Sources: [World Rugby 2025 Dream Team](https://www.world.rugby/news/1018839/seven-nations-represented-in-the-world-rugby-mens-15s-dream-team-of-the-year-2025), [New Zealand Rugby on Holland's award](https://www.allblacks.com/news/all-blacks/fabian-holland-named-world-rugby-s-breakthrough-player-of-the-year), [World Rugby 2024 awards](https://www.world.rugby/tournaments/awards/past-winners/2024).

Assessed attributes are shifted together toward the final CA while retaining their relative shape, bounded to 35–99; a small iterative correction aligns the weighted mean with the target after clipping. Missing/nonapplicable attributes remain null. This does not manufacture evidence of individual skills for an unplayed player: Holland's broad assessed attributes are prior-led, and his goal kicking stays unassessed. Profiles expose the statistical estimate, prior, source and evidence volume separately.

The award list is an initial evidence-backed prior set, not an exhaustive expert ranking. No nationality or international eligibility is inferred from it. Additional reliable history can extend the set through the same rules.

## Position weights

Weights are ordered Attack, Defence, Work rate, Set piece, Goal kicking, Discipline, Engine, Impact. Each row sums to one before unavailable attributes are omitted.

| Position | ATT | DEF | WRK | SET | KCK | DIS | ENG | IMP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Prop | .08 | .23 | .20 | .25 | .00 | .10 | .09 | .05 |
| Hooker | .12 | .20 | .15 | .25 | .00 | .10 | .08 | .10 |
| Lock | .10 | .25 | .20 | .23 | .00 | .08 | .08 | .06 |
| Loose forward | .20 | .26 | .20 | .08 | .00 | .08 | .08 | .10 |
| Scrum-half | .30 | .17 | .14 | .00 | .06 | .12 | .08 | .13 |
| Fly-half | .29 | .12 | .09 | .00 | .22 | .10 | .06 | .12 |
| Centre | .30 | .23 | .13 | .00 | .02 | .10 | .07 | .15 |
| Outside back | .36 | .14 | .10 | .00 | .04 | .10 | .06 | .20 |

## Review and limitations

- The first version compressed elite players and used only a narrow fantasy-price prior. That treated an established player's missing season like an ordinary unproven sample. Version 0.2 adds the shared scale and established-player evidence described above.
- Small-sample players can still rank highly when prior and performance are strong; low-volume evidence is always flagged. Rankings are game estimates rather than an expert consensus list.
- The league transform does not itself fix every cross-position calibration issue. Opportunity, team quality, correlated inputs and role still affect the estimates.
- Goal-kick difficulty is unknown. Set-piece involvement cannot establish individual technique. Tactical kicking uses a conservative simulation proxy, not an invented measured attribute.
- Confidence labels describe 2026 sample volume: Low <240 minutes, Medium 240–639, High ≥640. They are not posterior confidence intervals; an international prior is separate evidence.
- Historical fantasy points, permanent ability and simulated match form are separate measures. Form is capped at ±4 performance points and never rewrites permanent CA.

## Reproduce and validate

From the project checkout, run `python scripts/import_2026.py`. Optionally supply a directory containing the nine original file names (the `(1)` suffix is accepted). This writes a fresh SQLite database atomically, generated JSON, eight top-ten tables, exceptions, the audit and browser data assets. Invalid IDs, duplicate keys, malformed numeric rows and mismatched match joins fail before database replacement.

Run `python scripts/test_foundations.py` for source identity, null-fact protection, zero-sample shrinkage, rank behaviour, SQLite integrity, leaderboard completeness, byte-deterministic reimport and duplicate-import rollback tests. SHA-256 hashes in the audit identify the exact source bytes. Configured model coefficients live in `scripts/ratings/config.json`; raw measure definitions live separately in `scripts/ratings/model.py`.

The match engine, matchday selection, tactics and season loop are now implemented. Contracts, recruitment, development, academies and representative competitions remain later phases.
