# Preparation and U21 update

Career saves now use the account storage revision from the response body, rather than HTTP cache tags. Genuine conflicts pause autosaving and offer an explicit choice between the current session and the account save. Either choice first downloads the session; replacing the account version preserves its previous-save recovery snapshot. A further external change requires another review.

Weekly training is applied once per round. Recovery removes 6 fatigue and costs 2 sharpness; Balanced adds 2 sharpness; Intensive adds 4 sharpness and 4 fatigue. Injured players do not train. Defence, Handling and Set piece focus give a small temporary match benefit at Balanced/Intensive intensity. Ability development remains an offseason process.

Three tactical presets show the relevant selected-unit rating. Managers can save and restore preferred tactics. Watched matches pause at halftime for evidence and optional changes. Quick simulations make halftime tactical and substitution decisions, preserving legal cover and the selected match priority.

Preparation includes the last three club games' starts and minutes, freshness and upcoming opponents. Completed club matches generate concise inbox reports with bench contribution, injuries and progress against minutes plans. Reports link to full match evidence, player profiles and next-match preparation. Squad/recruitment filters survive career-page navigation, with an in-career Back button.

Generated U21 prospects have season-minute targets and Balanced, Priority minutes or Rest selection settings. Priority increases selection preference, particularly behind the target pace, and encourages bench opportunities. It does not change match ability or override injuries, positions, the under-21 age limit or the rule excluding players who appeared in that senior round. Rest remains active until changed. Targets guide selection and are not guarantees.

Senior readiness compares current ability with the club's positional depth and explains how much U21 match evidence exists. Progress messages arrive after U21 rounds 4, 8 and 11. Young-player offseason growth, potential limits and existing representative eligibility rules are preserved.

Validation: deterministic match resume, halftime decisions and legal substitutions; training idempotency and injury exclusion; U21 minutes priorities and rest; full-season completion and save validation; compressed account saves, altered delivery ETags, conflicting sessions, conditional conflict resolution and previous-save recovery using a mock R2 adapter. Live account storage has not been exercised through a browser.
