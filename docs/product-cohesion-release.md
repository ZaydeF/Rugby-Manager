# Product Cohesion 1.0 — release candidate

Status: source implementation for review, **not a balance-approved release**.
The feature branch remains separate from main and the live Site. No database or
hosting change is required. Existing induction, readiness and 3D work is retained.

## What changes for the manager

- Six primary departments: Home, Squad, Tactics, Recruitment, Development, Club.
  Horizontal secondary navigation makes existing tools directly accessible.
- Home puts up to five real decisions before staff briefings. A single fixture
  block and compact season context replace repeated dashboard cards. Offseason
  business replaces in-season selection prompts when the window opens.
- Squad opens as a searchable, filterable, sortable table with review selection,
  age, ability, estimated potential, condition, sharpness, form, morale, role and
  contract expiry. Potential ranges remain estimates; missing facts stay missing.
- Quick player inspection links to a full player page within the career workspace.
  Existing performance, development, contract and readiness information is retained.
- Team selection keeps its pitch, squad controls, specialist cover, leadership,
  bench splits, kickers and drag/drop. Collapsed supporting controls free space.
- Recruitment presents results, assessment and proposed terms together. Scout,
  shortlist and contract actions use the existing engine. An unsuccessful approach
  leaves an explanation beside the controls. One to three contract years are
  offered, matching engine validation. Contract purchases and provincial
  affiliations remain different systems on the same player identity.
- Development uses compact evidence rows, with the existing pathway decisions and
  staff controls. Dressing room exposes existing captaincy, morale and recorded
  concerns. It does not pretend to simulate conversations or social hierarchies.
- Graphite surfaces, shared semantic tokens, restrained borders, tabular numerals
  and a muted club accent unify the active workspace. The rugby pitch stays green;
  alert colours indicate status. Some legacy component internals remain.
- The existing 3D match view remains the default. Teams, Statistics and Events
  are explicit analytical views. Halftime and fulltime reviews show actual match
  evidence, and result confirmation returns to the career recovery flow.
  An active match preview names the current participants instead of combining
  its scoreboard with another upcoming fixture.

## Weekly management rules

The optional `weekly.version = 1` extension stores one emphasis and four tactical
familiarity values per club. Missing metadata is added without consuming RNG,
changing player ratings, dates, finances or an already active match.

One coaching session applies on the first Tuesday–Friday continuation of each
calendar week. The week key prevents replaying it. Every club is processed; a
shared SR/NPC player has one training owner in the current competition phase.
Injured players do not receive the physical session effect.

| Emphasis | Additional session effect |
| --- | --- |
| Balanced | +1 to all four familiarity values |
| Recovery | Fatigue −2; +0.25 to each familiarity value |
| Conditioning | Fitness +1, fatigue +1.5; +0.25 to each familiarity value |
| Attack / Skills | Attack familiarity +2; other axes +0.25 |
| Defence / Breakdown | Defence familiarity +2; other axes +0.25 |
| Set piece | Set-piece familiarity +2; other axes +0.25 |
| Kicking / territory | Kicking familiarity +2; other axes +0.25 |
| Match preparation | +1 to each familiarity value; sharpness +0.5 only below 70 |

Familiarity starts at 65 and training keeps it within 45–90. A changed tactical
signature costs two attack/kicking familiarity points at the next session,
subject to the floor. Training never lowers an already higher sharpness value.
It cannot replace match exposure or permanently increase ability. Skills and
Attack currently share an effect; Defence and Breakdown also share an effect.
They are not yet separate skill-by-skill training programmes.

The *executed* emphasis is saved separately from the next chosen emphasis.
Changing focus after training cannot retroactively grant a match bonus. Familiarity
feeds existing strike-play execution; executed Defence/Breakdown or Set piece
can grant at most 0.6 temporary strength points. Existing daily recovery,
individual fitness plans, coaching exposure, medical rules and competition demand
still apply. New matches consume the weekly state; active matches retain theirs.

Recovery reports use actual recorded results and current concerns. Tuesday reviews
use recorded penalties/errors/turnovers. Wednesday opposition notes use recorded
Match Intelligence, and say when evidence is absent. Thursday pressure reports
come from real selection dilemmas. Team naming creates a day-before important
stop; Next event still stops before simulating the user's fixture.

## Match calibration and its unresolved trade-offs

`docs/cohesion-calibration.json` publishes complete distributions for the baseline,
release candidate and six tactical identities, rather than only favourable means.
The five `cohesion-long-final-*.json` files retain all 100 per-season records.
`cohesion-quality.json` separates strength gaps below five, five to ten, and above
ten ability points. `cohesion-long-summary.json` aggregates the careers.

The final candidate uses 5,000 matches, 2,500 per competition, cycling every
ordered home/away club pair. Fixture snapshots come from the real world prepare
path, with independent phase RNG seeds. Kickoff mood is held fixed within each
prepared pair: these are **not** 5,000 entirely independent kickoff draws. The
baseline disables the new match marker while keeping current roster/assistant
fixes. A fresh baseline supersedes the initial pre-fix baseline.

The marker `cohesionVersion: 1` applies only to newly prepared world matches.
Legacy active matches without it retain their engine path. Candidate parameters
reduce the penalty rate by 10%, scale ordinary ground gain to 82%, cap contact
advantage at ±1.2 metres and soften the try-finishing strength differential.
Automatic Game state penalties favour the corner unless it is the second half
and the score gap is at most ten. Explicit manager penalty instructions remain.

The comparison table below is generated with the final report before commit.
See the JSON for score, margin, tries, penalty goals/attempts, infringements,
cards, home wins, draws, blowouts, close games, halftime winner reversals,
late winner reversals, breaks, turnovers, metres, tackles, errors, kicks,
set-piece retention, possession and territory distributions.

<!-- CALIBRATION_START -->
| Competition / metric | Baseline | Candidate | Published SR 2025 |
| --- | ---: | ---: | ---: |
| SR combined points | 70.75 | 59.26 | 57.8 |
| SR tries | 9.08 | 8.50 | 8.2 |
| SR penalty-goal attempts | 5.03 | 1.81 | 2.1 |
| SR infringements | 23.13 | 20.85 | — |
| SR margin ≤7 | 38.44% | 34.84% | 43.1% |
| SR margin ≥28 | 11.88% | 16.64% | — |
| SR mean winning margin | 13.38 | 15.28 | — |
| NPC combined points | 67.47 | 58.98 | — |
| NPC tries | 8.66 | 8.59 | — |
| NPC penalty-goal attempts | 5.07 | 1.73 | — |
| NPC infringements | 23.31 | 21.07 | — |
| NPC margin ≤7 | 29.16% | 26.00% | — |
| NPC margin ≥28 | 26.64% | 32.00% | — |
| NPC mean winning margin | 19.11 | 21.25 | — |
<!-- CALIBRATION_END -->

**The balance gate remains open.** Scoring and penalty attempts move toward the
published SR season benchmark, but close-game frequency falls and blowouts rise.
That is a regression in competitiveness, not an overall realism improvement.
NPC margins also remain too broad to call calibrated. The current default is a
reviewable candidate on the feature branch, not a recommendation to merge it.

Primary benchmark: [Super Rugby Pacific's completed 2025 regular-season metrics,
published by Rugby Australia](https://www.rugby.com.au/news/super-rugby-pacific-reaches-new-heights-in-2025-202563):
57.8 combined points, 8.2 tries, 2.1 penalty-goal attempts, 43.1% of games within
seven. The simulation also includes finals and uniformly cycles club pairs, so its
sample is not a replica of that real season's schedule. No invented benchmarks
are assigned to infringements, cards or individual match distributions.
Simulation winner reversals at 40/70 minutes are not the same statistic as any
lead change during a half or final ten minutes. No like-for-like claim is made.

The tactical experiment has 1,200 paired fixture/seed matches: 100 per competition
per identity, with automatic tactical changes disabled. Combined scoring ranges
from about 49 (Power) to 69 (High tempo); High tempo also produces more errors.
Home win rates vary from 40% to 59.5%, indicating substantial remaining style
sensitivity. In below-five-point quality gaps, the stronger squad wins roughly
58–65%; five-to-ten-point gaps are more one-sided. Small cohorts and the quality
proxy prevent declaring any identity universally optimal.

## Long-career findings

Ten world seeds each complete ten actual seasons, including both competitions,
markets, development and rollover. No artificial minutes are injected. The human
club is deliberately unattended. All 100 season saves validate; there are no
negative-cash checkpoints and no club below 23 active registered members.

At the final checkpoints there are 1,228–1,248 active players, with 680–693
active generated players; mean ability is 63.2–63.8 and mean known age 27.4–27.6.
This does not establish population or talent equilibrium: generated depth players
change the composition of the population. Annual cash and wages, ability/age
quantiles, retirements, transfers and champion concentration are retained.
A membership count is not proof of every positional combination, wage-cap
compliance or a realistic youth pathway. Those need additional diagnostics.

The study advances the actual world in competition/round steps. It exercises
recorded training and match preparation, but does **not** run every daily weekly
session or reproduce a human-managed workload strategy. Separate daily-path
validation is reported below. This is a deliberate methodological limitation.
The offseason QA fixture also uses this bulk advance path; its stored calendar
date is not evidence of a correctly progressed daily calendar.

The study exposed duplicate assistant picks in depleted squads. The fix keeps
specialist cover available while ranking alternatives and never reuses an ID.
A separate performance change computes SR/NPC projections once per depth check,
instead of rebuilding the whole world for each club.

## Browser review

17 screens were reviewed at application viewport sizes 1440×900, 1920×1080 and
1280×800: setup, Home, squad, full profile, selection, tactics, weekly preparation,
recruitment, development, coaching, dressing room, fitness, match preview, live
match, halftime, fulltime and offseason. There are 51 screenshot proofs, plus a focused native capture of the restored
Playing plans route.

The browser's native screenshot surface remained 1363×936. Exact-size application
iframes were scaled to fit it; the proof images are therefore scaled captures,
**not native-resolution exports**. Native full-page/oversized captures timed out.
The native-resolution screenshot and automated pixel-regression gate is not
claimed complete. A temporary development-only viewport harness was removed
before the production build.

Manual flows verified squad filtering/multi-selection, full profile navigation,
profile-to-playing-plan links, consistent secondary pathway navigation,
scouting, shortlisting, a rejected in-season approach with visible explanation,
an offseason offer appearing in the existing negotiation thread, choosing recovery
and recording Tuesday's once-only session, halftime touchline advice, and result
confirmation returning to Home with an actual recovery report. Test careers and
engine-generated backups were used; no production account save was modified.
The managed browser used the software 3D compatibility renderer; native GPU
rendering remains unverified. Local account-saving unavailability is displayed,
with backup controls, rather than represented as a successful cloud save.

## Verification

- Production build: pass.
- TypeScript `--noEmit`: pass.
- `npm test`: 113/114 pass, including nine cohesion engine/compatibility tests and
  the new server-rendered product workspace checks. The remaining test is
  `tests/rendered-html.test.mjs`, whose import requires `cloudflare:` support that
  the default Node ESM loader does not provide. It is retained and still fails.
- `git diff --check`: pass.
- The existing Match Intelligence validator also passed its 3,000-match study.
  One bounded legacy season passed; its default 20-season run was not completed.
  The daily pathway study reached 2031/2030 for its two seeds before the 420-second
  budget expired, so no final daily-path aggregate pass is claimed.
- Standalone scripts: results and limitations are in
  `docs/product-cohesion-checks.json`. Several older checks fail on the unchanged
  starting commit; those are not silently deleted or relabelled as passes.
  Some long default scripts exceeded the recorded execution budget.
- Existing navigation/calendar tests now require six departments and the extra
  real team-naming stop; selection, result, minutes and save assertions remain.

## Reproduce

Use Node 22.13+ (the captured runs used Node 24.22.1).

```sh
npm install
npm run dev
npx tsc --noEmit
npm test
node --experimental-strip-types --experimental-transform-types scripts/calibrate-product.mjs baseline
node --experimental-strip-types --experimental-transform-types scripts/calibrate-product.mjs candidate docs/cohesion-raw-final.json
node --experimental-strip-types --experimental-transform-types scripts/calibrate-product.mjs tactics
node --experimental-strip-types --experimental-transform-types scripts/calibrate-product.mjs career docs/cohesion-long-final-1.json 1 2
node --experimental-strip-types --experimental-transform-types scripts/calibrate-product.mjs career docs/cohesion-long-final-3.json 3 4
node --experimental-strip-types --experimental-transform-types scripts/calibrate-product.mjs career docs/cohesion-long-final-5.json 5 6
node --experimental-strip-types --experimental-transform-types scripts/calibrate-product.mjs career docs/cohesion-long-final-7.json 7 8
node --experimental-strip-types --experimental-transform-types scripts/calibrate-product.mjs career docs/cohesion-long-final-9.json 9 10
node --experimental-strip-types --experimental-transform-types scripts/analyse-cohesion.mjs
node --experimental-strip-types --experimental-transform-types scripts/package-cohesion.mjs
```

Raw match rows are reproducible but excluded from the source upload; the published
JSON contains their SHA-256 hashes and full summary distributions. Per-season
long-career rows are included. Screenshots are supplied separately; they are not
remote game assets.

## Work required before a full 1.0 balance sign-off

1. Restore close-game frequency and reduce blowouts while keeping team quality
   relevant, then rerun paired match, tactical and career studies.
2. Extend long studies with positional viability, wage-cap/reservations, elite
   player supply, youth minutes versus plans, workload and injury distributions;
   investigate depth-player accumulation and champion concentration.
3. Complete daily-calendar and native-resolution browser regression gates, and
   repair older validation assumptions without removing their guarantees.
4. Continue replacing legacy UI internals and enlarge the player/development
   workspace where the current read-only sections still require long scrolling.
   Staff conversations, social groups and independent skill-specific weekly
   programmes are not implemented in this candidate.
