# Club Building & Tactical Identity: full-season comparison

This study extends the [four-week pilot](club-identity-update.md). It runs the same game engine from preseason through the Super Rugby final, including calendar progression, AI fixtures, injuries, squad repairs, youth fixtures, club finances and season-end development. It does not change gameplay. **36 complete season runs, 504 regular-season and 16 playoff matches involving the managed clubs, and 1,240 successful save checks.**

## Method

- **Clubs:** Highlanders and Fijian Drua. Each club starts from a fresh 2026 save for each of six seeds: 173, 271, 397, 557, 761 and 997. Every arm within a club and seed starts from a clone of the same save.
- **Tactics:** Carry first versus Two distributors, with the same named players in both arms. Attempt one rehearsal per own fixture. Default tactics, selection repair and automatic substitutions remain enabled. Roles stay fixed: this measures setting a plan and delegating games, rather than actively adapting it.
- **Coaching and academy:** Under each shape, compare the same prospect and club with and without a funded project where the opening squad supplies an eligible candidate. Allocate the second coaching slot to XV recovery or to that prospect; leave it unused when the funded prospect is unavailable. No forced selection. As in the pilot, this measures the whole investment policy, including the coaching slot it consumes.
- **Measurement:** League points and wins come from the regular-season table. Finals appearances are separate, since qualifying changes the fixture count. Gain-line and possession-loss percentages use **executed named launches** as their denominator. A blowout means a margin of at least 28 points, consistent with the [previous balance audit](product-cohesion-release.md). These are comparisons of simulated decisions, with only six starting draws per club. Individual fixtures and repeated games within a save should not be treated as independent trials.

[Per-run results](club-season-comparison.json). Reproduce the fixture-level data with Node 24 after installing dependencies:

```sh
for team in 1 5; do
  for seed in 173 271 397 557 761 997; do
    node scripts/compare-club-seasons.mjs "$team" "$seed" > "club-$team-$seed.json"
  done
done
```

## Highlanders

| Shape, with XV recovery | W–D–L | Avg. league pts | Avg. points diff. | Gain line won | Ball lost | No named launch |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Carry first | 29–2–53 | 23.7 | −99.8 | 28.3% (110/389) | 6.9% | 37/84 |
| Two distributors | 26–4–54 | 23.2 | −93.0 | 25.5% (109/428) | 7.0% | 34/84 |

Two distributors won more games in two paired seeds, fewer in two, and the same in two. The worse aggregate win total and better aggregate points differential tell different stories. Neither policy reached the playoffs. The split shape logged 321 repeated looks in 417 actual split calls. Across both arms, all 71 games with no named launch still had lineout throws. The harness did not identify which throws were viable launches or why the plan did not fire; territory, who was on the field and other match events can all prevent execution. The Highlanders starting squads did not meet this study's prospect-selection rule, so these runs compare the shapes only.

## Fijian Drua

| Shape | Second slot | W–D–L | Avg. league pts | Avg. points diff. | Playoffs | Gain line won | Ball lost | No named launch |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Carry first | XV recovery | 40–4–40 | 31.8 | -19.8 | 3/6 | 54.9% (230/419) | 6.4% | 25/84 |
| Two distributors | XV recovery | 36–5–43 | 29.8 | -31.0 | 3/6 | 23.4% (103/440) | 4.8% | 18/84 |
| Carry first | Academy | 39–6–39 | 32.0 | 1.8 | 3/6 | 50.0% (180/360) | 4.2% | 22/84 |
| Two distributors | Academy | 33–4–47 | 27.0 | -73.0 | 2/6 | 29.2% (127/435) | 6.2% | 14/84 |

Carry first won the gain line more often under both staff policies. The league results were less clear: with recovery, each shape won more games than the other in three of six seeds, and both qualified three times. With academy investment, carry first had the better aggregate record and points differential. That does not establish a general penalty for splitting the attack; these are two fixed shapes played by one set of assigned roles per save.

**Academy:** The funded prospect improved more in all 12 same-player, same-shape comparisons (six seeds, two shapes). The additional growth averaged **0.58 points on the simulation's internal ability scale**, ranging from 0.17 to 1.10. The project averaged roughly 14 coaching sessions and the club finished $6,000 lower in each pair. Funded prospects still played roughly 878–972 Development XV minutes, but averaged 23 fewer than their unfunded counterparts. The project improved development on an already viable minutes pathway; it did not create more minutes in this sample. Senior wins improved in four paired branches, tied in two and fell in six. Long-term promotion and senior impact were outside this season's test.

## What to change next

1. **Make it obvious when a tactic fails to run.** In 150 of 504 regular-season matches (29.8%), the manager's club took lineouts but executed no named launch. Show how many throws led to a viable launch, why any were skipped, and which backup players can fill a role. This would make a disappointing report actionable.
2. **Give managers a reason to mix shapes.** The fixed two-distributor call had fewer gain-line wins per launch in both clubs, and defences logged repeated looks often. Test situational calls and bench cover against the same seeds before changing the underlying bonuses.
3. **Keep score balance open.** 78 of 504 regular-season games (15.5%) were decided by at least 28 points; the biggest loss was Drua 0–70 to the Force. A single-season pairwise decision study is not a calibration of league-wide results.
