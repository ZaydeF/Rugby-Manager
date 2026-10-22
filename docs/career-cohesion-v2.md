# Career cohesion: shipped scope and v2

## The shared-world model

- One player entity; independent Super Rugby and NPC registrations. Skills, health and career history follow the player.
- A Super Rugby manager controls their franchise's matches. During NPC they watch affiliated players, scout and negotiate new SR contracts with NPC-only players.
- An NPC manager follows Super Rugby during February–June, prepares provincial depth and manages NPC in August–October. Super Rugby contract ownership does not cancel NPC affiliation. Representative duty and injuries still change availability.
- A new SR contract for an NPC-only player needs player agreement, salary capacity and roster space, but no provincial fee or positional-cover veto. The NPC registration remains active.
- Buying out an existing SR contract still needs club agreement in the shared offseason. NPC management cannot purchase/control an existing SR contract in this simplified release.
- The 42-day shared recruitment window follows NPC. Renewals can be discussed during the year. In NPC season, a new SR contract's covered seasons start the following year. The final covered season is displayed before submission.
- One move per player per career year; renewals remain possible. AI clubs target at most three signings per year, with spaced approaches.
- Daily Continue and Next event both stop at a user's match. The manager reviews both squads and chooses Play or Quick sim. Background competitions continue automatically on their scheduled round dates.

## Shipped in this update

Home dashboard: table, morale, form, youth exposure, availability, messages, two-week calendar and the other competition's table/results/affiliated players.
Matchday: provisional matchday 23s for both teams, profile links, selection editing, explicit play/quick sim.
Recruitment: no-fee NPC-to-SR contract path, preserved NPC affiliation, quieter AI recruitment, contextual salary demand, clearer final covered season, recruitment filters and removal of obsolete world-incompatible offseason controls.
Stats: both leagues, player scope, sorting by rating, points, tries, tackles, metres, turnovers, minutes and appearances. Points include tries, conversions, penalties and drop goals. New club appearance counters persist; reconstruct missing current-season counters only from retained full match evidence.
Intake: four school leavers per NPC union annually, weighted from supplied v075 school/feeder data; school and home union recorded in the player profile. Fictional origins, not claims about existing players.
Development: higher young-age/headroom growth with meaningful minutes; no automatic catch-up or hidden PA reroll. Existing development checkpoints remain idempotent.

## Validation

14 focused engine/save/render checks passed before final UI refinements; repeated affected tests for release. Two full daily-calendar careers (SR and NPC) completed 311 day advances each into 2027, with every user fixture explicitly played, valid saves, 56 school leavers and no AI club above three new signings. TypeScript and production build gates applied.
Controlled Pledger example: 64.2 after three years with no match minutes versus 91.5 with 700 SR + 700 NPC minutes per year at 7.2 average rating, seed 7. This is an opportunity illustration, not an expected career forecast. Other seeds, injury, form and fewer minutes change outcomes.
No interactive browser QA was performed. No production career was overwritten for tests.

## V2 — build together as the next bounded release

1. Ranfurly Shield: verified initial holder in the database, NPC home challenge rules, explicit defence/challenge labels, shield history and dashboard presentation. Validate no shield changes on away games or inappropriate fixtures. Treat rules as configurable for fictional editions.
2. All Blacks XV: explicit NZ eligibility, second-squad selection excluding senior All Blacks, meaningful NPC availability dates, appearances kept separate from Test caps, squad announcement and promotion stories. No invented Test caps for XV games.
3. Dual-contract lifecycle: provincial retention agreements, SR contract expiry returning control to an existing NPC contract, NPC renewals for SR-contracted affiliates, season-specific availability commitments and tailored calendar windows. Migrate current ownership without losing registrations or career stats.
4. Richer school intake decisions: trial day, school reports, selection of intake players and head-of-youth recommendations. Keep weighted origins; avoid creating a complete school league without a gameplay need.
5. International history: actual simplified fixture appearances rather than the present sampled annual caps, reserve/XV honours separated, complete nationality-labelled profiles.
6. Broader development calibration: multi-seed long careers using actual AI opportunity allocation; report minutes distributions and unmet potential by position. Tune selection opportunities before making further global growth increases.

Preserve the current UI and match engine; next work should deepen decisions and repair remaining interaction gaps rather than replace the career again.
