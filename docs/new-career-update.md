# New career and first-week update

This is the first working vertical slice of the supplied 80-section brief. It is
not an implementation of every requested downstream management system.

## Audit and architecture

`app/play/page.tsx` mounts `world-client.tsx`, not the older `career-client.tsx`.
The active game uses a shared SR/NPC world and version-6 saves. Career Pulse
already owns captaincy, board objectives, confidence, supporter summaries,
milestones and season checkpoints. Calendar progression already advances days
and stops at meaningful events. Readiness already separates fitness, sharpness,
injury return and competition demands. Contracts, provincial registrations,
scouting and coaching already exist.

This update therefore extends those systems rather than creating duplicate board,
captaincy, calendar, training, fitness or match engines. Presentation is in
`app/play/setup/`; domain setup, analysis and first-week processing are in
`lib/career-setup/state.ts`. Existing 3D match playback is retained.

## Fully implemented

- Nine-stage reversible setup: World, Manager, Club, Expectations, Staff, Rugby
  identity, Squad, Preseason, Begin. Quick Start uses four stages.
- Standard and Advanced induction; Advanced exposes the deterministic seed.
  All modes share the supported database. Starting years 2026–2030 are exposed,
  with 2027 the default. Changing year does not invent new real-world rosters.
- Save name and manager identity, nationality, playing and professional background.
  The last identity can be reused locally; reputation/progression is not reused.
- All 25 franchise/union choices. Actual game-state squad strength, predicted
  finish, key players, prospects with known age, positional cover, contract risks,
  cash and wage budget are analysed from one service. Analysis is memoised in setup.
- Board target choice updates the existing annual objective: predicted rank minus
  one for Ambitious, plus one for Standard, plus two for Cautious, bounded to the
  competition size. The existing U23 minutes target is scaled by 1.2 / 1 / 0.8.
  Board reviews and season checkpoints consume these actual targets.
- Staff introduction uses the existing three generated coaching roles. Full
  control, Head coach and Balanced presets set the real assistant selection and
  substitution flags. They can be edited later in Manager & career.
- Six rugby identities map to valid existing rugby-plan variables. Recommendation
  compares pack and backline starter quality. Quick Start accepts it automatically.
  Instructions remain editable in Tactics.
- Depth table, assistant-selected valid 23, current squad captain/vice selection,
  and assistant leadership defaults. Duplicate or foreign leaders are rejected.
  Existing captain match effects remain in use.
- Balanced preseason retains existing preparation. Conditioning activates the
  existing daily conditioning plan for the current squad. No immediate ability
  or sharpness boosts, fictitious match minutes or new injuries are generated.
- A first squad statement changes morale by at most one point. Claiming a title
  challenge with a substantially weaker squad incurs a small cost.
- Opening welcome, squad assessment and preparation programme in Career Pulse;
  recruitment briefing after two days and development briefing after four days.
  They use the normal inbox/story store and are processed once.
- Two persistent position focuses commission up to three scouting reports each,
  using canonical IDs, the normal report delay and five simultaneous assignments.
  Unassessed candidates are selected deterministically by ID within the position,
  without reading hidden potential to select the best prospects. Manager & career
  shows pending/completed assessments and supports cancellation/resumption.
- Career business derives completion from leadership, contracts, reports and
  recorded matches. Manager & career is available in the sidebar throughout play.
- Setup remains local component state until Begin. The career is created and
  validated before it replaces the live session. Existing autosave, conflict
  handling and backup mechanisms remain responsible for persistence. A failed
  account save retains the session and the existing download-backup notice.

## Implemented in simplified form

- Reputation is a displayed, bounded career summary: background baseline plus
  modest recorded-win and board-confidence contributions. It does not yet change
  recruitment willingness, board patience or player respect. Professional
  background is biographical, without a hidden attribute bonus.
- Standard/Advanced differ in seed exposure; Quick skips the longer induction and
  accepts the tactical recommendation. A separate Essential mode is not added.
- Squad units follow the verified broad source positions, without inventing prop
  sides or specialist flank positions. Recommendations compare internal groups;
  they do not claim league unit rankings or a calibrated difficulty score.
- Meetings are concise setup decisions and subsequent inbox business, not a
  branching dialogue engine. The board/supporter confidence and season assessment
  remain the existing Career Pulse implementations.
- Tasks are derived live, not separately persisted. A contract task remains open
  until expiring deals are resolved; merely visiting the page does not complete it.
- Focus statuses are active/cancelled; completion of their report work is reflected
  in the task. They do not sign players or automatically spend transfer funds.

## Save migration

The world envelope stays version 6. A separately versioned `careerIdentity`
extension (version 1) is validated at the save boundary. Incrementing the world
envelope merely for this optional metadata would require changing unrelated
legacy/world dispatch paths; independent subsystem versions follow the existing
Pulse/readiness approach. Both new raw worlds and old world saves receive legacy
identity defaults. Wizard-created careers replace those defaults with confirmed
setup. Legacy defaults never trigger onboarding or retrospective preparation,
scouting, morale or objective changes.

Migration clones the save and adds only missing identity metadata after existing
repairs. It does not consume RNG or replace active matches, fixtures, financial
state, condition, contracts, memberships or potential. Pre-world saves still use
the established canonical-ID migration before receiving identity defaults.
Existing careers show a neutral placeholder identity rather than inventing the
human manager's biography. Their original starting history is not reconstructed.

## Deferred and why

- Contract/recruitment/media/development delegation beyond existing selection/sub
  flags: no safe complete staff execution contract exists for these decisions.
- Recruitment focus editing, age/ability filters, priority ranking, completion by
  signing, and scouting assignment staff ownership: need richer scouting workflow.
- Manager attribute budgets, competing background benefits, support/respect,
  manager employment, reusable account identity, job market, recruitment influence:
  require calibrated bounded integrations rather than arbitrary buffs.
- First-window restrictions, random offseason squads, alternate knowledge modes,
  injury presets and tutorial controls: omitted rather than presenting inert rules.
- Extra fictional staff roles and medical attributes: the active coaching system
  has three meaningful roles; adding titles alone would be cosmetic.
- Skills/set-piece/tactical preseason blocks, trial fixtures and new familiarity
  learning: the active world engine does not consume every older training field.
  These options are not exposed as placebo programmes. Current tactical learning
  and readiness are preserved without claiming a new AI-balanced training model.
- New supporter/media conversations, press conferences, detailed board promises,
  squad support/hierarchy reactions and expanded long-term manager history: existing
  Pulse records/reviews remain intact; no parallel or unsupported effect is claimed.
- Multi-horizon squad planner expansion, league unit ranks and career difficulty:
  need deeper availability/retention calibration. Existing planner stays available.
- Contextual tutorial flags and first-week trial reports: no new tutorial engine
  or friendly-match architecture is introduced.
- Multi-season AI calibration of new performance modifiers: no such modifiers are
  introduced. Existing simulation regression tests are run; this does not claim
  a new multi-season balance study.

## Architecture prepared for

The validated manager/setup extension can carry future employment metadata without
binding identity to one club. Recruitment focuses have lifecycle/status and
canonical candidate IDs. Daily processing is idempotent and calendar-driven.
Club analysis is reusable; new screens consume it rather than duplicating estimates.
These are extension points, not claims that deferred features already exist.

## Data honesty

Player identities, source positions and verified biographies come from the current
catalogue. Unverified ages are excluded from youth recommendations. Ability and
potential are game ratings; reports are estimates. Cash, wages, contracts, staff,
board targets, reputation and generated depth players are simulation state, not
claims about real rugby organisations. Setup explicitly labels generated data.

## Validation

Six new automated tests cover all 25 clubs, valid 23s and leadership, deterministic
creation, legal tactics, real setup effects, focus capacity/cancellation,
idempotent first-week events, active-match migration preservation, and malformed
extension rejection. Existing world save/R2/identity tests also pass after ensuring
raw new worlds initialise the same neutral identity extension as migration.
The standard production build, TypeScript and regression suite are run. The
known rendered-HTML test needs a Cloudflare-aware loader rather than Node's default
loader; it is not removed or bypassed.
