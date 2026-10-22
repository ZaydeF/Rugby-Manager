# SUPER RUGBY MANAGER

## Master Product + Build Brief — Version 1

You are the lead game designer, rugby analyst, simulation modeller and full-stack engineer responsible for building a playable rugby management simulation inspired by the best elements of Football Manager.

The game is provisionally called **Super Rugby Manager**.

This is NOT intended to be a complete Football Manager clone in Version 1.

The goal is to build a genuinely fun, replayable, credible management game using real 2026 Super Rugby player data as its starting universe, with enough depth that decisions matter and seasons generate stories.

The guiding principle is:

> **Get the simulation, player universe, tactics, squad management and season loop right first. Depth can be layered on later.**

Do not build unnecessary complexity simply because Football Manager has it.

---

# 1. CORE PLAYER FANTASY

The user becomes Head Coach / General Manager of a Super Rugby franchise.

They should feel responsible for:

- Selecting their team.
- Choosing tactics.
- Managing player form.
- Developing young players.
- Recruiting and releasing players.
- Handling injuries and fatigue.
- Deciding when to rotate.
- Managing an academy.
- Watching players improve or decline.
- Competing for the Super Rugby title.
- Trying to develop players into All Blacks.
- Watching rivals improve their own squads.
- Discovering generated future stars.
- Following the wider rugby world through news and statistics.
- Building a multi-season dynasty.

A good season should produce stories naturally:

- A youngster unexpectedly becomes a star.
- An established player loses his place.
- A tactical switch rescues the season.
- A player dominates Super Rugby and earns an All Blacks call-up.
- An injury before a semifinal changes everything.
- A fringe academy player impresses in a trial and gets signed.
- A rival steals a player you wanted.
- Your former player performs against you.
- A player has an extraordinary North v South series.
- An uncapped player forces his way into the All Blacks through Super Rugby form.

These emergent stories are more important than flashy graphics.

---

# 2. AVAILABLE REAL-WORLD DATA

I will provide the 2026 Super Rugby Fantasy historical database.

Expect the following files:

- `players.csv`
- `player_match_stats.csv`
- `player_price_history.csv`
- `player_selection_history.csv`
- `player_round_scores.csv`
- `matches.csv`
- `rounds.csv`
- `metadata.json`
- `validation_report.json`

The database contains approximately:

- 454 players
- 77 Super Rugby matches
- 16 rounds
- 3,499 player-match performance records
- 7,192 historical price observations

`players.csv` already contains each player's:

- ID
- Name
- 2026 squad
- Position
- Fantasy price
- Total points
- Average points
- Appearances
- Recent performance
- Season statistics

`player_match_stats.csv` contains match-level statistics including variables such as:

- Minutes played
- Tries
- Try assists
- Conversions
- Penalty goals
- Missed kicks
- Yellow/red cards
- Turnovers
- Interceptions
- Offloads
- Line breaks
- Line-break assists
- Metres gained
- Penalties conceded
- Lineout statistics
- Scrum statistics
- Tackles
- Missed tackles
- Errors
- Defenders beaten
- 50:22s

Use these real datasets as the foundation of the game.

Do NOT create arbitrary overall ratings before analysing what the data actually supports.

---

# 3. STARTING SQUADS

The first playable season should use the squads contained in `players.csv`.

Each player's `squad_name` represents their starting franchise.

Supported Super Rugby franchises should therefore be generated automatically from the database rather than manually hard-coded wherever possible.

Every real player should retain a stable `player_id`.

Do not duplicate players.

Players who recorded little or no playing time in 2026 should still exist in their squads.

---

# 4. PLAYER RATING SYSTEM

This is critical.

Do NOT simply convert fantasy price into player quality.

Do NOT simply rank players by total fantasy points.

Instead create a transparent, position-sensitive rugby rating model.

## 4.1 Core Attributes

For Version 1 use approximately 8 major attributes rather than Football Manager's dozens of attributes.

Recommended attributes:

### Attack

Ability to create positive attacking outcomes.

Derived from appropriate combinations of:

- Metres gained
- Defenders beaten
- Line breaks
- Tries
- Try assists
- Offloads
- Line-break assists

### Defence

Derived from:

- Tackles
- Tackle success
- Turnovers won
- Interceptions
- Missed tackles

### Work Rate

Derived from:

- Tackles
- Carries/proxy involvement where available
- Minutes
- Repeated match involvement
- Relevant high-volume actions

### Set Piece

Position dependent.

For forwards incorporate available:

- Lineouts won
- Lineout steals
- Lineout errors
- Scrum wins

Do not artificially punish backs because they do not participate in scrums or lineouts.

### Kicking

Primarily relevant to kicking players.

Derived from:

- Conversions
- Conversion misses
- Penalties
- Penalty misses
- Drop goals
- 50:22s

### Discipline

Higher = better discipline.

Derived inversely from:

- Penalties conceded
- Errors
- Yellow cards
- Red cards

### Durability / Engine

Derived from:

- Minutes
- Appearances
- Average playing time
- Ability to repeatedly play significant minutes

This is not the same as injury resistance.

### Impact

A broader measure of ability to produce decisive match events.

Derived from high-value contributions appropriate to position.

---

# 5. POSITION-SPECIFIC EVALUATION

Players must be compared primarily against players at their own position.

A prop should not require winger-like attacking statistics to achieve a high rating.

A lock should gain substantial value from:

- Tackling
- Work rate
- Lineout involvement
- Physical contribution
- Turnovers
- Appropriate attacking output

An outside back should gain more value from:

- Metres
- Defenders beaten
- Line breaks
- Tries
- Assists

A fly-half should receive additional weighting for:

- Kicking
- Attacking creation
- Line-break assists
- Try assists

Create position-specific weights for:

- Prop
- Hooker
- Lock
- Loose forward
- Scrum-half
- Fly-half
- Centre
- Outside back

Use percentile or standardized rankings WITHIN POSITION wherever sensible.

---

# 6. CURRENT ABILITY

Each player needs a displayed **Overall / Current Ability rating from 1–100**.

Aim for an intuitive distribution such as:

- 90–99: Exceptional / world-class Super Rugby player
- 85–89: Elite
- 80–84: High-quality starter
- 75–79: Good starter
- 70–74: Solid Super Rugby player
- 65–69: Squad player
- 55–64: Fringe/development
- Below 55: Academy/deep depth

Do not force players into these bands mechanically. They are interpretation guides.

## Rating calculation

Use a combination of:

### A. Statistical Performance Rating

The primary component.

Calculate position-adjusted performance from 2026 statistics.

### B. Match Sample Reliability

A player with 12 appearances should be rated more confidently than a player with one exceptional appearance.

Use Bayesian/shrinkage logic.

Small samples should regress toward a reasonable positional baseline.

### C. Fantasy Price Prior

Historical fantasy price can provide useful information because it incorporates external expectations and previous performance.

However:

**Fantasy price is a prior, not the final rating.**

Its influence should be highest where performance samples are small and much lower where substantial match data exists.

### D. Minutes / Role

Distinguish a proven starter from somebody who generated impressive per-minute numbers from limited minutes.

Document the exact formula.

The formula must be deterministic and reproducible.

---

# 7. POTENTIAL ABILITY

Real historical data cannot reliably tell us every player's future ceiling.

Therefore separate:

- **Current Ability (CA)**
- **Potential Ability (PA)**

For existing real players:

Do not pretend the supplied statistics contain information that they do not.

If age information is unavailable, do not invent real ages.

Use a conservative potential model until additional biographical information is supplied.

For generated academy players, PA can be fully simulated.

Potential should be partly hidden from the user.

Scouts may estimate it with ranges such as:

- Limited potential
- Super Rugby squad potential
- Super Rugby starter potential
- High Super Rugby potential
- International potential
- Elite international potential

The exact PA number should generally remain internal.

---

# 8. DYNAMIC PLAYER STATE

Separate permanent ability from short-term state.

Every player should have:

- Current Ability
- Potential Ability
- Form
- Fitness
- Fatigue
- Morale
- Sharpness
- Injury status
- Development trajectory
- Playing-time satisfaction

Form MUST NOT permanently rewrite ability after one good game.

For example:

A 78-rated player in outstanding form may currently perform like an 83.

A 90-rated player in terrible form may temporarily perform below his normal level.

This creates selection dilemmas.

---

# 9. TACTICS

Tactics must matter.

This is one of the main gameplay systems.

Do not replicate every possible rugby tactic in V1.

Give the user several meaningful tactical dimensions.

## Team attacking settings

### Tempo

- Slow
- Balanced
- Fast

### Width

- Narrow
- Balanced
- Wide

### Attacking risk

- Conservative
- Balanced
- Aggressive

### Territory preference

- Keep ball
- Balanced
- Kick for territory

### Phase style

- Forward dominant
- Balanced
- Backline dominant

### Offload freedom

- Low
- Normal
- High

## Defensive settings

### Line speed

- Conservative
- Balanced
- Aggressive

### Breakdown commitment

- Low
- Balanced
- High

### Defensive width

- Narrow
- Balanced
- Wide

## Kicking

Allow selection of:

- Primary goal kicker
- Secondary kicker
- Primary tactical kicker

## Tactical identity

Display a generated description such as:

> High-tempo, possession-oriented side that attacks wide and aggressively contests the breakdown.

or:

> Territory-first side built around set-piece pressure and forward carries.

Most importantly:

**Tactical choices must interact with player strengths.**

Examples:

A strong attacking backline should benefit more from width.

A powerful forward pack should benefit from forward-dominant phases.

Aggressive breakdown tactics should generate more turnover opportunities but increase penalty risk and fatigue.

High tempo should create more attacking possessions but increase fatigue and errors.

Aggressive defensive line speed should increase pressure but raise the probability of missed tackles and line breaks when beaten.

This should create trade-offs rather than obvious "best" tactics.

---

# 10. TEAM SELECTION

Before each match the user selects a matchday 23:

- 15 starters
- 8 bench players

Use rugby-valid positional requirements.

Allow:

- Drag/drop or click-to-select
- Automatic best XV suggestion
- Fitness warnings
- Form indicators
- Tactical suitability
- Position suitability
- Player comparison

Players should have primary positions.

Where reliable secondary-position information does not exist in the dataset, do not invent extensive versatility.

This can be expanded later.

---

# 11. MATCH SIMULATION ENGINE

Version 1 does NOT require a 3D match engine.

Build a sophisticated statistical simulation underneath a clean text/2D interface.

This is much more important.

Every match should simulate rugby possessions and events.

Match probability should be influenced by:

- Player Current Ability
- Position-specific attributes
- Starting XV strength
- Bench strength
- Tactics
- Tactical matchup
- Home advantage
- Form
- Fitness
- Fatigue
- Morale
- Injuries
- Discipline
- Set-piece strength
- Kicking strength
- Random variance

The simulation must produce plausible:

- Possessions
- Territory
- Tries
- Penalty goals
- Conversions
- Turnovers
- Line breaks
- Metres
- Tackles
- Missed tackles
- Cards
- Penalties
- Set-piece outcomes
- Player performances

Do not independently roll every statistic without relationships.

Events should have causal structure.

For example:

Possession → attacking sequence → field position → defensive pressure → line break/turnover/penalty → scoring opportunity.

---

# 12. MATCH VIEW

Make matches enjoyable even without 3D graphics.

Provide:

### Scoreboard

Live score, game clock and possession.

### Event feed

Examples:

**18' — TRY HURRICANES**
Ruben Love breaks the defensive line before finding Peter Lakai in support.

**32' — TURNOVER**
Ardie Savea wins a crucial breakdown penalty inside his own 22.

### Key statistics

Live:

- Possession
- Territory
- Metres
- Line breaks
- Turnovers
- Penalties
- Tackles
- Set piece

### Player ratings

Use approximately a 1–10 match rating scale.

### Tactical controls

The player should be able to change tactics during matches.

Examples:

- Increase tempo
- Kick more
- Attack wider
- Protect lead
- Contest breakdown harder
- Reduce risk

Substitutions should also matter.

Support:

- Pause
- Normal speed
- Fast
- Instant result

Use seeded randomness so matches can be reproduced during development and debugging.

---

# 13. POST-MATCH EXPERIENCE

After every match display:

- Final score
- Match timeline
- Team statistics
- Player statistics
- Player ratings
- Player of the Match
- Tactical analysis
- Injuries
- Form changes
- Fitness changes
- League table consequences

Generate 2–4 meaningful observations.

Examples:

> Your aggressive breakdown strategy generated six turnovers but also conceded four additional penalties.

> The Crusaders produced 61% of their metres through the back three.

Avoid generic AI commentary that says nothing.

---

# 14. SUPER RUGBY COMPETITION

Use the real participating teams represented in the 2026 dataset.

Create:

- Regular season
- Standings
- Wins/losses
- Points for
- Points against
- Points difference
- Bonus points
- Finals series
- Champion

Use the competition structure appropriate to the supplied season data where straightforward.

If exact competition rules are not encoded, keep competition settings configurable rather than burying assumptions in simulation code.

Maintain:

- Team histories
- Previous champions
- Season results
- Player records
- Competition records

---

# 15. FORM

Form is essential.

Track:

- Last match
- Last 3 matches
- Last 5 matches
- Season form

Use an exponentially weighted system so recent games matter more.

Form should influence:

- Match performance slightly
- AI team selection
- All Blacks selection
- North v South selection
- Player reputation
- Morale

Do not allow form to overpower actual ability.

An elite player remains elite after two quiet games.

---

# 16. INJURIES AND FATIGUE

Keep this relatively simple in V1.

Players accumulate fatigue from minutes.

High fatigue:

- Reduces performance
- Raises injury probability
- Makes rotation useful

Generate believable rugby injuries with:

- Injury type
- Severity
- Approximate return date

Avoid a medically excessive simulation.

The purpose is managerial decision-making.

---

# 17. PLAYER DEVELOPMENT

Players can improve or decline between seasons.

Development should depend on:

- Potential
- Playing time
- Performance
- Training environment
- Age, once reliable age data exists
- Morale
- Injuries
- Quality of coaching

For Version 1, use a simplified development system.

Avoid complicated individual training schedules.

Allow users to select a general development focus:

- Attack
- Defence
- Skills
- Kicking
- Set piece
- Physical
- Balanced

---

# 18. ACADEMY / NEWGEN SYSTEM

This is one of the most important long-term save mechanics.

Every Super Rugby franchise should have an academy.

Once per season generate a class of fictional young players.

Call them **Newgens** internally.

Generated players need:

- First name
- Last name
- Age
- Position
- Secondary position where appropriate
- Height/weight if implemented
- Current Ability
- Hidden Potential Ability
- Major attributes
- Personality/development trait
- Academy/franchise
- Region/nationality
- Scouting uncertainty

The quality of each intake should vary.

Occasionally generate:

- Poor classes
- Strong classes
- A "golden generation"

Do not generate too many elite prospects.

True international-level prospects should feel exciting.

---

# 19. ACADEMY TRIAL MATCH

Before final academy contracts are decided, create an annual **Academy Trial Match / Future Stars Trial**.

The user receives approximately 20–30 young prospects.

They initially see:

- Position
- Approximate scout rating
- Attribute ranges
- Limited information

The prospects play a simulated trial.

The user can inspect:

- Trial performance
- Match statistics
- Updated scouting assessment

They then decide which prospects to sign into the academy.

This needs to feel like an event.

Example news item:

> **Future Stars Trial Tomorrow**
> Scouts believe this year's intake contains several promising loose forwards, although there are concerns over depth at first five.

Afterwards:

> **Trial Standout**
> 18-year-old lock Tama Ropata produced 14 tackles, two lineout steals and a turnover in today's academy trial.

The player may turn out to be:

- A genuine future international
- A reliable squad player
- A prospect who never develops

Scouting should not reveal this perfectly.

---

# 20. UNDER-21 COMPETITION

Each franchise should maintain an U21 / Development squad.

In Version 1, these squads can primarily contain generated academy players because reliable ages are not necessarily available for every historical real player.

Create a lightweight U21 competition.

The player does NOT need to manually manage every U21 fixture.

Allow:

- Automatic squad selection
- Instant simulation
- Results
- Standings
- Player development
- Prospect statistics

Users may inspect any match.

Strong U21 performers should become candidates for senior promotion.

This provides a meaningful pathway:

**Academy → U21 → Super Rugby → North/South → All Blacks**

---

# 21. PLAYER CONTRACTS AND RECRUITMENT

Football Manager's squad-building loop is important, but Version 1 should simplify rugby contracting.

Each player can have:

- Club
- Contract years remaining
- Approximate salary/value
- Squad status

Statuses:

- Star
- Important
- Regular
- Rotation
- Development

Allow:

- Contract extensions
- Player releases
- Free-agent signings
- Recruitment from other franchises

Use a simplified team payroll/budget rather than attempting to perfectly reproduce every real-world contracting regulation.

The system should be configurable later.

AI clubs must also recruit.

They should evaluate:

- Position need
- Current Ability
- Potential
- Age when available
- Cost
- Form
- Squad depth

AI clubs should not randomly accumulate five elite fly-halves while having no props.

---

# 22. SCOUTING

Keep scouting fun but lightweight.

Users should be able to search players by:

- Position
- Club
- Age
- Rating range
- Form
- Contract status
- Potential estimate
- Statistics

Players inside Super Rugby can be relatively well known.

Academy players should have more uncertainty.

Provide scout recommendations such as:

- Excellent signing
- Good signing
- Useful depth
- Development project
- Avoid

The recommendation must explain why.

---

# 23. SQUAD PLANNER

Create an FM-style squad planning page.

For every position show:

1. Current starter
2. Backup
3. Development option

Example:

**Lock**

1. Player A — 86
2. Player B — 78
3. Player C — 67 ↑

Allow the user to see future weaknesses.

Example:

> Lock depth is strong.
> Scrum-half depth is concerning.
> Three starting-quality players expire at season end.

This connects recruitment to long-term planning.

---

# 24. ALL BLACKS SELECTION

This should be one of the game's signature features.

After/during the Super Rugby season, simulate **All Blacks squad selection**.

Eligibility must come from an explicit data field such as:

`all_blacks_eligible = true/false`

Never infer national eligibility purely from Super Rugby franchise.

If eligibility data has not yet been supplied, build the field and interface necessary to populate it.

## Selection algorithm

All Blacks selection should consider approximately:

- 50% underlying Current Ability
- 30% Super Rugby form/performance
- 10% recent high-level experience/reputation
- 10% tactical/positional squad need

These weights should be configurable.

This means:

- Elite established players remain difficult to displace.
- Outstanding form genuinely matters.
- Breakout players can force themselves into selection.
- Reputation cannot completely protect poor performers.

Generate selection discussion before announcement.

Example:

### ALL BLACKS WATCH

**Bolter:** Player X
Five-match rating: 8.1
Season tries: 8
Selection probability: Rising

Then produce an official squad announcement.

Clearly identify:

- Selected players
- Unlucky omissions
- New caps
- Recall candidates

If the user's player earns a first call-up, make it feel significant.

---

# 25. INTERNATIONAL CONSEQUENCES

Version 1 does NOT need a complete global international rugby simulator.

For now:

- Track All Blacks selection.
- Track international caps in a simplified way.
- Allow selected players to receive an international reputation boost.
- Create international selection news.

Full international management can be a later expansion.

---

# 26. NORTH v SOUTH THREE-MATCH SERIES

At the end of every Super Rugby season, stage a **North v South three-match series**.

This should feel prestigious.

Create:

- Game I
- Game II
- Game III

Even if one team wins the first two, play Game III.

Track series history.

## Eligibility

Do not arbitrarily guess geographic origin where it is unknown.

Create an explicit field:

`north_south_region = NORTH / SOUTH / UNKNOWN`

For initial implementation, allow data to be supplied/manually edited.

The selection engine should choose players using:

- Current Ability
- Current Super Rugby form
- Positional balance
- Fitness
- Availability

Form should matter more here than in All Blacks selection.

Suggested weighting:

- 40% Current Ability
- 45% current-season form
- 15% positional/tactical need

Therefore North v South becomes an opportunity for form players and All Blacks contenders.

---

# 27. NORTH v SOUTH NARRATIVE

Use the series as a bridge between Super Rugby and All Blacks selection.

Generate headlines such as:

> **North v South squads named: three uncapped bolters earn opportunities**

> **South level series after Dunedin thriller**

> **All Blacks selectors watching breakout No. 8 following dominant Game II**

Performance in the series should slightly influence final All Blacks selections.

Create:

- Series MVP
- Top try scorer
- Top tackler
- Best average match rating
- Historical records

Over multiple seasons this should become one of the save's traditions.

---

# 28. NEWS / PORTAL SYSTEM

The main home screen should resemble the information-first philosophy of Football Manager.

I will provide Football Manager UI screenshots for visual reference.

Use them as inspiration for information architecture and density, NOT as assets to copy exactly.

Create a central **Manager Portal** displaying:

### Next Match

Opponent, venue, date, opponent form.

### Inbox / Tasks

Items needing decisions.

### Latest News

League developments.

### Squad

Injuries, fitness, morale.

### Form

Recent team results.

### Standings

Compact competition table.

### Development

Important academy/U21 updates.

### Selection Watch

All Blacks / North-South candidates where relevant.

Examples of inbox items:

- Player unhappy with playing time.
- Academy trial squad available.
- Contract expiring.
- Player cleared from injury.
- All Blacks squad announced.
- North v South selection approaching.
- Assistant recommends tactical change.
- U21 player performing well.
- Rival club interested in player.

Do not overwhelm the player with meaningless messages.

Messages should usually:

1. Communicate something useful;
2. Create a decision; or
3. Add meaningful world-building.

---

# 29. PLAYER PROFILE PAGE

Every player needs an enjoyable profile page.

Show:

- Name
- Club
- Position
- Overall rating
- Form
- Fitness
- Morale
- Contract
- All Blacks status
- North/South status
- Attribute radar/bar display
- Season statistics
- Career statistics
- Recent matches
- Development trend

Also provide:

### Statistical strengths

Example:

- Elite ball carrier
- Above-average defender
- Strong turnover threat

### Weaknesses

Example:

- High penalty rate
- Limited attacking involvement

These descriptions should be calculated from positional percentiles rather than randomly generated.

---

# 30. STATISTICS

The game should lean into its rich underlying data.

Allow leaderboards for:

- Tries
- Try assists
- Metres
- Defenders beaten
- Line breaks
- Tackles
- Tackle %
- Turnovers
- Offloads
- Kicking points
- Penalties
- Match rating
- Overall rating
- Form

Add useful contextual stats.

Examples:

> Locks average 18% more metres against the Waratahs than league average.

> The Blues concede the most line breaks to outside backs.

> Your side's tackle success falls from 89% to 82% after the 60th minute.

These advanced insights can initially be generated from straightforward aggregations.

Do not add fake precision unsupported by the simulation data.

---

# 31. AI MANAGERS

Every opposition franchise needs automated management logic.

AI clubs should:

- Select strongest available teams.
- Consider form.
- Consider fatigue.
- Rotate when appropriate.
- Use team tactical identities.
- Develop high-potential players.
- Recruit for weak positions.
- Release redundant players.

Give each club a slightly different tactical tendency.

This creates identity without requiring a sophisticated personality simulation.

---

# 32. MORALE AND PLAYER MANAGEMENT

Use a lightweight morale system in V1.

Morale can be affected by:

- Playing time
- Team results
- Selection
- Contract situation
- International selection
- Being dropped
- Winning major games

Do not build Football Manager's enormous conversation system yet.

Instead use occasional decision cards.

Example:

> **Player Concern**
> Player X has started only one of the last five games and wants more opportunities.

Options:

- Promise more minutes
- Explain competition for places
- Offer no assurances

Choices slightly influence morale.

Keep these interactions infrequent enough to remain meaningful.

---

# 33. STAFF

Do NOT build a huge Football Manager staff database in Version 1.

Initially support only:

- Head Coach / user
- Assistant Coach
- Recruitment Lead
- Academy Director

These can simply provide recommendations and modifiers.

Later versions can add detailed staff recruitment.

---

# 34. SEASON FLOW

A normal season should approximately follow:

## Preseason

- Review squad
- Recruitment
- Academy players
- Tactics
- Trial/preseason matches if desired

## Super Rugby season

Each week:

1. Inbox/Portal
2. Review opposition
3. Review squad fitness/form
4. Select 23
5. Choose/adjust tactic
6. Simulate/play match
7. Review results
8. Player development/injuries/news
9. Advance week

## Finals

Increased importance and presentation.

## Post-Super Rugby

- Awards
- Season review
- North v South squads
- Three-match North v South series
- All Blacks selection
- Contract/recruitment activity
- Academy trial/intake
- U21/development activity
- Offseason progression
- Next season

Make advancing time effortless.

The player should usually be one obvious button away from:

**CONTINUE**

---

# 35. AWARDS AND RECORDS

At season end generate:

- Player of the Year
- Young Player of the Year
- Top Try Scorer
- Best Defender
- Most Improved
- Team of the Season
- Coach of the Year
- Champion

Maintain historical tables.

Long-term saves need persistent history.

A player should be able to look back after ten seasons and see the universe they created.

---

# 36. SAVE SYSTEM

Critical.

Support:

- New Career
- Save Career
- Load Career
- Multiple save slots if straightforward

Persist:

- Players
- Generated players
- Ratings
- Development
- Contracts
- Teams
- Results
- Standings
- Records
- Injuries
- News
- All Blacks history
- North/South history
- Academy history

The game must support indefinite future seasons.

---

# 37. UI / VISUAL DIRECTION

I will provide screenshots from Football Manager.

Use these screenshots to understand:

- Information density
- Hierarchy
- Navigation patterns
- Tables
- Sidebars
- Player profile structure
- Dashboard philosophy

Do NOT blindly recreate Football Manager pixel-for-pixel.

The visual identity should feel like a premium rugby management application.

Prioritise:

- Dark professional interface
- Dense but readable information
- Clear tables
- Strong typography
- Compact stat cards
- Minimal unnecessary whitespace
- Fast navigation

Suggested primary navigation:

- Home
- Squad
- Tactics
- Schedule
- Competition
- Recruitment
- Development
- Statistics

The user should be able to reach important information within one or two clicks.

---

# 38. V1 TECHNICAL PRINCIPLES

Use a modular architecture.

Separate:

### DATA LAYER

CSV import and persistent game database.

### RATING ENGINE

Transforms raw historical performance into initial player attributes.

### MATCH ENGINE

Simulates matches.

### CAREER ENGINE

Handles calendar, competition progression and seasons.

### PLAYER DEVELOPMENT ENGINE

Handles form, potential, progression and ageing.

### AI MANAGER

Handles opposition selection/recruitment.

### NARRATIVE ENGINE

Creates deterministic/restrained news from game events.

### UI

Displays and controls the game state.

Do NOT mix all game logic directly into interface components.

Important simulation constants and weightings should live in configuration files rather than scattered hard-coded numbers.

---

# 39. DATABASE TABLES

At minimum consider entities resembling:

- players
- teams
- player\_attributes
- player\_form
- player\_contracts
- matches
- match\_player\_stats
- standings
- injuries
- tactics
- academy\_players
- u21\_teams
- news
- awards
- all\_blacks\_selections
- north\_south\_selections
- season\_history
- game\_settings

Preserve the original historical `player_id` for imported players.

Generated players should have separate unique IDs that can never collide with real players.

---

# 40. SIMULATION VALIDATION

Before describing the match engine as finished, test it.

Run at least several thousand automated matches.

Check distributions for:

- Average total points
- Home win %
- Winning margins
- Try counts
- Penalty counts
- Cards
- Tackles
- Metres
- Turnovers
- Upset frequency

Compare broad simulated distributions against the supplied 2026 data.

Tune the engine until obviously unrealistic behaviour is reduced.

Also test that:

- Better teams generally win more often.
- Upsets remain possible.
- Tactical changes create measurable effects.
- No tactical option is universally dominant.
- Player ratings meaningfully affect outcomes.

---

# 41. INITIAL RATING VALIDATION

Before locking player ratings:

Display the highest-rated players by position.

Check:

- Props
- Hookers
- Locks
- Loose forwards
- Scrum-halves
- Fly-halves
- Centres
- Outside backs

Identify obvious statistical artefacts caused by:

- Small samples
- Bench appearances
- Tries inflating low-volume performances
- Position-specific statistical differences

Correct the model rather than manually editing dozens of players.

Manual overrides should be exceptional.

---

# 42. WHAT NOT TO BUILD YET

Version 1 deliberately does NOT need:

- 3D graphics
- Motion-captured rugby
- Every domestic competition in world rugby
- Full NPC simulation
- Full international competition simulation
- Hundreds of staff members
- Detailed press conferences
- Complex media relationships
- Player agents with extensive personalities
- Detailed finances/accounting
- Stadium construction
- Board politics
- Sponsorship negotiations
- Detailed individual training calendars
- Realistic global transfer regulations
- Complete contract-law simulation
- Dozens of hidden psychological attributes
- Fully modelled weather physics
- Huge conversation trees

Do not let these distract from producing a playable game.

---

# 43. VERSION 1 MUST-HAVES

Treat these as the acceptance criteria.

A completed Version 1 must allow me to:

1. Choose a Super Rugby team.
2. See its real 2026 squad.
3. Inspect statistically derived player ratings.
4. Compare players.
5. Choose a matchday 23.
6. Set meaningful rugby tactics.
7. Simulate matches.
8. Watch an event feed.
9. Make substitutions/tactical changes.
10. See realistic match statistics.
11. Advance through an entire Super Rugby season.
12. View standings and statistics.
13. Experience injuries, fatigue, form and morale.
14. Recruit/release players.
15. Develop players.
16. Receive academy/newgen players.
17. Conduct an academy trial.
18. Operate an U21/development squad.
19. Watch AI teams manage themselves.
20. See form-based All Blacks selections.
21. Play a three-match North v South series.
22. Progress into another season.
23. Continue the save indefinitely.
24. View historical winners, awards and records.

If all 24 work and interact coherently, Version 1 is successful.

---

# 44. DEVELOPMENT ORDER

Do not attempt to build everything simultaneously.

Build in this order.

## PHASE 1 — Database + Ratings

First:

- Import supplied CSV files.
- Build teams.
- Build players.
- Create rating algorithm.
- Calculate attributes.
- Create player profile.
- Create squad page.

STOP and validate.

## PHASE 2 — Match Engine

Then:

- Build team-strength calculation.
- Build event simulation.
- Build score generation.
- Produce player statistics.
- Produce match ratings.
- Validate against 2026.

STOP and validate.

## PHASE 3 — Selection + Tactics

Then:

- Team selection.
- Bench.
- Tactics.
- Tactical interactions.
- Fatigue.
- Substitutions.

STOP and validate.

## PHASE 4 — Season

Then:

- Schedule.
- AI teams.
- Standings.
- Finals.
- Calendar.
- Continue button.
- Season completion.

STOP and validate.

## PHASE 5 — Management Layer

Then:

- Form.
- Morale.
- Injuries.
- Contracts.
- Recruitment.
- Squad planner.

STOP and validate.

## PHASE 6 — Future Players

Then:

- Potential.
- Development.
- Academy.
- Newgens.
- Trial match.
- U21 squads/competition.

STOP and validate.

## PHASE 7 — Representative Rugby

Then:

- All Blacks eligibility.
- Selection watch.
- All Blacks selection algorithm.
- North/South eligibility.
- North v South selection.
- Three-match series.
- Representative history.

STOP and validate.

## PHASE 8 — Immersion

Finally:

- Portal.
- Inbox.
- News.
- Awards.
- Records.
- Season review.
- UI polish.

---

# 45. WORKING METHOD

Do not respond by merely describing how this game could theoretically work.

Actually build it.

Before coding:

1. Inspect every supplied data file.
2. Report its schema.
3. Identify missing fields.
4. Create the database/data model.
5. Explain the proposed initial rating methodology.
6. Flag only genuine blockers.
7. Then begin Phase 1.

When something is missing:

- Do not silently fabricate factual information.
- Add a nullable/configurable field.
- Generate fictional information only where the game explicitly requires fictional content, such as newgens.

Keep a development log containing:

- Features completed
- Tests performed
- Known bugs
- Design decisions
- Deferred features

---

# 46. DESIGN PHILOSOPHY

At every feature decision ask:

### Does this create an interesting decision?

If no, simplify it.

### Does this create a story the user might remember?

If yes, prioritise it.

### Does this improve the credibility of the simulation?

If yes, validate it statistically.

### Is this complexity visible or valuable to the player?

If no, avoid overengineering it.

Football Manager is compelling not because it contains thousands of buttons, but because a connected world reacts to decisions.

Super Rugby Manager should aim for the same outcome.

The ideal emotional experience is:

> “I gave this 19-year-old a chance because he dominated the academy trial. He became my starting lock, carried us through the playoffs, starred for South, and three years later became an All Black.”

That is the game we are building.

---

# 47. FIRST TASK

Begin with **Phase 1 only**.

Do not start implementing later systems until the foundations are stable.

Your first response/work should:

1. Inspect all supplied 2026 files.
2. Summarise exactly what usable data exists.
3. Build the internal data schema.
4. Implement the import pipeline.
5. Propose and implement the position-adjusted player rating methodology.
6. Produce a table of the top 10 rated players at every position.
7. Inspect the results for obvious anomalies.
8. Adjust the methodology where statistically justified.
9. Build the first Squad and Player Profile screens using the Football Manager UI references I provide.
10. Confirm that real players and teams load correctly.

Then proceed iteratively from there.

Do not rush ahead to academy systems, All Blacks selection or North v South until the foundation has been demonstrated to work.