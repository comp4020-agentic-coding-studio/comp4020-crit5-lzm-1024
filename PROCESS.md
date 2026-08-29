# Process overview

## What I built

I built SKYFALL, a responsive vertical shoot 'em up that runs entirely in the
browser. It combines ten authored levels, several enemy roles, moving Bosses,
upgrade decisions, pickups, hazards, five languages, persistent settings, and
mouse, touch, and keyboard controls. My central idea was to make a compact
prototype feel like a complete arcade game: the visual polish, difficulty
curve, rules, and technical performance all had to support the same fast,
readable combat loop.

## The moments that mattered

### Turning repeated waves into authored progression

The first design kept increasing enemy counts across too many similar levels.
That produced repetition without giving the player new decisions. I reduced the
structure to ten longer levels and gave each one a specific composition,
objective, palette, movement pressure, hazard, and climax. Boss encounters use
their own movement and rotating radial patterns rather than acting as stationary
targets. I checked the level totals and minimum durations with contract tests,
then played later levels using the wave debug display to confirm that enemies
continued arriving without long empty gaps.

> “现在后面关卡因为敌人数量太少，影响核心玩法体验了”

Evidence: [`14557ba`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-lzm-1024/commit/14557bab17535c6486e08226b9e3f77d3ebd60e6)

### Treating performance as part of the game design

Late levels initially became slower as enemies, bullets, and effects
accumulated. Simply reducing enemy counts would have weakened the core promise,
so I kept the encounters and changed the implementation. Projectiles expire
after three seconds; reusable pools avoid repeated allocation; collision uses a
fixed spatial grid; projectile and particle work uses active-object lists; and
shield drones query nearby grid cells instead of scanning every enemy. This
changes the worst shield search from a nested whole-list search to a local
neighbour query. I accepted the refactor only after TypeScript, the production
build, all 42 tests, a Level 9 browser run, and the Boss debug encounter passed
without runtime errors.

> “保证敌人数量不变的情况下优化，变得不卡顿”

Evidence: [`14557ba`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-lzm-1024/commit/14557bab17535c6486e08226b9e3f77d3ebd60e6)

### Making the interface explain the system

The game originally opened directly into combat and important behaviour was
implicit. I added a proper main menu, a How to Play page, and settings that
actually control graphics resolution, anti-aliasing, frame rate, motion,
screen shake, sound, language, and fullscreen state. The rules page now names
all six pickups and explicitly explains that the Bomb clears normal enemies and
enemy bullets but does not instantly kill a Boss. I used one uniform layout
scale inside the 3:4 canvas so desktop and mobile presentations preserve their
geometry instead of stretching. I verified the rendered menus in the browser,
including the Chinese rules page, rather than relying only on canvas
coordinates in code.

> “一个比例，手机和网页都合适”

Evidence: [`14557ba`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-lzm-1024/commit/14557bab17535c6486e08226b9e3f77d3ebd60e6)

### Keeping decisions in the harness

The carried-forward engineering rules require real-browser inspection,
testable game logic, responsive verification, and one source of truth for each
control. I converted the prototype's important promises into tests for level
configuration, Boss movement and durability, bullet patterns, enemy escape,
menu hit targets, upgrade pacing, and complete five-language copy. This made
later refactors safer because the game could change internally while its
contracts remained visible and executable.

Evidence: [`07a2434...14557ba`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-lzm-1024/compare/07a2434...14557bab17535c6486e08226b9e3f77d3ebd60e6)

