# 3D match playback

The match screen now opens in **3D stadium** mode. Start a watched match using
**Play match**, then **Play**. Use the Match view selector to switch between the
stadium and the existing 2D territory display. Commentary-only viewing remains
available in Highlights.

## Controls

- Broadcast, Tactical and End-on cameras; drag the pitch to orbit.
- Plus/minus buttons to zoom; Reset camera restores the selected preset.
- With the pitch focused, arrow keys rotate, +/- zoom and 0 resets.
- Player numbers can be toggled. Clicking a player pauses and opens his profile.
- Focus view enlarges the stadium. Low graphics reduces rendering cost.
- Show team sheets & match analysis exposes existing lineups, live statistics,
  commentary and substitution controls. The replacement bench remains available.

## Match behaviour

The existing phase engine continues to decide events, scores, injuries, cards and
substitutions. Each live passage supplies a read-only start/end snapshot to the
renderer, using the same preview already used to advance the displayed clock.
3D frames cannot consume match RNG or change the save. Rendering stops while
paused and when a decision is required. The presentation is reconstructed after
loading an active match, without adding fields to saved matches.

The scene animates carrying, passing, tackles, try grounding, aerial kicks,
goal-kick attempts, scrums and lineouts. Active canonical player identities and
shirt numbers follow the current lineup. Sent-off, injured and sin-binned players
are excluded; eligible replacements appear automatically. Teams switch visual
attacking direction after half-time.

This is a first stylised 3D presentation of the phase engine. That engine records
territory and discrete events, not exact lateral coordinates, every pass, or
physical collisions. Supporting movement and formations are deterministic visual
choreography. Do not treat them as new tracking data or as a separate physics
simulation. Only an explicitly recorded actor receives the ball-carrier label.

## Rendering and compatibility

The pitch, stadium, goalposts, player models and ball are real three-dimensional
geometry with perspective projection and lighting. The default renderer uses
WebGL with depth testing. If WebGL is unavailable, a Canvas-based compatibility
renderer projects and shades the same geometry in software. Unsupported canvas
devices receive a working switch to the 2D view. Graphics-context failure pauses
playback and preserves the existing match.

Rendering is capped at 30 fps with a capped pixel ratio; software mode uses 18 fps.
Hidden tabs and unchanged paused scenes do not draw continuously. Buffers,
observers and animation callbacks are released when leaving the view. The renderer
loads only when the stadium is opened. No new packages, models, textures, remote
assets, server endpoints or database migrations are required.

## Verification

Tests cover immutable/deterministic frames, finite pitch coordinates, scoring
direction in both halves, kick trajectories, set-piece formations, cards,
substitutions, projection math, and identical complete matches with/without
drawing frames. Existing playback and save/load tests cover decision pauses,
clock handling, highlight skips and active-match compatibility.

The browser preview was tested using the software compatibility renderer because
the managed browser did not expose WebGL. The GPU rendering path builds and type
checks, but could not be exercised in that browser.
