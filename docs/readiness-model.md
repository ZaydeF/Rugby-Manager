# Fitness, sharpness and competition readiness

This is a deterministic game model, not a sports-science or medical prediction.
All constants are exposed in `lib/world/readiness.ts`. No real player ratings,
identities, eligibility or potential values are rewritten by this feature.

## Separate measures

| Measure | Meaning | Inputs |
| --- | --- | --- |
| Fitness | Physical capacity, 0–100 | Training, injury deconditioning, recovery |
| Condition | Current physical freshness | Fitness minus 0.45 × fatigue |
| Match sharpness | Rhythm and execution, 0–100 | Actual minutes at every playing level; inactivity and injury |
| Readiness | Suitability for a particular competition today | Ability, condition, sharpness, rehabilitation burden |

`effective level = ability − 0.15 × (100 − condition) − 0.11 × (100 − sharpness) − rehab penalty`

Game demand benchmarks: NPC 64, Super Rugby 74, Test rugby 84. These are tuning
points on the existing database ability scale, not measured league-strength facts.
The assessment score is clamped to 0–100: `70 + 2 × (effective level − benchmark)`.
Ready starts at 70, limited-role advice at 55. A lower assessment must never
impose a medical substitution simply because a player has less playing ability.

Injury overrides every assessment. Fitness below 65 or condition below 55 advises
rebuilding fitness before playing. Sharpness below 45 or a rehab penalty of at
least 10 gives a managed-return assessment and 25-minute ceiling. These checks
apply equally to elite internationals and developing players.

## Match exposure

Each actual appearance increases sharpness by:

`((100 − sharpness) × 0.28 + 2) × min(minutes / 80, 1) × level weight`

| Level | Weight |
| --- | --- |
| Test | 1.10 |
| Super Rugby, touring matches, All Blacks XV | 1.00 |
| NPC | 0.85 |
| U21 | 0.55 |

Appearances share one canonical player ID. A Test appearance counts for an
international's provincial sharpness; no NPC appearance prerequisite exists.
The 28-day display uses weighted minutes, while the seven-day load display uses
actual minutes. Re-recording the same match does not add exposure twice. A bounded
24-match record travels in the save; old competition ledgers remain unchanged.

## Recovery and inactivity

- Balanced training restores 12/7 fitness and removes 24/7 fatigue each healthy day.
- Conditioning restores 1.7 fitness on a return, but adds 1.2 fatigue relative to
  normal recovery. It does not accelerate match-sharpness gain.
- Recovery removes five fatigue a day, excludes the player from selection, and
  slowly allows sharpness to drift towards a lower training base of 55.
- Managed minutes imposes a 40-minute ceiling, further reduced by return advice.
- Healthy training maintains a sharpness base of 70. Above that, sharpness falls
  0.35 per day; below it, training restores only 0.2 per day. Actual matches are
  needed to move beyond the training base.
- Injury reduces fitness by 0.32/day (floor 40) and sharpness by 1/day (floor 20).
  Injury clearance still belongs to the existing `injuryWeeks` system.
- Round-driven simulation and the game's ten-week offseason recovery use the
  same daily steps, so a long injury is not erased at a season boundary.

Tracked injury days produce a rehabilitation penalty capped at 24:

`min(24, injured days × 0.28) × max(0, 1 − healthy return days / 35 − return minutes / 240)`

Recovery time and carefully accumulated minutes both reduce that burden. The
remaining physical and sharpness gates still apply after the penalty reaches zero.

## Consequences and compatibility

The competition assessment is coaching advice, not an availability/eligibility
check. A ready international can still be unavailable on national duty. A
Recovery plan, injury or the existing rest rules can still block selection.

Sharpness and rehab reduce temporary match execution attributes. Assistant
selection uses a world-only readiness penalty. Advice supplies minute limits to
the existing substitution/return-to-play system; user-controlled live matches
retain their existing prompts and legal-cover constraints. No extra injury
probability is invented.

Existing careers retain their current fitness, fatigue, sharpness and active
match. Tracking starts on import: previous injury duration and appearances are
not guessed. Existing match simulations are not retroactively recalculated.
Optional state is validated and preserved in JSON backups. Legacy non-world
careers do not receive the new selection penalty.

Automated scenarios cover elite players dropping to NPC, long injury returns,
competition differences, minute-weighted exposure, representative appearances,
training limits, idempotent recovery, plan effects, temporary match penalties,
save migration and malformed save rejection.
