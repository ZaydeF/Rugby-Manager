# Match Intelligence 2.0

## Delivered

- Shared SR/NPC matchday intelligence: selected-XV strengths, opposition matchup, plan trade-offs and replacement front-row assessment. Predicted opposition 23 uses the same competition-form/development selection policy as the match engine.
- Last-five opponent evidence: finishing attack/defence identities, kicking type/frequency, breaks, errors, set-piece retention, successful lineout targets and carrying groups. Missing history is labelled provisional; older results are used only for the fields they actually recorded.
- Live diagnostic suggestions after the opening period: ruck security, handling risk, edge protection, kick strategy, lineout security and exits. Recommendations explain the evidence and trade-off, remain optional and have a dismissal/cooldown.
- AI plans now derive from the selected personnel. Opponents in watched matches can adjust to match evidence, score and fatigue. Changes are logged with their reason and shown on the touchline.
- Full-time execution report: carrier groups, key contributions, set-piece losses, points from penalties, approximately 20-minute periods and frozen before/after intervention evidence. Comparisons include denominators and do not claim causal proof.
- The latest 320 competition match summaries persist across year rollover for opponent and previous-meeting context. Full current-season reports remain available through Schedule.
- Penalty control is a saved career preference: delegate, key penalties (default), or every penalty. It applies to the user's new watched/quick-sim matches. Key means attacking 22, a realistic kick opportunity (attacking half and at least 35% modelled chance), or a margin within seven after 65 minutes.
- Paused penalties offer posts, touch, scrum or tap, plus a one-off game-plan decision. Current field position, score, minute, available goal kicker and estimated goal chance are displayed. Choosing does not rewrite standing instructions. The manager then resumes play/simulation. A repeat scrum after a scrum penalty remains unavailable under the existing simplified engine.
- Pending penalties freeze clock and random state, persist through save/load, validate their originating event, reject stale/double decisions and block further calendar progress. Background simulations never stall for user input.
- Penalty goal estimates use kicking skill, composure, distance, range, fatigue and late close-game pressure. The displayed estimate uses the same function as resolution; lateral kick angle is not modelled.
- Corrected the world UI's halftime reset, which could leave the match at 40 minutes. Watched new-match passages stop at halftime; quick sim continues until a requested penalty decision or full time.
- Removed duplicate contest modifiers in new-engine penalty/turnover calculations. The rugby instructions already map to the underlying pressure controls; applying both was inflating penalties once AI specialist plans became active.

## Save compatibility

All additions are optional fields in the existing version-6 save: penaltyMode, matchMemory and the match's intelligence/penalty state. No baseline player ratings, memberships or career results are rewritten. Existing active matches are not upgraded mid-match and retain legacy arithmetic. New matches opt into intelligence version 1. Match samples are bounded to eight per side, interventions to 24 and historical intelligence to 320 summaries.

## Validation

- TypeScript check and production build passed. Full regression run: 64 tests passed; one existing development-preview smoke test could not load the Cloudflare Worker bundle through Node’s default ESM loader (`cloudflare:` protocol unsupported). It did not reach a game assertion. The Worker build succeeded; this is not counted as a passing test.
- Targeted tests verify all penalty modes/options, idempotence, exact paused save/resume, malformed pending-state rejection, home/away and SR/NPC control, halftime continuation, AI control ownership, evidence persistence, forecast parity and distance/skill-sensitive goal estimates.
- Render checks cover both career types, penalty controls and reports. Existing regression checks cover selection drag/drop, contracts/releases, youth, representative duty, Shield, migration and account-storage behavior.
- Final calibration: 3,000 matches. 1,500 baseline SR/NPC matches spanning all 25 clubs, plus 250 shared fixture/seed samples for each of six attack identities. All player/team try totals and score equations reconciled.
- Kick-pressure plan: 11.960 tactical kicks per match versus balanced 5.152. Wide: 13.624 home line breaks and 7.804 errors versus power 5.456 breaks and 3.376 errors. These are controlled scenario means, not forecasts or proof that any tactic is universally best.
- Baseline total scores remain high (73.301 SR, 68.920 NPC), with roughly 22 penalties per match. Broad sanity gates passed; realistic distribution/late-game calibration remains a future tuning task. Detailed output is in match-intelligence-calibration.json.

## Limits

No lateral player tracking or kick-angle physics is claimed. Carrier groups reflect player positions, not actual pitch channels. Staff advice is deterministic analysis of saved game data, not selector quotes or generated factual claims. Older matches do not receive invented telemetry. Browser interaction QA was not performed; component rendering and engine/flow tests were used. Full fatigue/substitution UI redesign and wider manager-career/recruitment work remain separate updates.
