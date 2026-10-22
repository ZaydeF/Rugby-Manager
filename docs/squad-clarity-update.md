# Squad clarity and career rewards

## Delivered

- Immediate releases deactivate the releasing club's competition registration, remove selection/kicker/preferred-XV/playing-time instructions, close affected talks and deduct compensation together. SR release preserves a live NPC agreement; NPC release preserves a separate SR contract. Funds and active-match restrictions remain. Positional shortages are a planning concern, not a hidden veto after confirmation.
- Single and bulk actions cover main contracts and provincial retainers. Separate release-at-expiry instructions keep the player registered until expiry. Provincial retainers have explicit immediate release controls and assistant renewal support, including selected batches.
- Import repairs old ghost registrations only when explicit release records contradict active membership, leaving later re-signings intact. Skills, potential, milestones and career stats are not reset.
- Current ability uses the approved common five-point CA bands: 90+ = 5, 85–89 = 4.5, 80–84 = 4, continuing to 50–54 = 1 and below 50 = 0.5. Form, injury, scouting error and club benchmark do not change world-career CA stars. Potential retains an uncertain assessment; hidden save PA is not exposed. Shared text and graphical ratings use the same mapping.
- All Blacks XV receives a dedicated announcement with position groups, your players, first/repeat selections, NPC exposure, selection reasons, omissions/promotions and camp dates. New announcements snapshot their evidence. Dismissal persists and the same event can be reopened from representative history. Existing older XV squads are replayable from their retained records without automatically opening an old announcement.
- Player development reports combine recorded annual CA changes, individual attribute deltas, competition-separated minutes/ratings, observed factors and an actionable next step. Checkpoint minutes are not summed: the report uses competition ledgers to avoid double counting.
- Squad planning brings expiring main/NPC contracts, planned departures, retained positional gaps and assistant renewal actions into the existing Squad view. It starts collapsed during the playing season and opens during offseason. Development reports link back to playing plans.
- Season review surfaces results, player improvement, representative honours and Shield highlights, with profile links and a squad-planning action. Available from Club/Union and the offseason Home dashboard.

## Verification

27 focused tests passed across canonical data, saves/migration, released players, split agreements, stars, XV event persistence, reports, AI/youth systems and component rendering. TypeScript and production build passed. This update does not alter match probability or the development formula, so the previous ten-season calibration was retained rather than repeated. No production save was replaced for testing. No browser UI testing was requested/performed.

## Limits

Historical XV squads created before this release do not contain a frozen selection report. Their replay uses retained season stats; missing historical affiliation is not invented. Next-step advice describes observable exposure, current readiness and recorded injury/development effects; it does not claim to explain every hidden development roll.
