# Handoff: TrackIt — Today + Active Workout Logging (iPhone)

## Overview
TrackIt is a gym-lift tracker. This handoff covers the two core screens plus a post-workout
summary: **Today** (what you're lifting, prefilled from last session), **Active workout**
(tap-to-log sets with a rest timer), and **Logged** (session summary).
Primary user: an intermediate lifter tracking progressive overload. Copy tone: plain and factual.

## About the Design Files
The files in `design/` are **design references created in HTML** — a working prototype of the
intended look and behavior, not production code to copy. The task is to **recreate these screens
in the target codebase's environment** (React Native / SwiftUI / Flutter / web) using its existing
patterns, navigation, and component library. If no environment exists yet, pick the framework
appropriate for an iOS-first fitness app and implement there.

`TrackIt.dc.html` is a single-file prototype: markup at the top, a `Component` class with the
state logic at the bottom. `ios-frame.jsx` is only the device bezel for presentation — do not port
it. `design/_ds/…/styles.css` is the design-token sheet (Broadsheet design system).

## Fidelity
**High fidelity.** Final colors, type, spacing, hit targets and interactions. Recreate pixel-close,
substituting the codebase's own primitives where they exist. Device canvas: 402 × 874 pt (iPhone 16).
Content inset: 24pt left/right; content starts 62pt from the top (below status bar) and ends 44pt
from the bottom (above home indicator).

## Screens / Views

### 1. Today
**Purpose:** see today's session at a glance and start it.

Vertical stack, 30pt gaps, 24pt side padding:
1. **Header row** (space-between, baseline): `TrackIt` — 13px, weight 600, uppercase,
   letter-spacing 0.2em. Right: unit toggle `lb` / `kg` — 13px uppercase, letter-spacing 0.12em,
   color `--color-accent-700` (#006786), 44pt min hit height. Tap toggles all weights in the app.
2. **Dateline block** (10pt gaps): `Saturday 29 August` — 13px uppercase, 0.14em, `--color-neutral-600`
   (#7d7979). Title `Push A` — 46px, weight 600, line-height 1.02, letter-spacing -0.01em.
   Sub `Week 6, day 12 · last done 5 days ago` — 17px, `--color-neutral-700` (#605d5d).
3. **Plan list** — one row per lift, `grid-template-columns: 1fr auto`, 15pt gap, 14pt vertical
   padding, no dividers. Left: lift name 21px/600; under it `last time 180 × 5` 14px neutral-600.
   Right: `4 × 5  ·  185 lb` 19px, `--color-neutral-800` (#444141), nowrap.
4. **Primary button** `Begin workout` — full width, min-height 56pt, background `--color-accent`
   (#0088b0), white text 20px/600, radius 2px. Hover `--color-accent-600` (#1186ac),
   pressed `--color-accent-700` (#006786).
5. **Recent days** — section label `RECENT DAYS` 13px uppercase 0.16em neutral-600, then rows of
   `grid-template-columns: 62px 1fr auto`: weekday 14px neutral-600, name 17px/600, volume 15px
   neutral-700.

### 2. Active workout
**Purpose:** log each set in one tap at last session's numbers.

1. **Top bar** (space-between, center): `12:04 ELAPSED` — 15px uppercase 0.14em neutral-700,
   tabular numerals, ticking every second. Right: `Finish` — 15px uppercase accent-700, 44pt tap.
2. **Lift header** (6pt gaps): `LIFT 1 OF 4` 13px uppercase 0.14em neutral-600;
   name `Bench Press` 38px/600 line-height 1.05; `2 of 4 sets logged · target 5 reps` 16px neutral-700.
3. **Set table** — 4-column grid `34px 1fr 1fr 44px`, 10pt gap.
   Header row: `SET / WEIGHT / REPS` 12px uppercase 0.14em neutral-600, 8pt bottom padding.
   Each set row: min-height 60pt, 1px top border `--color-divider`
   (`color-mix(in srgb, #201e1d 16%, transparent)`), tabular numerals, whole row tappable.
   - *Pending:* weight and reps 23px `--color-neutral-500` (#9b9797), trailing empty square glyph
     `--color-neutral-400` (#bab6b6) 22px.
   - *Logged:* weight and reps 23px/600 full `--color-text` (#201e1d), trailing check `✓` 24px
     `--color-accent-700`.
   - Hover on row: background `--color-accent-100` (#e9f8ff).
   - Tap toggles logged/unlogged; logging starts the rest timer, unlogging clears it.
4. **Adjust next set** — label 12px uppercase; two steppers 30pt apart. Each: 44×44 square button,
   1px `--color-neutral-400` border, radius 2px, 22px `−` / `+`; hover border+text to accent.
   Center readouts: weight `185 lb` (min-width 76pt) and `5 reps` (min-width 54pt), 20px, centered,
   tabular. Weight steps ±5 (never below 0), reps ±1 (never below 1). Edits apply to the next
   *pending* set only. Hidden when all sets of the lift are logged.
5. **Rest timer** (appears after logging a set) — `Rest 1:24` 22px/600 `--color-accent-2-700`
   (#aa0b56) — the only magenta in the app; right `SKIP` 14px uppercase accent-700.
   Enters with 220ms ease-out fade + 6pt rise. Counts down from 90s (configurable) to 0, then hides.
6. **Lift chips** — pinned to the bottom of the screen. Label `TODAY'S LIFTS` 12px uppercase;
   wrapping row, 10pt gap. Chips: 10/14pt padding, min-height 44pt, radius 2px, 15px.
   Active chip: accent fill, white text. Idle: 1px neutral-400 border, neutral-800 text, shows
   progress count `2/4`; hover border+text accent. Tap switches the current lift and clears rest.

### 3. Logged (summary)
`SATURDAY 29 AUGUST · LOGGED` 13px uppercase neutral-600; `Push A` 46px/600;
`9 sets · 11,240 lb total volume · 41:20` 18px neutral-700; then one row per lift
(`1fr auto`, 12pt padding, 1px top divider): name 19px/600, right detail
`4 × 5 @ 185 lb` or `not logged` 17px neutral-700. Footer button `Back to today` (same as primary
button above) resets the session.

## Interactions & Behavior
- `Begin workout` → Active workout; elapsed timer starts at 0 and ticks 1/s while on that screen.
- Tap set row → toggle logged. On log: rest timer = restSeconds (default 90). On unlog: rest = 0.
- `− / +` adjust the next pending set's weight (±5) and reps (±1).
- Chip tap → change current lift, rest cleared. Sets per lift keep their own state.
- `Finish` → summary (counts only logged sets). `Back to today` → full reset of log, lift index,
  elapsed and rest.
- `lb`/`kg` toggle converts every displayed weight: `round(lb × 0.4536 × 2) / 2` with a `kg` suffix.
- No dividers or cards for layout — whitespace only. Row rules exist only inside the set/summary tables.
- All tap targets ≥ 44pt. Keyboard/focus (if ported to web): `outline: 2px solid var(--color-accent);
  outline-offset: 2px`.

## State Management
```
screen: 'today' | 'work' | 'done'
unit:   'lb' | 'kg'
exIdx:  number                        // current lift
elapsed: number (seconds, ticks while screen === 'work')
rest:    number (seconds, decrements to 0 while screen === 'work')
log:     Array<Array<{ done: boolean, weight: number, reps: number }>>
                                       // one array per lift, one entry per set,
                                       // prefilled from last session's weight/reps
```
Config (prototype tweaks → app settings): `unit` default, `showRestTimer` (bool),
`restSeconds` (30–240, step 15, default 90).

Seed data used in the prototype (replace with real persistence):
Bench Press 4×5 @185 (last 180×5) · Overhead Press 3×8 @105 (last 105×8) ·
Incline DB Press 3×10 @60 (last 55×10) · Cable Fly 3×12 @35 (last 35×12).
Recent: Thu Pull B 14,300 lb · Tue Legs A 21,750 lb · Mon Push A 12,400 lb.

## Design Tokens (Broadsheet — see `design/_ds/…/styles.css`)
- Ground `--color-bg` #f3f2f2 · text `--color-text` #201e1d · divider #201e1d @16%
- Accent (cyan, all interactive) #0088b0; hover #1186ac; pressed/text #006786; tint #e9f8ff
- Second accent (magenta, rest timer only) `--color-accent-2-700` #aa0b56
- Neutrals: 400 #bab6b6 · 500 #9b9797 · 600 #7d7979 · 700 #605d5d · 800 #444141
- Type: **Source Serif 4** for everything, headings weight 600 — no sans-serif anywhere,
  including UI chrome. Tabular numerals for all weights, reps, timers.
- Type scale in use: 46 / 38 / 23 / 21 / 20 / 19 / 18 / 17 / 16 / 15 / 14 / 13 / 12 px
- Spacing scale: 5 / 10 / 15 / 20 / 30 / 40 px · Radius: 1 / **2** / 4 px
- Icons (if added): Phosphor, duotone weight

## Assets
None. The check and empty-box marks are text glyphs (`✓`, `□`) — swap for Phosphor duotone icons
(`check`, `square`) when porting. No photography in these screens.

## Files
- `design/TrackIt.dc.html` — the prototype (markup + `Component` state logic)
- `design/ios-frame.jsx` — presentation-only device bezel (do not port)
- `design/support.js` — prototype runtime (do not port)
- `design/_ds/broadsheet-.../styles.css` — design tokens and component classes
- `design/_ds/broadsheet-.../_ds_bundle.js` — design-system bundle used by the prototype

## Running the prototype locally
Serve the `design/` folder over HTTP (e.g. `npx serve design`) and open `TrackIt.dc.html`;
opening it via `file://` will block the local script/stylesheet loads.
