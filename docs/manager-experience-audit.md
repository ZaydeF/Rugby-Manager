# Rugby Manager: what the manager actually controls

Audit of draft PR #1, commit `62439cd`. Main was `2ac1d7b` when checked. The proposed FM27-inspired Rugby Week was a design, not a shipped update. No gameplay was modified in this audit.

**Verdict:** The simulation has considerable depth, but it asks the manager to keep several independent systems in sync. A selection can be legal, the tactic can look configured, and the combination can still be unable to execute. The best next release is to make the named 23, their jobs, the staff plan and the match report agree.

## Evidence and limits

On a fresh checkout, the production build completed and all 129 automated tests passed without skips. The audit traced the current calendar, catalog, selection, match, development, scouting, office, board and inbox code, and reviewed the committed balance and season studies. No new browser usability session, hosted save test, multi-year sustainability study, or independent comparison to real match data was performed. Earlier desktop checks do not establish narrow-screen usability.

**New controlled experiment:** Used four opening-fixture seeds (173, 271, 397, 557) each for Highlanders, Drua, Moana Pasifika, Queensland Reds and Otago. Preset two distributors, played through halftime, made a legal positional substitution for the first distributor, then cloned the same match including random state. Kept that assignment in one branch and explicitly transferred it to the replacement through the game's live role setter in the other. The manager's automatic tactical replacements and halftime advice were disabled in this watched-mode diagnostic. The outcomes are second-half named calls, not points scored:

| Club | Leave assignment | Transfer assignment |
| --- | ---: | ---: |
| Highlanders | 0 | 19 |
| Fijian Drua | 0 | 20 |
| Moana Pasifika | 0 | 15 |
| Queensland Reds | 0 | 11 |
| Otago | 0 | 17 |

Across 20 pairs, handover restored at least one call in 18 and produced 82 in total. Two still had none. This identifies one mechanism. It does not attribute all 150 silent matches in the earlier 504-game regular-season sample to substitutions. Reproduce with `node scripts/audit-role-handover.mjs`; outputs are in [audit-role-handover.json](audit-role-handover.json).

## Department findings

| Area | What works now | What to address |
| --- | --- | --- |
| World and database | 812 distinct canonical player IDs; 11 SR and 14 NPC clubs; independent registrations preserve a player's identity and history. | 718 DOB fields are populated, including 141 labelled synthetic. Separate evidence, estimated age and simulated biography in profiles. Do not equate populated DOB with verified DOB. |
| Tactics and opposition | Personnel, field zone, fatigue, opponent width and repeated split calls affect execution. The previous Drua recovery arms won 54.9% of gain lines on carry-first launches versus 23.4% under the split plan. Both reached playoffs three times in six. | The two shapes are judged by a convenient common measure: the displayed gain-line win is a retained carry of at least three metres. Show line breaks, possession losses, metres and subsequent opportunities as well. Carry first does not incur the same explicit repeated-look penalty as split. Test that asymmetry before changing it. |
| Training and staff | Staff wages, coaching capacity, project slots, fatigue, scouting accuracy and six delegated responsibilities exist. | A named rehearsal is keyed to this fixture, this shape and these players. The assistant's session logic can leave capacity unused after an unavailable rehearsal. Offer a plan with a fallback and an explanation of what was sacrificed. Never silently override a manager's protected session. |
| Selection and medical | Injury, freshness, sharpness and level-specific readiness are distinct; minute limits reach matchday and substitution logic. | Show legal position, tactical job and return limit together. Warn about missing legal cover *before* kickoff; show whether a limit was honoured or no safe replacement existed. A low rating at Test level alone must not be treated as an injury. |
| Matchday, quick sim and 3D | The match engine decides outcomes; playback illustrates them. Full delegation, legal substitutions, interventions and before/after stats exist. | Reassign or drop the outgoing player's jobs as part of the substitution. Use the same policy for quick sim. Separate the evidence for an intervention from a claim it caused a score. Where there is no positional tracking, don't invent a heat map. |
| Academy and pathways | Actual exposure, protected ownership, NPC and club development pathways, coaching and promotion routes exist. In the Drua study, 12/12 funded comparisons produced more growth, averaging +0.58 internal ability units, despite 23 fewer development minutes on average. | Judge an investment by its bottleneck: specialist coaching, quality of competition, senior selection or no route into this club. Evaluate first senior starts, sustained minutes, retention and displaced teammates over three years. Avoid increasing every youngster's growth rate. |
| Recruitment and contracts | Fees, salaries, reserved budgets, offers, scouting uncertainty and optional role briefs give recruitment consequences. | The assistant commissions scouting by sorting outsiders on underlying overall. This bypasses the uncertainty presented to the human. Use known evidence, affordability, playing pathway and scout knowledge for discovery; reserve hidden ability for evaluation tests. Compare signing a backup, retraining one and promoting one before opening a negotiation. |
| Dynamics, finances and board | Playing-time promises, captaincy, budgets, wages and board reviews give the career continuity. | The SR board youth target uses games played divided by 16, although the club plays 14 regular fixtures. That makes final regular-season progress 87.5% and understates the prorated target. Use scheduled club fixtures. Check objectives against injuries, representative duty and signed promises. |
| Inbox and navigation | Search, task/unread/report filters, sender, match comparisons and direct links already exist. | The inbox keeps selected message, filter and query in component state. Department navigation unmounts it. Its Continue button advances a day, while the top-level control redirects a due fixture to Matchday. Share the navigation policy and preserve the originating message. Put decision, deadline, evidence and owner together. |
| Balance, saves and release | Regression coverage and season/save checks are strong. Stable IDs and optional save extensions are valuable assets. | 78/504 regular-season outcomes in the two-club study had margins of 28+. The earlier equal-team home modifier study moved home wins from 46.2% to 60.2%. Neither is league-wide validation. Keep competitiveness, venue calibration, long-term finances and narrow-screen usability as separate release gates. |

## Recommended release: The Matchday 23

1. **Give each job a succession rule.** Start with first distributor, second distributor and hard-line runner. Choose an explicit backup or a legal positional successor. Offer “inherit”, “change call” and “leave vacant”; show the consequence before accepting. A positional replacement must *not* inherit a job the manager has explicitly assigned elsewhere. Save the decision with its fixture and minute.
2. **Make training reflect that selection.** The coach can rehearse starters, a replacement combination, or recommend recovery. A returning player has a minute limit, cover plan and next review. If the academy player is that cover, the manager sees the development opportunity and the senior risk in one place. Keep permanent learning separate from this week's rehearsal.
3. **Count the opportunities, not just successful events.** Start at the throw and record a mutually exclusive disposition: lost, non-launch choice, no viable launch in context, personnel unavailable, interruption or named launch. Record fallback and outcome separately. Close the ledger at the end of the possession or match, label older fixtures “not recorded”, and do not guess why a play failed.
4. **Bring the decision back to the inbox.** One report: what was planned, when it changed, how many opportunities remained and what happened. If the job was uncovered, open that exact role on the tactics board; Back returns to that exact report. Expand the same pattern to exits, then edge defence, after the lineout loop works.

## Release gates

- Replay these 20 halftime pairs with explicit inheritance, explicit vacancy and manual overrides; preserve legal substitutions and deterministic save/load. There need not be a launch when there was no opportunity.
- Compare the decision and event ledger across watched matches, highlights and delegated matches under identical inputs. Quick sim must complete without an unsolicited prompt. Exercise forced injury, card, empty bench and pending penalty.
- Reuse the previous six season seeds. Add a control with no named tactic, and test adaptive versus fixed roles. Report role coverage, opportunity conversion, field zone, changes in error rate and score margins. A feature should survive this test without increasing wins by fiat.
- Run a three-season prospect comparison across NZ, Australia, Fiji, Moana and an NPC union. Record role-specific senior minutes, starts and retention, missed promises, squad viability, budgets and availability, not just internal ability gains.
- On desktop and a narrow viewport, complete the loop without searching for the player twice: inbox → select cover → rehearse → substitute → match review → back. Test an older career, reload mid-match, and check that no hidden ability or potential leaks into the manager UI.

Decision: keep the review branch in draft until the handover, evidence, usability and balance gates have distinct outcomes. A larger staff directory, another landing screen or higher-fidelity stadium is a lower priority than this week working end to end.
