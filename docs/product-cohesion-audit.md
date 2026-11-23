# Product Cohesion 1.0 — pre-implementation audit

Source: feature branch HEAD a95d933, matching the current GitHub PR head.
The active route mounts WorldClient; the older Career component is not the career
entry. New-career induction and 3D playback have already been implemented.

## Findings

- WorldClient controls date progression, saves, conflicts, profile dialogs and
  departmental pages. Calendar already stops at user matches and meaningful news.
- WorkspaceNavigation exposes 14 peer destinations. Recruitment is buried behind
  Squad's local section state; staff/coaching are embedded in Development. This
  hides existing capabilities and makes navigation unpredictable.
- Home repeats four metric cards, three columns of panels, a week panel, a full
  table and selection-decision cards. Actionable business is below passive data.
- The stylesheet stack includes world.css, career-pulse.css, world-refresh.css,
  match styles and global legacy styles. Old purple/gradient declarations remain
  underneath newer charcoal overrides. There are no single authoritative semantic
  tokens shared across the active career and setup.
- Player profiles already have detailed sections/tabs, condition, readiness,
  contract, development and history. Selection already supports broad position
  warnings, drag/drop and a position-valid 23. Preserve these controls.
- ManagementConsole and ManagerInbox implement scouting/shortlist/negotiation and
  renewal logic; provincial contracts are separate registrations on canonical
  player IDs. Reuse them rather than writing a second market.
- Existing coaching has three real generated roles, player development focuses,
  and round exposure. Readiness has date-guarded recovery/conditioning and shared
  representative/NPC minutes. No second sharpness equation is needed.
- Pulse owns leadership, board objectives, stories, history and season reviews.
  Match Intelligence owns recorded opposition analysis. Weekly presentation should
  link to those sources, never invent an opponent's unannounced 23 or training form.
- Live match already pauses at decisions, injuries, halftime and reviews. It has
  a 3D view, legacy analytical 2D view and expandable team sheets. Preserve 3D and
  manager control rather than reverting this recently requested feature.
- Current world saves are envelope v6 with independently versioned optional
  subsystems. Missing weekly state should be added without consuming RNG or
  rewriting a match already in progress.
- Published reports disagree: the older 3,000-match world report averages 62.94
  points/16.74 penalties, while Match Intelligence's later SR sample averages
  73.30/22.41. A fresh sample on the active prepare path is required.
- Existing calibration scripts include development-only projections. These are
  not equivalent to 10 complete world careers for 10 seasons. The new study must
  distinguish actual world advances from synthetic player development.

## Implementation order and checks

1. Shared neutral/club/semantic tokens, restrained geometry and reusable rows,
   page headings, section navigation, staff messages and action queues.
2. Six primary departments with direct secondary routes for existing capabilities.
3. Action-first Home, one fixture block, chronological business and compact context.
4. Squad-first table and consistent profile/selection/market/development surfaces.
5. Date-guarded weekly reports/preparation using existing readiness/intelligence.
6. Stable match/halftime/post-match presentation retaining 3D and all controls.
7. Fresh balanced match/tactics distributions, then evidence-led engine tuning.
8. Long world simulation, regression suite and browser checks. Record unsupported
   viewport/test infrastructure honestly; do not call an unverified gate complete.
