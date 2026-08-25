# COMP4020 prototype

Your starter repo for a COMP4020 prototype: a static site in HTML/CSS/TypeScript
that builds to plain HTML/CSS/JS and deploys to GitHub Pages. The deployed site
is what gets marked, not this repo.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Run `pnpm check` before you push.
- Open the page in a browser and look at it. The rendered page is the truth;
  your mental model of it isn't.
- When a check fails, read its output before you change anything.
- Never commit a red state.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `index.html`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names it,
like any link --- `./card.png` is wrong one directory down, and nothing in CI
checks it, so the deployed head is the only place a broken one shows up.

## The checks

`pnpm check` runs them, and `pnpm check:evidence` is the extra gate before you
ship. CI runs the same plus links, secrets and the deploy.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for.

## This file is yours

A starting point, not a rulebook: what you add to it is the harness, and the
harness is assessed. This file and the sensors you wire into `check` carry
across the course --- both come with you into next week's repo. The prototype
doesn't: source, and the tests answering this week's published spec, stay
behind. `spec/README.md` draws the line.

### Project-specific engineering rules

Carried forward from crit 2 and held through crit 4, minus the rules specific
to those weeks' briefs (the ANU Sport redesign, the instrument's own audio
wiring). These are general conventions that held up across two builds and are
worth holding the agent to again.

- **Keep the technical contract intact.** The shipped site must remain plain
  HTML and CSS with no frameworks, component runtimes, or third-party UI/JS
  libraries. Do not introduce a new dependency when the same result can be
  expressed clearly with the existing stack.
- **Use JavaScript as progressive enhancement.** Vanilla TypeScript or
  JavaScript may power the core interaction, filtering, saved preferences,
  accessibility controls, and motion. Core content must remain readable
  without it, and all motion must be neutralised under
  `prefers-reduced-motion: reduce`.
- **Separate structure from presentation.** HTML owns content, document
  structure, links, labels, and accessibility semantics. `styles.css` owns all
  visual presentation. Do not use inline `style` attributes or presentational
  markup to work around the stylesheet.
- **Use small reusable CSS components.** Reuse existing component classes for
  repeated ideas. Prefer one clear class with a narrow responsibility over
  long selectors that depend on a particular DOM nesting structure. Add a new
  component class only when a pattern is repeated or has a distinct meaning.
- **Use design tokens for repeated visual decisions.** Shared colours,
  spacing, type scale, radius, elevation, and motion durations/easings belong
  in CSS custom properties near the top of `styles.css`. Do not scatter
  unexplained near-duplicate values through the file.
- **Keep CSS organised from general to specific.** Maintain this order:
  design tokens and reset, global typography and links, shared layout,
  reusable components, page-specific sections, responsive rules, and
  reduced-motion rules. Put a short heading comment above each major section;
  do not split the stylesheet merely to make the file tree look more
  sophisticated.
- **Make content and markup readable.** Use semantic elements, descriptive
  class names, correctly associated form labels, useful image `alt` text, and
  concise headings. Keep indentation consistent. Comments should explain a
  non-obvious decision or constraint, not repeat what the code already says.
- **Represent static interactions honestly.** There is no backend. Keep
  static-demo notices visible where relevant and use `type="button"` where
  submission would otherwise imply a working server.
- **Change the smallest coherent unit.** Before editing, inspect the relevant
  HTML, its shared styles, and the tests that express its contract. Avoid
  broad rewrites for a local change. When a shared pattern changes, verify
  every page that uses it at desktop and mobile sizes.
- **Prefer evidence over assumptions.** After a meaningful change, run
  `pnpm check`, then inspect the rendered result at 1920x1080 and 390x844.
  Check focus visibility, text contrast, overflow, navigation, image loading,
  and form labels. A green test suite does not replace visual inspection.
- **Do not over-engineer.** Do not create utility layers, naming systems,
  templates, generators, or abstractions for a single use. Duplication is
  worth removing when it represents a stable shared concept; two superficially
  similar blocks may remain separate when combining them would make either one
  harder to understand or change.

### Corrections carried forward from Assignment 1 and Crit 4

Generalised from failures in the stopping-distance explainer and the Ripple
water synthesiser --- the domain-specific rules (tyre/road evidence, the
car-truck dataset split, five-language localisation, audio gain staging)
don't apply to this week's brief and were dropped; these principles held up
independent of the domain.

- **One source of truth for every control.** A slider, knob or other input's
  value, its displayed value, and whatever output or visual it drives must
  derive from the same state. A control that moves without changing the
  output is a failing interaction.
- **Keep calculations pure and testable.** Whatever model drives the
  prototype's core behaviour (game logic, physics, scoring, audio synthesis
  --- whatever this week's brief calls for) belongs in typed pure functions.
  UI modules may format, render, or animate the result but must not duplicate
  the underlying logic. Every boundary, interpolation rule, and new outcome
  requires a unit test.
- **Verify interaction states, not only initial screenshots.** At 1920x1080
  and 390x844, actually operate the core control(s), resize during an
  interaction, tab through controls with the keyboard, and confirm feedback
  remains understandable without colour alone. JSDOM tests alone do not
  satisfy this --- look at the rendered result in a real browser.
- **Make timing and motion explicit.** Where a control has any built-in delay
  or latency (audible, visual, or otherwise), disclose it rather than leaving
  it to be discovered. Meaningful content and feedback must remain usable
  under `prefers-reduced-motion: reduce`.
