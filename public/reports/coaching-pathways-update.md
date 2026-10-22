# Coaching & Player Pathways

## Playing the update

Open Development for the unified development plans and coaching staff tabs. Eligible real and generated players share U21 selection. You can also edit an existing senior player's development plan from their profile.

Each plan combines a recorded position, compatible intended tactical job, individual focus, senior and U21 minutes targets, and pathway priority. The assistant can manage focus and pathway each round while retaining your job and targets. Matchday jobs remain editable independently. Explicit next-match instructions override pathway preferences; injury and positional-cover constraints still apply.

## Coaching staff

Three fictional appointments per club: forwards coach, backs/skills coach and Head of Youth Development. Coaches have coaching, youth-development, judging and recruitment ratings plus a playing preference. Forwards/backs workload is limited by capacity. Every club starts with reasonable staff and uses the same wage and development rules.

Compare three deterministic candidates per role each season. Appointing a replacement costs one month's salary from club cash; each role may change once per season. Annual staff wages are paid in 19 preparation-round instalments, separately from the player wage cap. Live transfer fees remain reserved. Insufficient funding suspends specialist support rather than creating negative cash. Spending is shown on the staff page and the budget controls identify the separate staff commitment.

Recruitment briefs: best talent, one priority position, or a playing style. The season's recorded work influences the next intake. A sustained position priority shifts one of the 24 trial places, preserving positional cover. Style shifts assessed attributes within existing overall ability. Recruitment knowledge gives a small, capped shift to the talent found; exceptional prospects remain rare. AI retention uses an uncertain assessment rather than perfect potential knowledge. National and island eligibility are never changed by these instructions.

## Training and development

Preparation records each player's available, injured and reduced-load rounds, focus exposure and actual funded coaching support. It does not invent earlier training when an old save is upgraded. An active or already-prepared round is skipped during migration. Data is aggregated per season to keep saves compact.

Permanent attribute changes remain once per offseason. Actual focus exposure determines the distribution of changes, so a final-day focus change has no retroactive effect. Coaching adds at most 0.5 ability within the existing overall annual bounds, and is recorded as work happens, preventing last-day hiring bonuses. Existing age, potential, form, injury, morale and decline factors remain.

U21 development exposure varies from 30% to 75% of senior minutes according to current ability and age, with diminishing value for players who have outgrown that level. U21 match ratings are no longer treated as directly comparable to senior positional form. This is a game-balance rule, not a claim of an empirically precise development formula.

## Youth eligibility and reviews

Under 21 on 1 July of the season year. Current club membership, injury and fatigue govern availability for real and generated players alike. Senior appearances exclude a player from the same round's U21 game. Unverified ages do not receive invented eligibility. Positional shortages can still use labelled guest players.

U21 teams follow the manager's rugby shape and compatible intended jobs. Readiness reports compare assessed senior depth, match evidence and freshness, without revealing actual potential. Reviews at rounds 4, 8, 11 (youth season end), 12 and 16 identify rest, opportunity and senior trial decisions. Development-plan links and next-match bench/rest requests keep the user on their current screen.

## Validation

- Targeted checks: legacy migration, real-player U21 inclusion, injured/rest exclusions, no double appearances, assistant priorities and explicit overrides, focus-history persistence, repeat-call idempotence, annual bounds, staff costs, intake balance and unchanged NZ/Australian eligibility.
- Rendered interface checks: real-player pathway entries, graphical stars, all three staff appointments, recruitment brief and budget disclosures.
- Existing bidirectional selection and opponent-star regression checks pass.
- Three-season structural run: saved careers accepted by full and server databases, stable reloads, annual review applied once, clubs retain legal positional cover and remain within player payroll limits. Population above 90 ability: 12, 15, 17 across the three reviews. This is a short balance observation, not a guarantee about long careers. The known 35 MB decoded-save limit is unchanged.

## Browser checks

In a disposable local-preview career, a real U21 player’s pathway was changed successfully, the staff comparison and Head of Youth Development appointment completed, and the appointment expense appeared correctly. Opponent stars rendered graphically. Mouse grip dragging between starting positions and back, plus undo, were verified after fixing mouse pointer support and reserving toolbar/status space so drop targets do not move during a drag. Touch uses the same pointer interaction, but physical touch-device testing remains outstanding. The preview had no account sign-in; account persistence was validated through save-schema and migration tests rather than a live authenticated browser save.
