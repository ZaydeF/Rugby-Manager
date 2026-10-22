# Phase 2 — Rugby tactical engine 2.0

8 September 2026 · Development pack 1.2.0 · Engine 0.3.0

## Playing the update

Open **Tactics → Rugby game plan**. Attack, Lineout, Scrum, Kicking, Defence and Strike plays organise the detailed options. The existing tempo, risk, width and other sliders remain available. Quick presets now update the attacking identity as well as those sliders. Save/load retains your preferred plan.

Choose up to three strike plays before weekly preparation. The selected arsenal gains familiarity once per round: recovery training adds 5 points, balanced 10, intensive 14; unselected plays lose 3. Initial familiarity is 25. There is no ability increase from clicking a tactical option. Familiarity improves execution, and complex moves demand stronger relevant units. Automatic calls wait for suitable situations; live calls can queue a specific play and be cancelled.

During a match, **Touchline decisions** lets you call those plays, change the next penalty decision, adjust drop-goal instructions or pause to open the full game plan. The timeline records tactical changes, kick types, set-piece decisions and play execution. Reports include tactical action counts and drop goals. Changes use the players currently on the field, so substitutions affect unit strengths immediately.

## Implementation coverage

| Area | Implemented choices and effects |
|---|---|
| Attack | Forward power, balanced phases, wide shape, out-the-back, kick pressure and counterattack. Tempo and risk remain independent. Attacking ruck support trades security, support options and fatigue; carrying distribution weights who receives the ball; middle, blindside and edge preferences interact with defence. |
| Strike library | Midfield strike, blindside launch, forward tip-on, screen play, cross-kick, set-piece exit and goal-line power. Three-play limit, field-position gates, weekly preparation, execution errors, completion and live calls. |
| Lineouts | Full/shortened, front/middle/back, short/medium/long throw, maul/launch, quick/secure. Ambitious throws risk retention but improve launching opportunities. Aggressive/selective contest, staying down for maul defence and halfback pressure affect outcomes. |
| Scrums | Stable platform, penalty pressure, quick release, eight-man pressure and defensive survival. Number-eight and halfback launches influence carrying selection. The front row dominates scrum strength; eight-man pressure costs extra energy. |
| Kicking | Contestable and territorial choices, box-kick frequency, long exits and attacking cross-kicks. Kicker skill and provisional receiver/chase assessments influence regains. Kick receipt can counterattack or return to touch. |
| Scoring | Posts, corner, scrum, tap or game-state penalty decisions. Drop goals can be disabled, reserved for a late close game, or attempted when in range. Separate drop-goal scoring, save validation and report totals. Out-of-range posts instructions fall back to the corner. |
| Defence | Drift, aggressive line speed, blitz, edge protection; compete/selective/fan-out ruck policies; balanced/deep/chase backfield; balanced/tight/spread goal-line defence. Pressure can force errors while leaving space or increasing penalty exposure. |
| Personnel | Unit strengths are calculated from attributes, roles and condition. Carrying centres, mobile front fives, back-row contest, lineout locks and fresh replacement front rows produce distinct effects. AI starting plans use personnel, with late-match score-aware adjustments. |

## Data and modelling limits

The current eight-attribute database does not include verified heights or dedicated aerial/throwing attributes. Aerial assessments use set-piece, impact and attacking skills of outside backs as explicit provisional estimates. **Height-specific tall-wing advantages are not implemented** until reliable height and aerial data exist. Front-row, lock and back-row roles use the existing positional categories; this is not a detailed scrum biomechanics model.

The new equations define a game simulation, not an empirically validated prediction model. Effects are bounded, but styles are not guaranteed equal win rates. The scenario report exposes actual sensitivity results for further playtesting. The engine does not add a general chemistry bonus, change CA/PA, or alter national eligibility.

## Save compatibility and verification

- New matches carry a rugby engine marker. Active legacy matches retain the previous resolution path. Existing results are not recalculated.
- Twelve active Phase 1 matches replayed against the previous engine with identical event timelines, random states and final team statistics.
- 640 tactical scenario matches checked scoring consistency, event limits and contrasting styles. Wide/out-the-back created more breaks and handling errors than power; kick pressure increased kicks; maul instructions created mauls; tap instructions produced more tries than posts.
- Focused tests cover unit sensitivity, throw security, scrum strength, mobility, familiarity, game-state decisions, arsenal validation, preparation idempotence, live calls, resume and replacement front rows.
- Existing preparation, foundation, squad/save and Phase 1 regression checks passed. Account-storage tests use mocked R2; no live browser QA was requested.
- Five-season structural run passed with legal positional cover, wage caps, save round-trips, annual development and transfer constraints. Year-five decoded save: 13.39 MB; compressed: 1.61 MB. See `phase2-longevity.json`.

The earlier twenty-season save-size issue remains open. This release does not certify long-career archival capacity or complete commercial database rights.
