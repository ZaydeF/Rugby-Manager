# Matchday 3.0 — 20 September 2026

## Implemented
- Play/pause with a smooth clock, 1×/2×/4× speeds, full/extended/key/commentary presentation and deterministic jump-to-highlight. Presentation previews one engine phase without committing its RNG/state until the clock reaches it.
- Automatic decision stops for configured penalties, injuries, return-to-play limits, cards, halftime, optional 60-minute review and extra time. Penalty choice resumes running playback. Background tabs pause. A reopened match starts paused.
- Match screen with fixed scoreboard, team-coloured jerseys, approximate ball position, explicitly schematic player markers, possession/territory and core stats, event feed, both XVs, bench and full report. Focus view hides surrounding career navigation. Touchline drawer contains existing tactical controls and diagnosis.
- Click either field player or reserve first, then the other to propose a substitution; bidirectional drag/drop does the same. Confirmation shows positional cover, freshness and recorded attributes. Field-to-field swaps require both positions to be coverable. Names open existing player profiles.
- 4–4, 5–3, 6–2 and 7–1 benches; changing the split preserves the XV and retains suitable bench members before filling gaps. Every split protects hooker and two prop reserves. Assistant selection and last-lineup restoration honour the selected split. AI selects 5–3 or 6–2 based on available forward depth.
- Wing/centre and lock/back-row cover permitted with modest execution penalties. Other backline cover is emergency use, especially 9/10. Physical attributes and career CA remain unchanged. Penalties are applied through skills. Front row remains specialist-only.
- Original shirt numbers persist after substitutions in new matches. Generic colour palettes for all 25 teams, with away contrast when needed, used in live view, selection and match preview.
- Simplified uncontested scrum retention when qualified front row is unavailable; no scrum shove advantage or scrum penalty generated from that restart.
- Periodic save attempts during playback supplement the existing debounced save; account revision protection remains unchanged.

## Compatibility
Career version remains 6. Optional benchSplit, live playback controls, playingPosition and shirtNumber fields are validated and round-trip through existing migration. Missing benchSplit means 5–3; old active players without playingPosition do not acquire a new positional penalty. No canonical player ratings, PA or affiliations are overwritten.

## Validation
28 targeted tests passed: matchday, Match Intelligence, Career Pulse, career world and cohesion. Includes all splits in SR/NPC, injury/penalty pauses, deterministic phase versus highlight completion, halftime, 60-minute review, legacy migration, account storage readback/conflicts and existing career rollover/records. TypeScript passes. Browser checks and production build recorded in development log.

## Deliberate limits
- Pitch markers are a schematic, not spatial collision/pathfinding simulation; lateral positions are not match statistics.
- The canonical data has broad prop classifications, not verified LH/TH qualification. Both prop slots use that existing evidence. No invented specialist eligibility. Full carded-front-row temporary replacements, HIA/blood returns and elite competition-specific replacement variations remain a future rules update.
- Broad positional familiarity bands are design estimates; individual secondary-position evidence and learned familiarity remain future database work.
- Team palettes and icon jerseys express identity, not licensed kit reproductions.
- Real cloud-account saving cannot be exercised in the anonymous preview; existing server storage regression tests cover round-trips and revision conflicts.

Front-row design reference: https://passport.world.rugby/laws-of-the-game/laws-by-number/3-team/ (accessed 20 September 2026).
