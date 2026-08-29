# SKYFALL

SKYFALL is a colourful vertical shoot 'em up built as the COMP4020 Crit 5
static prototype. The player pilots a continuously firing aircraft through ten
authored levels, increasingly complex enemy formations, environmental hazards,
upgrade choices, and mobile Boss encounters.

The prototype is written in TypeScript and rendered with the Canvas 2D API. It
uses no game engine or third-party runtime.

## Play

- Move with the mouse, touch, WASD, or the arrow keys.
- Weapons fire automatically.
- Press `Space`, or tap the lightning button, when ultimate energy is full.
- Do not let enemies escape the bottom of the combat area; escaped enemies
  damage the player's hull.
- Between levels, select one of three upgrades before continuing.

The in-game **How to Play** page explains every pickup. In particular, the Bomb
pickup clears normal enemies and enemy bullets but does not instantly defeat a
Boss.

## Features

- Ten levels with distinct waves, objectives, hazards, mini-Bosses, and Bosses
- Five interface languages: English, Simplified Chinese, Japanese, Korean, and
  Spanish
- Persistent graphics, anti-aliasing, frame-rate, motion, sound, language, and
  fullscreen settings
- Mouse, touch, and keyboard input with responsive 3:4 presentation
- Weapon, shield, repair, bomb, magnet, and ultimate-energy pickups
- Upgrade, combo, score, shield, ultimate, and high-score systems
- Object pooling, reusable collision grids, active-object lists, and
  three-second projectile lifetimes for stable late-level performance

## Run locally

Requirements: Node.js and pnpm versions compatible with `mise.toml`.

```sh
pnpm install
pnpm dev
```

Open <http://localhost:5173/>.

## Validate

```sh
pnpm check
pnpm check:evidence
pnpm build
```

`pnpm check` runs TypeScript checking, the production build, and the Vitest
suite. The project currently includes 42 automated checks covering gameplay
contracts, level data, localisation, responsive hit targets, and core systems.

## Project structure

- `src/game/` — game loop, configuration, and shared types
- `src/entities/` — player, enemies, Boss, projectiles, and pickups
- `src/systems/` — levels, spawning, audio, hazards, upgrades, and input
- `src/effects/` — background and pooled particle effects
- `src/ui/` — Canvas HUD and menu screens
- `src/i18n/` — the five-language interface copy
- `spec/` — contract and regression tests

