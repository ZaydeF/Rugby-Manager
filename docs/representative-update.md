# Representative rugby, player identity and career balance — update 0.5

## Later rule change: franchise fallback

At the manager’s request, missing national eligibility now uses the current franchise at assignment: the five NZ franchises imply NZ, Australian franchises imply Australia, and Drua implies Fiji. Missing island affiliation uses the franchise location. Confirmed national and provincial records always take priority. Fallbacks are explicitly labelled game assumptions, do not invent a first province, and persist after transfers to protect representative histories. Moana has mixed national pathways, so unknown national eligibility there still requires individual evidence; a verified NZ-eligible Moana player can use its North Island location. Existing saves receive this change once. This supersedes the strict exclusion of all unknowns described below.

## Eligibility comes first

National eligibility is independent of a player's franchise, birthplace label, surname and portrait. Real players enter the NZ pool only through an explicit, sourced record. Unknown records stay **unverified and excluded**, including after a transfer to a NZ franchise. A confirmed other-union player cannot be switched automatically. Lalakai Foketi is explicitly Australia-locked despite his Chiefs contract and NZ birth ([Chiefs profile](https://chiefs.co.nz/player/lalakai-foketi-2/)). Overseas-born genuine NZ internationals such as Fabian Holland and Folau Fakatava remain eligible.

The register is deliberately conservative, not a complete biography database for all 454 real players. Verified national eligibility can coexist with an unverified island. The profile exposes both sources. Evidence-backed manual career corrections are labelled and cannot rewrite a player already recorded in representative history. No automated residency accumulation, nationality changes, eligibility appeals or exceptional dispensations are simulated.

World Rugby's [Regulation 8](https://www.world.rugby/organisation/governance/regulations/reg-8?lang=en) and NZR's domestic selection policy are separate. The game requires a verified NZ record **and** an active senior contract at a NZ-based franchise, including Moana Pasifika where the individual is NZ-eligible. A move to an Australian club does not change nationality but removes national selection availability under this simplified domestic-contract rule. It does not implement the complete legal contract framework or all exemptions. The publicly inspected [2025 collective agreement](https://www.nzrpa.co.nz/asset/850/RPC%20-%20NZR%20-%20Collective%20Agreement%202025.pdf) provides the documented baseline; [a 2026–28 agreement has since been announced](https://www.nzrpa.co.nz/new-zealand-rugby-and-new-zealand-rugby-players-association-announce-new-collective-agreement-from-2026-to-2028), so the baseline is not represented as a full current-policy implementation.

North/South follows the **first professional provincial team**, based on the [NZR 2020 selection criteria](https://www.sporty.co.nz/aru/newsarticle/92402?newsfeedId=972103), not current club, current province or birthplace. For example, Folau Fakatava's first province is Hawke's Bay and Oli Mathis's is Waikato: both are North players. The annual three-match format is fictional; it is not presented as NZR's real schedule. Fictional prospects receive an explicit national background and first provincial pathway. That is game backstory, not an invented real NPC appearance. Transfers never change it.

## Representative season

The Super Rugby final is followed by a three-game North–South series, then a 34-player All Blacks announcement, then the annual development review and transfer window. Both island teams are AI coached. All three matches are played even after a 2–0 lead, using the existing match engine. Matches can be watched, paused, advanced by phase, instantly finished, and resumed from a save. Their stats and reports remain separate from Super Rugby.

The game uses position-valid matchday 23s. Injured players and those below 55 fitness are excluded. A recovery week passes between games; up to six additional recovery weeks are available for shortages. If verified fit positional cover is still insufficient, the programme may be explicitly curtailed. No guessed-eligible replacement is used and no partial national squad is silently announced.

| Selection | Ability | Form | Experience | Fit |
|---|---:|---:|---:|---:|
| North/South | 40% | 45% | 0% | 15% |
| All Blacks | 50% | 30% | 10% | 10% |

Form is relative to positional peers and shrunk toward neutral with small samples. Experience reflects senior minutes, the existing reputation prior and previous career selections. Fit combines work rate, engine, discipline, fitness and fatigue. North–South performance supplies at most a 1.5-point tie-breaking adjustment to national selection. National quotas are six props, three hookers, four locks, six loose forwards, three halfbacks, three first-fives, four centres and five outside backs.

Selection watch shows CA, minutes, season rating, status and selection score. Inbox messages cover call-ups, recalls, omissions and occasional meaningful form changes. Representative injuries, fatigue and minutes feed the offseason review; representative exposure contributes at 75% of senior weight. **Squad selection does not award a Test cap.** No Test fixtures are simulated in this update.

## Six priority ratings

These are explicit game-design judgements, not ratings published by rugby authorities. Raw match observations remain intact. Assessed attributes are reconciled to the reviewed ability; unassessed attributes remain null. Existing careers receive the baseline adjustment once, preserving already-earned development and historical match results.

| Player | Starting CA | Potential ceiling |
|---|---:|---:|
| Tupou Vaa'i | 90 | 94 |
| Scott Barrett | 90 | 92 |
| Ngani Laumape | 80 | 81 |
| Dylan Pledger | 73 | 94 |
| Folau Fakatava | 77 | 83 |
| Oli Mathis | 70 | 92 |

Potential is not guaranteed growth. The profile keeps its scouting estimate rather than revealing a precise hidden ceiling. Pledger and Mathis have international upside without being rated as established elite internationals today. Fakatava's former All Blacks status is recognised without restoring him automatically to elite CA. Laumape's ability review does not invent a current national-team commitment. Supporting biographical links and rating rationales are retained with the curated records. Earlier Will Jordan and Fabian Holland reviews are preserved.

## Transfers and assistant

- Submitting an offer closes only its composer. It does not navigate to the inbox, reload the page or reset recruitment filters. Existing conversations still have an explicit Open inbox button.
- The prominent top-right **Next day** advances recruitment exactly one day and stays in the current view. League matches continue through the existing match preparation/round controls. The inbox's separate Continue to next update still stops at the next relevant reply.
- Club reputation starts from a documented game estimate, then responds to recent simulated results. Established stars demand a substantial premium to step down in reputation; competing offers also account for club standing. Lower-reputation AI clubs only very occasionally pursue those stars and must afford the premium. There is no blanket Moana ban.
- One completed club move is allowed per player per offseason window. A renewal is not a move. Competing offers close when a signing completes. The restriction survives reloads and resets when the next transfer window opens. Existing windows are migrated conservatively using completed current-year signings.
- **Ask assistant to start renewals** is explicit opt-in. It prioritises expiring players by CA, leaves active negotiations untouched and sends initial terms within available reservations, with no more than a 15% opening salary increase. It neither signs players automatically nor approves counteroffers. The inbox reports what it could start; the manager retains final control.

## New players and development

Newly generated names use a much broader pool, prefer less-used surnames and avoid duplicate full names. Existing players keep their identities, names and histories.

Normal intake ability remains largely unchanged. Approximately 0.3% of non-guest prospects use a rare ready-made elite branch: starting CA 77–81 with PA 90–96. This does not guarantee one per club or year, and does not turn every high-potential prospect into a ready-made starter. An inspected deterministic sample produced 9 such players among 4,356 prospects (0.21%).

Development occurs once each offseason. Under-21 players receive a stronger age curve and potential-headroom contribution; the yearly upper bound is +6 before 21, +5 before 23, and +3 thereafter. The maximum annual loss remains −4. Minutes, position-adjusted form, injuries, morale, development approach, focus and potential still apply. Young players with little rugby or serious injury do not receive guaranteed maximum gains. Position-specific ageing continues to drive later decline.

## Portrait pilot

Twelve unique, AI-generated adult fictional-player portraits are included. They are assigned to eligible adult user-club prospects independently of ability/potential and remain attached to the same player ID across saves, promotions and transfers. Portraits appear large in profiles and small in applicable academy/trial/inbox rows. Other generated players use a neutral no-portrait icon. The pilot does not reuse a face for another player after retirement, generate portraits at runtime, infer ethnicity or eligibility from appearance, or age faces over time. New faces beyond these twelve require a later asset batch.

## Saves and checks

Save format 5 migrates existing format 2–4 careers without resetting results, the active senior match, generated identities, contracts or development histories. Existing offseasons already underway are not replayed; representative rugby starts after their next completed season. The first upgraded save retains an account-private pre-update snapshot. Save conflict protection and the 35 MB limit remain.

Validation covered full and compact server-catalog saves, invalid Australian inclusion, cross-border transfers, fixed island identities, active-match deterministic resume, three-game completion, selection idempotence, explicit shortage handling, transfer completion limits, competing offers, assistant budget reservations, one-day advancement, youth-name/ability distributions and three consecutive full career seasons. Each of the three seasons completed three island games and a 34-player national announcement. Save sizes at review were approximately 7.3, 8.4 and 9.5 MB. Existing negotiation edge checks and mocked account-storage/backup tests also passed. No browser or hosted-runtime tests were performed.

Deferred: full international calendars, management of the All Blacks, real-world eligibility exceptions/union-switch procedures, a complete verified biography dataset, universal portraits and face ageing.
