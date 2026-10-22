# Phase 1 — Player identity & scouting

Released 8 September 2026. Super Rugby development pack 1.1.0.

## Recorded birthdates

All 450 retained real players now have recorded dates of birth. Imported 428 ID-matched records from the supplied completed research, alongside 22 existing dates. The five conflicting recorded dates were explicitly accepted by the user:

| Player | ID | Accepted date |
|---|---|---|
| Jordan Lay | 3 | 1992-11-05 |
| Jake Te Hiwi | 182 | 2002-01-02 |
| Seru Uru | 242 | 1997-01-03 |
| Joshua Smith | 313 | 2004-06-11 |
| Abraham Pole | 383 | 1998-06-28 |

Source URLs, evidence notes, source quality and conflict status remain attached to the imported records. Acceptance does not turn a secondary source into a primary source. Profiles show that distinction. The import does not establish nationality or international eligibility.

Dates fill missing career fields; existing editor corrections and historical development remain intact. Future annual reviews use the existing age, position, minutes, form, injury and potential-headroom curves. Young players can develop faster; older players decline and enter retirement planning.

Dan Nelson, Hamish Muller, Sairusi Ravudi and the Moana Halfback placeholder are excluded from active careers. Their source IDs remain as archival records so old matches and saves can still load. Existing academy players provide cover where removal would leave insufficient depth. An active match is allowed to finish before exclusions apply.

## Scouting and uncertainty

- A new Scouting screen supports search, position filters, shortlists and report review, with links to full player profiles.
- Up to five assignments run at once. A report takes two simulated weeks: two rounds in season or fourteen transfer-window days.
- Repeat observation improves confidence. Cancelling a refresh preserves the previous completed report. Reports older than twelve simulated weeks become less reliable.
- Standard careers show current-ability stars, potential ranges and observed attribute ranges. Own players receive daily observation; trial players benefit from trial evidence. Stars use a consistent league scale.
- Exact CA, PA and development calculations remain available in developer mode. Estimates never change the underlying player or match-engine inputs.
- Scout reports arrive in the inbox and open Scouting. Issuing an assignment does not navigate away from the current screen.

The recruitment team is fixed for now; staff hiring and staff-specific scouting quality belong to a later phase. Ratings retain the existing curated corrections and legacy statistical inputs. This release does not claim a complete real-world attribute rebuild or commercial licensing clearance.

## Verification

- Focused tests: all recorded dates, five accepted conflicts, exclusions, positional cover, legacy migration, active-match preservation, scouting timing, limits, refresh/cancel, save/resume, hidden-rating presentation, age curves and retirement notices.
- Existing foundation, preparation, representative and squad/save regression suites passed. Save storage tests use a mocked R2 adapter; no live browser save test was performed.
- Five-season simulation, seed 75: all five seasons passed save validation, migration stability, wage-cap, squad-depth, single-transfer and annual-development checks. Final decoded save: 11.91 MB; gzip: 1.38 MB. See phase1-longevity.json.
- TypeScript and release build checked before publishing.

The earlier Phase 0 twenty-season test exceeded the 35 MB decoded-save limit. Long-career archival work remains open; this five-season run does not certify twenty-season saving or final gameplay balance.
