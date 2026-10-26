# Management workspace and match delegation update

This update addresses correspondence density, hidden player ratings, delegated work,
club pathways, match controls and staff consequences on the existing review branch.

## Player-facing changes

- `/` opens `/play`; the fantasy-points landing page is removed from the entry flow.
- Inbox combines career stories, concerns and contract discussions in one list and
  reading pane. Filters and search operate on the same collection. Contract replies,
  negotiations, player follow-ups and department links retain their real actions.
- Ability and potential display as stars, including accessible labels and tooltips.
  The underlying values still drive the simulation. Skill attributes remain numerical.
  Position labels use names such as Scrum Half, Loose Forward and Centre.
- The application uses a viewport workspace with its own content scroll. Development,
  progress, intake and development matches have separate screens. Club reports have
  Overview, Depth, Honours, Notes and Scrapbook views. Manager responsibilities fold
  away; the full editor is also available under Club → Staff & responsibilities.
- Live matches put a compact player register beside statistics or 3D highlights.
  Each player has a replacement menu, legal bench cover and compatible on-field swaps.
  Confirmation pauses the match and retains front-row and availability restrictions.
- Condition/sharpness: green ≥75, amber ≥60, red <60. Performance rating: green ≥7.0,
  amber ≥6.3, red <6.3. Ratings remain blank before a player records match minutes.
- Key moments is the default. The engine advances through ordinary passages and
  switches to the existing 3D renderer for selected highlights. Extended, Full match,
  Commentary and a Statistics view remain available. Detail and speed never enter RNG.
- Quick sim delegates all match decisions directly to fulltime, including penalties.
  A legal named 23 stays intact; an invalid team is repaired through assistant selection.
  Watched matches retain explicit selection checks. Whole-match delegation also works
  during a live match. A device-local confirmation preference can be suppressed and
  re-enabled in Staff responsibilities.

## Consequential staff

The existing forwards, backs and youth coaching records remain intact. An optional,
validated `staffOffice` extension adds five fictional employees per club:

| Role | Applied consequence |
| --- | --- |
| Assistant Manager | Delegated playing plans and season minutes targets |
| Performance Coach | Bounded daily fatigue recovery when funded |
| Physiotherapist | Bounded fitness support; never removes medical unavailability |
| Head Scout | Accuracy of new scouting observations; assignment delegation |
| Opposition Analyst | Bounded focused familiarity gains; evidence-based preparation |

Six editable responsibilities cover playing plans, individual training, preparation,
fitness plans, scouting assignments and renewal proposals. Work runs through the
calendar. Selection instructions remain distinct from season playing plans. Appointments
charge cash, role changes are limited per season, and department wages are charged
weekly. Unfunded offices pause support. Staff recovery is date guarded and one physical
player receives support from one registration owner for the current competition phase.

## Club development

All 25 clubs now have a pathway register without the previous 12-player display cap.
New Zealand franchise networks use actual shared provincial registrations as recruitment
connections; they do not own another union's contracts. Australian franchises and Fiji/
Moana use their own club development registrations. NPC unions retain their school trials.

Four fictional prospects per Australian/Pacific club enter new careers and annual
rollovers. Existing careers receive the new cohort at their next rollover. Names, staff,
salaries and new-player birth dates are explicitly game-generated. These programmes use
the existing simulated U21 fixtures and record actual minutes/ratings. They are a game
model, not an assertion of an exact real federation or academy competition structure.
Australian/Pacific prospects are not assigned invented NPC affiliations.

Your player can receive a development, workload or senior opportunity plan. External
prospects require the normal club/player negotiation, transfer window and budget rules.
No pathway action silently transfers ownership. Evidence combines recorded senior,
provincial and development appearances; missing evidence remains zero/blank.

## Home advantage

The existing configuration remains **3.5**, added to the home side's aggregate strength
in the shared strength helper. It is not an automatic 3.5 scoreboard points. There are
no special club spikes, venue multipliers, travel or crowd calculations.

`home-advantage-check.json` compares 500 equal-team matches per setting with paired seeds:

| Modifier | Home win rate | Draw rate | Mean home margin |
| --- | --- | --- | --- |
| 0 | 46.2% | 6.4% | −0.526 |
| 3.5 | 60.2% | 2.8% | +4.378 |

This is model sensitivity evidence. It does **not** establish agreement with observed
Super Rugby results. No venue-specific tuning was invented for this update.

## Validation and limits

- TypeScript and production build pass; whitespace/diff checks pass.
- Validation follow-up (27 October 2026): **123/123 pass**, zero skipped, through
  `npm test` (fresh production build and the complete suite). TypeScript and diff
  checks also pass. See `manager-ux-checks.json`.
- The former worker HTML failure is fixed in the test harness. The actual compiled
  worker now runs in Wrangler's local Cloudflare runtime, with temporary storage,
  no remote bindings, no environment-file loading and outbound services blocked.
  The check verifies `/` redirects to `/play`, the game HTML and preview metadata
  render, the built JavaScript asset is served and unauthenticated account saves
  return 401. Workerd provides the platform import; the application bundle is
  tested in its supported runtime.
- New tests exercise all 25 pathway registrations, all six Australian/Pacific intakes,
  actual development evidence, protected workload, legal senior decisions, rollover,
  wages/funding/idempotence, migration, staff costs, delegation and scouting accuracy.
- Every highlight detail produces identical engine outcomes, including decision stops.
  Match delegation is checked for SR/NPC, save/reload, legal and unavailable named teams.
- Four actual calendar careers (Drua, Moana, Waratahs and Otago; seed 73) complete a season
  and rollover: 1,244 validated daily checkpoints and 58 delegated user fixtures. All
  four year-end checkpoints validate and no club has negative cash at those checkpoints.
  `staffPaidCurrentSeason` is the new year's total at the checkpoint, not lifetime wages.
- Browser review at 1363×936 verifies the root redirect, inbox filters, capitalized
  positions, stars, staff delegation, direct substitution confirmation, full delegation,
  suppressed warning after reload, and Fijian workload/watchlist controls. Narrow-screen
  layouts have CSS fallbacks but no additional browser viewport proof in this update.
- Existing saves retain IDs, attributes, potential, conditions and active match state.
  New staff metadata does not simulate a recovery day on migration. Existing active
  matches retain their original calibration path.
- The previous product-cohesion reports describe the earlier baseline. They are not a
  new balance certification for staff economics or these extra intakes. Long-term economy
  and full empirical match/venue calibration remain open review gates.

Reproduce from the repository with a supported Node version:

```sh
npx tsc --noEmit
npm run build
node --test tests/*.test.mjs
node scripts/check-home-advantage.mjs 500
node scripts/check-manager-calendar.mjs
```

Changes are prepared on the existing draft PR. Main and the live deployment are unchanged.
