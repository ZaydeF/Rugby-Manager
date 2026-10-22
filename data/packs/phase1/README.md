# Phase 1 biography import

`birthdates.json` contains the 428 unique player-ID records supplied in `research_birthdates_complete(1).csv`. Calendar dates and IDs were checked; values were not re-scraped or guessed. Retained fields: date, source URL, evidence note, quality tier, acceptance status and acceptance date. The user accepted all recorded dates on 2026-09-08, including the five flagged conflicts (3, 182, 242, 313, 383).

The installed pack merges these with the 22 pre-existing birthdates. All 450 retained real players have dates. Existing career birthdate overrides take precedence. Raw source match/identity records remain stable for save compatibility.

`roster.json` identifies the active real-player roster and the four explicit exclusions. `applyBiographies` applies exclusions at a safe point, using archived/retired markers instead of breaking historic references. Missing positional cover is filled from the existing academy.

This dataset is development research. Source quality and accepted conflicts remain visible; it is not a claim that every date was independently verified against an official biography.
