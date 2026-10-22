# Super Rugby Manager — Phase 1 audit

Snapshot: 2026-09-04T21:56:06.559925+00:00. Model: playable-0.2.0.

## Source inventory

| File | Rows | Fields |
|---|---:|---:|
| players.csv | 454 | 42 |
| matches.csv | 77 | 15 |
| rounds.csv | 16 | 7 |
| player_match_stats.csv | 3499 | 48 |
| player_price_history.csv | 7192 | 3 |
| player_selection_history.csv | 7192 | 3 |
| player_round_scores.csv | 3499 | 3 |
| metadata.json | JSON document | 6 |
| validation_report.json | JSON document | 11 |

## Import result

{
  "status": "Passed with documented limitations",
  "counts": {
    "players": 454,
    "matches": 77,
    "rounds": 16,
    "player_match_stats": 3499,
    "player_price_history": 7192,
    "player_selection_history": 7192,
    "player_round_scores": 3499
  },
  "teams": 11,
  "zero_minute_rows": 17,
  "no_appearance_players": 43,
  "low_sample_players": 135,
  "exception_counts": {
    "zero_minutes": 17,
    "small_sample": 135,
    "no_appearances": 43,
    "late_price_prior": 17
  },
  "checks": [
    "Unique player, match and player-round keys",
    "Every player ID and round ID resolved",
    "Match team, opponent, score and date joins agree",
    "All fantasy totals and round scores reconcile",
    "All 454 source players retained",
    "Source files hashed for reproducibility",
    "No unsupported real ages, eligibility or contracts invented"
  ],
  "source_retrieved_at": "2026-09-04T21:56:06.559925+00:00",
  "model_version": "playable-0.2.0"
}

## Missing fields

- Date of birth / age
- Nationality and international eligibility
- North / South eligibility
- Primary sub-position (e.g. loosehead versus tighthead)
- Verified secondary positions
- Announced starters and bench roles
- Contracts, salary and expiry
- Current injury, fitness, morale and fatigue
- Individual scrum technique / lineout throw accuracy
- Tactical kick volume, distance and retention
- Carry count and ruck involvement
- Potential ability and coaching environment

## Source schemas

### players.csv

| Field | Empty cells |
|---|---:|
| `player_id` | 0 |
| `feed_id` | 0 |
| `first_name` | 0 |
| `last_name` | 0 |
| `full_name` | 0 |
| `squad_id` | 0 |
| `squad_name` | 0 |
| `squad_abbr` | 0 |
| `position` | 0 |
| `selection_status` | 0 |
| `locked` | 0 |
| `current_cost` | 0 |
| `total_points` | 43 |
| `season_average` | 43 |
| `last_round_points` | 227 |
| `position_rank` | 43 |
| `appearance_count` | 0 |
| `last_3_appearances_average` | 43 |
| `last_3_appearance_scores` | 43 |
| `image_pitch` | 34 |
| `image_profile` | 38 |
| `season_tries` | 43 |
| `season_assists` | 43 |
| `season_conversions` | 43 |
| `season_penalties` | 43 |
| `season_dropGoals` | 43 |
| `season_tackles` | 43 |
| `season_linebreaks` | 43 |
| `season_linebreakAssists` | 43 |
| `season_turnovers` | 43 |
| `season_interceptions` | 43 |
| `season_defendersBeaten` | 43 |
| `season_lineoutsWon` | 43 |
| `season_scrumsWon` | 43 |
| `season_metresGained` | 43 |
| `season_gamesPlayed` | 43 |
| `season_penaltiesConceded` | 43 |
| `season_errors` | 43 |
| `season_yellowCards` | 43 |
| `season_redCards` | 43 |
| `season_offloads` | 43 |
| `season_kick5022` | 43 |

SHA-256: `639bce275ec3ff19f495dcfe46985adaf6ead503270163088668333cb2929b25`

### matches.csv

| Field | Empty cells |
|---|---:|
| `tournament_id` | 0 |
| `round_id` | 0 |
| `round_number` | 0 |
| `date` | 0 |
| `status` | 0 |
| `venue_id` | 0 |
| `venue_name` | 0 |
| `home_squad_id` | 0 |
| `home_squad_name` | 0 |
| `home_squad_abbr` | 0 |
| `home_score` | 0 |
| `away_squad_id` | 0 |
| `away_squad_name` | 0 |
| `away_squad_abbr` | 0 |
| `away_score` | 0 |

SHA-256: `cf86a89939a97b364dec10d3633dd2bfbb66a47971b678d63641312ce0ef1fbd`

### rounds.csv

| Field | Empty cells |
|---|---:|
| `round_id` | 0 |
| `round_number` | 0 |
| `status` | 0 |
| `start_date` | 0 |
| `end_date` | 0 |
| `locked_for_updating` | 0 |
| `match_count` | 0 |

SHA-256: `345c429e0130a7215629f25ad3cef9c821349e3b5693a00f328333fea2f6f73e`

### player_match_stats.csv

| Field | Empty cells |
|---|---:|
| `player_id` | 0 |
| `feed_id` | 0 |
| `player_name` | 0 |
| `position` | 0 |
| `squad_id` | 0 |
| `squad_name` | 0 |
| `round_id` | 0 |
| `round_number` | 0 |
| `tournament_id` | 0 |
| `date` | 0 |
| `venue_name` | 0 |
| `home_away` | 0 |
| `opponent_squad_id` | 0 |
| `opponent_squad_name` | 0 |
| `team_score` | 0 |
| `opponent_score` | 0 |
| `fantasy_points` | 0 |
| `running_average` | 0 |
| `calculated_fantasy_points` | 0 |
| `scoring_formula_matches` | 0 |
| `MP` | 0 |
| `T` | 0 |
| `TA` | 0 |
| `C` | 0 |
| `CM` | 0 |
| `PG` | 0 |
| `PGM` | 0 |
| `YC` | 0 |
| `RC` | 0 |
| `TW` | 0 |
| `TC` | 0 |
| `I` | 0 |
| `O` | 0 |
| `LB` | 0 |
| `LC` | 0 |
| `MG` | 0 |
| `PC` | 0 |
| `DG` | 0 |
| `DGM` | 0 |
| `LT` | 0 |
| `LS` | 0 |
| `LE` | 0 |
| `TK` | 0 |
| `MT` | 0 |
| `E` | 0 |
| `TB` | 0 |
| `SW` | 0 |
| `K_50_22` | 0 |

SHA-256: `99f7dbeb1b45d37a10195071fbb802516b33b19ff4126cb22914065b6edf8ac4`

### player_price_history.csv

| Field | Empty cells |
|---|---:|
| `player_id` | 0 |
| `round_id` | 0 |
| `price` | 0 |

SHA-256: `73c1c79f652d58b55776e644e593ef1f47db5d6d61775fa651200e2a79c6d741`

### player_selection_history.csv

| Field | Empty cells |
|---|---:|
| `player_id` | 0 |
| `round_id` | 0 |
| `selected_percent` | 0 |

SHA-256: `00fcb41081482c4d5339ff9562bef559e9d9dbccd47b47ab09ef91e25532ce20`

### player_round_scores.csv

| Field | Empty cells |
|---|---:|
| `player_id` | 0 |
| `round_id` | 0 |
| `fantasy_points` | 0 |

SHA-256: `6fdef4c9b870931c1e3e78dd6c69164dbc4ee8726e78c23cc8b1acf79ac4e8e6`

### metadata.json

| Field | Empty cells |
|---|---:|
| `retrieved_at_utc` | — |
| `base_url` | — |
| `source_endpoints` | — |
| `source_checksums` | — |
| `record_counts` | — |
| `validation` | — |

SHA-256: `3f6c63760328524ba8a6150ca2bdf8c939e5d9c81bee79723e0c6d9adf8b4298`

### validation_report.json

| Field | Empty cells |
|---|---:|
| `result` | — |
| `sampled_player_ids` | — |
| `sampled_player_pages` | — |
| `sampled_player_match_rows` | — |
| `detail_schema_mismatches` | — |
| `detail_stat_schema_mismatches` | — |
| `unresolved_tournament_ids` | — |
| `round_join_mismatches` | — |
| `summary_score_mismatches` | — |
| `scoring_formula_mismatches` | — |
| `players` | — |

SHA-256: `8847a349e2921350e40f2f6667ee1cf27ba4f42c4cc3f144ed9d08d56da5b55e`

## Top 10 by position

Ratings are descriptive game estimates, not externally validated measures of true ability. Rankings use unrounded scores; displayed ties can have different ranks.

### Prop

| Rank | Player | Team | CA | Minutes | Confidence |
|---:|---|---|---:|---:|---|
| 1 | Tyrel Lomax | Hurricanes | 92 | 75 | Low |
| 2 | George Bower | Crusaders | 87 | 571 | Medium |
| 3 | Ollie Norris | Chiefs | 84 | 463 | Medium |
| 4 | Ethan de Groot | Highlanders | 84 | 780 | High |
| 5 | Marley Pearce | Western Force | 82 | 162 | Low |
| 6 | Siale Lauaki | Hurricanes | 81 | 306 | Medium |
| 7 | Fletcher Newell | Crusaders | 81 | 728 | High |
| 8 | Chris Apoua | Moana Pasifika | 80 | 304 | Medium |
| 9 | Allan Alaalatoa | ACT Brumbies | 80 | 263 | Medium |
| 10 | Jared Proffit | Chiefs | 80 | 547 | Medium |

### Hooker

| Rank | Player | Team | CA | Minutes | Confidence |
|---:|---|---|---:|---:|---|
| 1 | Brandon Paenga-Amosa | Western Force | 83 | 708 | High |
| 2 | Samisoni Taukei'aho | Chiefs | 83 | 622 | Medium |
| 3 | Jack Taylor | Highlanders | 82 | 808 | High |
| 4 | Millennium Sanerivi | Moana Pasifika | 78 | 780 | High |
| 5 | George Bell | Crusaders | 77 | 503 | Medium |
| 6 | Ethan Dobbins | NSW Waratahs | 76 | 487 | Medium |
| 7 | Jacob Devery | Hurricanes | 76 | 199 | Low |
| 8 | Richie Asiata | Queensland Reds | 75 | 174 | Low |
| 9 | Josh Nasser | Queensland Reds | 75 | 473 | Medium |
| 10 | Kurt Eklund | Blues | 73 | 284 | Medium |

### Lock

| Rank | Player | Team | CA | Minutes | Confidence |
|---:|---|---|---:|---:|---|
| 1 | Jamie Hannah | Crusaders | 91 | 825 | High |
| 2 | Sam Darry | Blues | 89 | 986 | High |
| 3 | Fabian Holland | Highlanders | 88 | 0 | Low |
| 4 | Warner Dearns | Hurricanes | 85 | 811 | High |
| 5 | Josh Beehre | Blues | 84 | 701 | High |
| 6 | Jeremy Williams | Western Force | 82 | 1032 | High |
| 7 | Miles Amatosero | NSW Waratahs | 82 | 692 | High |
| 8 | Seru Uru | Queensland Reds | 82 | 867 | High |
| 9 | Allan Craig | Moana Pasifika | 81 | 886 | High |
| 10 | Josh Canham | Queensland Reds | 81 | 370 | Medium |

### Loose forward

| Rank | Player | Team | CA | Minutes | Confidence |
|---:|---|---|---:|---:|---|
| 1 | Harry Wilson | Queensland Reds | 88 | 893 | High |
| 2 | Du'Plessis Kirifi | Hurricanes | 87 | 627 | Medium |
| 3 | Dalton Papali'i | Blues | 86 | 597 | Medium |
| 4 | Wallace Sititi | Chiefs | 86 | 434 | Medium |
| 5 | Fraser McReight | Queensland Reds | 85 | 963 | High |
| 6 | Charlie Cale | ACT Brumbies | 83 | 555 | Medium |
| 7 | Peter Lakai | Hurricanes | 82 | 781 | High |
| 8 | Carlo Tizzano | Western Force | 82 | 911 | High |
| 9 | Luke Reimer | ACT Brumbies | 82 | 369 | Medium |
| 10 | Anton Segner | Blues | 81 | 982 | High |

### Scrum-half

| Rank | Player | Team | CA | Minutes | Confidence |
|---:|---|---|---:|---:|---|
| 1 | Cam Roigard | Hurricanes | 94 | 666 | High |
| 2 | Noah Hotham | Crusaders | 88 | 749 | High |
| 3 | Frank Lomani | Fijian Drua | 85 | 545 | Medium |
| 4 | Kyle Preston | Crusaders | 80 | 175 | Low |
| 5 | Adam Lennox | Highlanders | 79 | 543 | Medium |
| 6 | Teddy Wilson | NSW Waratahs | 79 | 397 | Medium |
| 7 | Simione Kuruvoli | Fijian Drua | 79 | 151 | Low |
| 8 | Xavier Roe | Chiefs | 76 | 475 | Medium |
| 9 | Tate McDermott | Queensland Reds | 76 | 124 | Low |
| 10 | Jake Gordon | NSW Waratahs | 75 | 671 | High |

### Fly-half

| Rank | Player | Team | CA | Minutes | Confidence |
|---:|---|---|---:|---:|---|
| 1 | Damian McKenzie | Chiefs | 93 | 634 | Medium |
| 2 | Carter Gordon | Queensland Reds | 87 | 573 | Medium |
| 3 | Harry McLaughlin-Phillips | Queensland Reds | 87 | 461 | Medium |
| 4 | Josh Jacomb | Chiefs | 84 | 730 | High |
| 5 | Ben Donaldson | Western Force | 82 | 916 | High |
| 6 | Rivez Reihana | Crusaders | 80 | 470 | Medium |
| 7 | Patrick Pellegrini | Moana Pasifika | 80 | 697 | High |
| 8 | Beauden Barrett | Blues | 76 | 670 | High |
| 9 | Brett Cameron | Hurricanes | 75 | 24 | Low |
| 10 | Harry Godfrey | Hurricanes | 74 | 0 | Low |

### Centre

| Rank | Player | Team | CA | Minutes | Confidence |
|---:|---|---|---:|---:|---|
| 1 | Leicester Fainga'anuku | Crusaders | 95 | 866 | High |
| 2 | Quinn Tupaea | Chiefs | 94 | 903 | High |
| 3 | Timoci Tavatavanawai | Highlanders | 90 | 950 | High |
| 4 | Jordie Barrett | Hurricanes | 86 | 821 | High |
| 5 | Billy Proctor | Hurricanes | 86 | 844 | High |
| 6 | David Havili | Crusaders | 84 | 745 | High |
| 7 | Dallas McLeod | Crusaders | 82 | 708 | High |
| 8 | Isaac Henry | Queensland Reds | 76 | 419 | Medium |
| 9 | Iosefo Namoce | Fijian Drua | 76 | 188 | Low |
| 10 | Virimi Vakatawa | Fijian Drua | 76 | 596 | Medium |

### Outside back

| Rank | Player | Team | CA | Minutes | Confidence |
|---:|---|---|---:|---:|---|
| 1 | Will Jordan | Crusaders | 92 | 506 | Medium |
| 2 | Caleb Tangitau | Highlanders | 90 | 819 | High |
| 3 | Sevu Reece | Crusaders | 89 | 931 | High |
| 4 | Max Jorgensen | NSW Waratahs | 89 | 1073 | High |
| 5 | Chay Fihaki | Crusaders | 89 | 756 | High |
| 6 | Fehi Fineanganofo | Hurricanes | 88 | 910 | High |
| 7 | Dylan Pietsch | Western Force | 85 | 574 | Medium |
| 8 | Leroy Carter | Chiefs | 85 | 689 | High |
| 9 | Filipo Daugunu | Queensland Reds | 85 | 825 | High |
| 10 | Kyren Taumoefolau | Chiefs | 84 | 730 | High |
