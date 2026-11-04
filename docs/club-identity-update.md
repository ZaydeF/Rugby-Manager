# Club Building & Tactical Identity — update report

This update makes the game carry a management decision through from the tactics board to training, team selection and the next match report. It is on the review branch.

- **Tactics:** Choose a carry-first or two-distributor lineout launch. Name the distributors, hard-line runner, kick-chase leader and backfield cover. The match engine uses the players on the field; missing players can force a simpler play. Defences can recognise repeated looks. Live changes apply for the rest of that match.
- **Staff:** Coaching time is shared. Use a slot to rehearse the launch, recover your XV or coach a prospect. The coaches you employ affect rehearsal, and the assistant can use one slot if you leave the week empty.
- **Development:** Pay for one of two development places. Choose a senior or, where eligible, a Development XV route. Coaching and real minutes at that level build the project; repeated missed opportunities can hurt morale. The place costs $6,000 in Super Rugby or $1,800 in NPC.
- **Recruitment:** Send a tactical role brief from Tactics to Recruitment. Scouting evidence determines what role fit you can see, and the brief shows where a prospect already competes for that position.
- **Inbox:** A compact list sits alongside the selected report. Match analysis shows lineouts, named launch outcomes, territory, penalties and recent comparisons. Routine debut stories and duplicate score notices no longer crowd the inbox.

## Four weeks from the same starting save

The [full-season follow-up](club-season-comparison.md) compares the tactical and academy decisions separately across multiple starting seeds.

Each comparison uses the same starting save and seed (173), with four fixtures per branch. The Highlanders comparison isolates the tactical change. The Drua comparison changes both tactics and how staff time is spent, so it illustrates the combined trade-off.

| Club and plan | Named launches | Gain-line wins | Possessions lost on launch | Record |
| --- | ---: | ---: | ---: | --- |
| Highlanders · Carry first | 21 | 4 | 2 | 1W, 1D, 2L |
| Highlanders · Two distributors | 21 | 3 | 1 | 2W, 0D, 2L |
| Drua · Carry first + XV recovery | 30 | 16 | 3 | 2W, 0D, 2L |
| Drua · Two distributors + academy | 23 | 8 | 1 | 2W, 0D, 2L |

The Drua spent $6,000 and redirected four recovery slots into coaching Eroni Vakaloloma, a fictional intake player. He logged 260 Development XV minutes. That branch also lost 14–71 to the Blues. Neither the loss nor the win totals establishes the effect of one decision in isolation. The Highlanders had two fixtures per branch with no named launch, so substitution coverage and a wider set of starting situations are useful next targets.

See [the fixture and development data](club-identity-evidence.json). To reproduce after a production build:

```sh
node scripts/check-club-identity.mjs 1 173
node scripts/check-club-identity.mjs 5 173
```

## Verification and next step

The production build and automated suite cover the new match actions, staff limits, save reloads, eligible youth minutes and rendered screens. A browser playthrough created a Highlanders save, configured roles, spent a rehearsal slot, delegated a match and opened its analysis. The report showed 13/14 lineouts won, 10 split launches, 2/10 gain-line wins and eight repeated looks.

Next, I would extend the same decision loop to exits and defensive shape, then run more fixtures to calibrate repeated reads and outlier scores. That work should use the same visible link between the decision and the evidence in the inbox.
