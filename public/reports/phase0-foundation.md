# Phase 0 — database and career foundations

The existing Super Rugby game remains the development pack. Match coefficients, ratings and the normal playing interface have not been recalibrated.

## Database & diagnostics

Open the new sidebar entry. Standard mode is the default. Developer mode exposes current/potential ability, headroom, the last annual development factors, an actual attack-skill input breakdown and read-only match coefficients. This switch is saved with the career. It is not a security boundary or the later scouting system.

The audit distinguishes verified real-player birth dates from missing dates. Generated players already have dates. Unknown dates are not replaced by estimates.

The editor changes real-player CA, PA and sourced birth dates in this career only. Choose a player, explain the correction, preview the changes, then download a backup and apply. The career is permanently labelled edited. Attributes are reconciled using the existing positional weighting; contracts, historical results and eligibility are unchanged.

JSON patches support up to 500 corrections. They require the exact pack version and previous CA/PA/date values, reject duplicate or generated-player IDs, require PA >= CA, reject impossible dates and require an HTTPS evidence link for a newly supplied birth date. A link is evidence provenance, not automatic verification of its contents. Changes are applied atomically only if the resulting career passes full save validation. Finish active matches before editing.

Complete database imports have a read-only structural preflight. Passing does not install another competition. Exported corrections are career patches, not a commercial mod pack.

## Pack boundary and compatibility

The manifest is data/packs/super-rugby/manifest.json. It names the adapter, data version, model, engine, competition shape, source bindings, finance configuration, eligibility data and optional future assets. Simulation coefficients, finances and representative reference data now live under the pack directory, with compatibility exports for existing consumers. The browser loads its universe through the manifest binding.

New careers pin a versioned pack dependency. Legacy saves migrate idempotently; existing results, active match random state, contracts and generated players remain intact. Unsupported pack or foundation versions are rejected instead of guessed. Keep old pack versions available and write explicit migrations before changing these dependencies. Do not silently reuse a released pack version for changed simulation inputs.

Only the existing 11-club / 16-round adapter is supported. A generic league scheduler, fictional commercial pack, staff database, licensed artwork and pack installation/selection are later work. Source ratings still contain legacy statistical proxies; Phase 0 does not pretend otherwise.

## Tests

Run from the project root with Node 22+ supporting TypeScript stripping:

- node --experimental-strip-types scripts/test_foundation.ts
- node --experimental-strip-types scripts/validate_database.ts [candidate.json]
- node --experimental-strip-types scripts/test_longevity.ts 20 75
- node --experimental-strip-types scripts/test_squad_update.ts
- node --experimental-strip-types scripts/test_preparation.ts
- node --experimental-strip-types scripts/test_representative_update.ts

The longevity runner exercises actual regular seasons, finals, representative selection, development, intakes and transfer windows. It checks full and compact server save validators, idempotent migration, positional depth, squad limits, wage caps, unique-player window signings and the 35 MB decoded save limit. It records population, elite counts, cash, payroll, elapsed time and compressed/uncompressed save sizes. One 20-year run provides 5/10/20 checkpoints; this is not an exhaustive multi-seed balance proof.

User-club contracts and intake are automated for the test; incoming offers are rejected. Representative recovery/shortage handling is explicit. The test writes its outcome and any failure to phase0-longevity.json.

The first long run exposed academy promotions not being registered against the one-signing-per-window rule. Promotions now register the senior contract and cannot be immediately followed by a second signing elsewhere that window. Existing offseason saves acquire the missing signing records on migration.

## Remaining gate

Observed seed-75 result: 5- and 10-season checkpoints passed; all structural checks passed through 19 seasons. The end-of-year-20 save exceeded the existing 35 MB decoded account-save limit. Year 19 measured 33.79 MB decoded / 2.93 MB gzip. No storage limit was increased and no career history was deleted to conceal this result. Long-career archival/serialization work is still open before claiming a supported 20-season career.

Missing real-player ages block a trustworthy long-term retirement and population-balance sign-off. Structural longevity success does not mean the database is realistic. Researching dates, reviewing ratings and replacing legacy proxy inputs remain the next phase. No live user career is used by the automated tests.
