---
version: alpha
name: "Mars Colony Telemetry Design System"
description: "Stark, utilitarian Mars mission telemetry — functional readouts, no decoration."
colors:
  base: "#1a0e08"
  text: "#d9dde0"
  accent: "#7fd4e0"
  warning: "#E0A030"
  critical: "#D94F3D"
typography:
  heading:
    fontFamily: "Orbitron"
  body:
    fontFamily: "Chakra Petch"
rounded:
  default: "0px"
spacing:
  base: "4px"
---

# Mars Colony Telemetry Design System

## Overview

Stark, utilitarian Mars mission telemetry — functional readouts, no decoration. The interface adopts a dark-only theme with high contrast against the Martian terrain.

## Colors

- Base: `#1a0e08` (Dark rust-brown, consistent with terrain palette)
- Text: `#d9dde0` (High legibility off-white/light gray)
- Accent: `#7fd4e0` (Cyan structure accent)
- Warning: `#E0A030` (Low-resource caution status)
- Critical: `#D94F3D` (Life support failure / emergency alert)

The accent (`#7fd4e0`) is permitted only for the active tool selector in the building toolbar. All other uses are forbidden. Critical alerts use `#D94F3D`.

## Typography

- Heading: `Orbitron` (Google Fonts) for titles, system headers, and section labels.
- Body: `Chakra Petch` (Google Fonts) for high-density telemetry numbers, status metrics, and plain-text readouts.

## Layout

High-density compact layout based on a `4px` base spacing token. Panels are compact telemetry readouts designed for dense information display rather than spacious UI.

## Elevation & Depth

No shadows, no gradients. Interfaces use flat rendering with crisp contrasting boundaries.

## Shapes

All shapes, panels, and borders use `0px` radius (strictly sharp, utilitarian industrial corners).

## Building Silhouette

Each building type is identifiable by shape alone, no labels needed:

- habitat: rounded and low
- solar: flat and angular
- extractor: wide and low, with an angled scoop silhouette
- scrubber: tall and narrow
- farm: broad and flat, a grid-like surface pattern rather than a solid mass
- garage: boxy and squared-off, with straightened isometric geometry; roof features twin beacon indicators displaying parked rover occupancy at a glance (0, 1, or 2 docked rovers)
- refinery: grounded heavy industrial furnace anchored to the terrain bedrock with a tall refining stack, catalytic reaction vessel, and battery storage manifold

All seven must read as distinct from one another at a glance.

## State on Screen

- Solar arrays glow while power > 0; go dark when the grid fails
- Scrubbers show a faint vent plume while producing oxygen
- Extractors show a faint vent glow while producing ore; the glow stops the instant that tile's deposit is exhausted, even though the building keeps drawing power
- Farms show a faint green tint while producing food; the tint fades when power fails, same logic as the other producers
- Scene tints with oxygen level — clear when healthy, dusty haze as it drops
- Colonists stand upright at full health; slump as health falls; a colonist past three-quarters of their own seeded lifespan shows visibly greyed hair or an equivalent aging cue, distinct from health-based slumping — each colonist ages on their own clock, so this triggers at a different tick for every one of them. Colonists walk steadily at 1 tile per 5 ticks
- A broken building shows its normal silhouette with a small fault indicator — a flickering marker, not a colour change, since colour is reserved for the warning/critical palette
- A buried building is mostly obscured by a terrain-coloured overlay matching the surrounding tint; its silhouette should still be barely legible underneath, not fully hidden
- Tile (0, 0) features a permanent designated Landing Pad (a clean, minimalist circular ring on the tile). Building on tile (0, 0) is strictly blocked
- When a transport ship arrives, a simple conical landing capsule with small landing legs and a circular blue viewport rests on tile (0, 0), cleanly covering the landing pad circle
- A rover renders as a simple 4-wheeled car/buggy with dual seats dynamically rendering 0, 1 (driver in spacesuit with gold visor), or 2 (driver and passenger in spacesuits with gold visors) seated colonists
- An active asteroid renders as a multi-faceted 3D cratered meteorite with surface impact depressions and glowing mineral veins
- All of these read from state. None animate on their own timer.

## Components

Panels and the toolbar are plain text DOM elements rendered alongside or over the HTML5 2D Canvas viewport. The toolbar uses the accent color (`#7fd4e0`) only for the active selection, with all other items rendered in plain text color (`#d9dde0`). There are no heavy styled buttons, gradients, or modal dialogues.

### Header Bar & Guest Account Upgrade

A compact telemetry status bar in the top-right displays the current session uplink (`GUEST [id]` or operator email). For anonymous guest uplinks, an `UPGRADE ACCOUNT` affordance opens a flat modal dialogue allowing operators to attach permanent email credentials and password to their colony without losing current state.

### Viewport Navigation (Pinch-to-Zoom & Pan)

The 2D Canvas supports multi-touch pinch-to-zoom (1.0x to 3.5x scale) and pan offset navigation on touch devices, as well as mouse wheel zooming, maintaining crisp pixel grid alignment.

### Toolbar, Actions & Cooldown Bar

- **Building Selection**: Grid of 7 structure tools, collapsing into a custom telemetry dropdown drawer on narrow screens.
- **Colony Actions**: Dedicated dispatch buttons for `Refine Cell (10 Ore)`, `Dispatch Escort`, `Dispatch Mining`, `Toggle Power`, and `Move Extractor (10P)`.
- **Mobile Dropdown Navigation Toolbar**: On mobile viewports and narrow displays, the toolbar automatically collapses into expandable custom dropdown panels for both building placement tools and colony action dispatches, triggered by compact arrow indicators (`▼`/`▲`) with full touch responsiveness.
- **Action Rate-Limiting**: A subtle 600ms horizontal cooldown progress bar along the toolbar top edge throttles rapid dispatch inputs.

## Life Support Telemetry

The styled, player-facing counterpart to the diagnostic panel — everything the diagnostic panel shows, except signed-in account and colony owner. Full parity, not a subset: tick, oxygen, power, food, ore, electronics, colonist health and age, building condition, pending arrivals, rover and battery status all appear here, in whatever form each already takes in the diagnostic panel.

Oxygen, power, food, and colonist health get bars, colour-shifting through warning (`#E0A030`) and critical (`#D94F3D`) as they drop — the four numbers where "getting low" is a genuine life-support threat, matching the HUD states CONTRACT.md already specifies. A pending arrival's countdown gets the same warning colour once it drops under 30 ticks, per the Landing Zone states-that-must-differ rule — the one non-life-support number that still earns the palette, because losing a colonist and their electronics to an ignored countdown is exactly the kind of failure this colour exists to prevent. Ore, electronics, tick, last applied tick, building list, and rover status are plain numbers or text, no bar, no colour shift — nothing else here threatens a colonist directly, so the warning palette stays reserved for what actually does.

This panel is where CONTRACT.md's `HUD & Text Info Panels` piece is actually implemented for a player. The diagnostic panel exists in parallel, for a different reason, and neither replaces the other.

## Landing Zone

A pending arrival stands at tile (0, 0) rendered like any colonist — same figure, same posture rules — but with a countdown above them showing ticks remaining before their escort window closes. Standard text colour above 30 ticks, warning colour below it, no other change. No animation on the transition; the colour just changes the tick it changes, same as every other state-driven visual in this document.

## Diagnostic Panel

Two blocks within the same panel, separated by a thin rule. Session identity on top — signed-in account, colony owner — kept small, since it exists purely to confirm identity and isolation and is never meaningful to a player. Full state below: tick, oxygen, power, food, ore, electronics, colonist health and age, pending arrivals, building condition, rover and battery status, last applied tick.

Both blocks stay plain text, no colour, no animation — the verification discipline from Lesson 7.5 onward doesn't relax here, this only reorganizes for clarity. The panel's id doesn't change; every playtest scenario since Lesson 7.6 reads from it by that id, reorganized or not.

Once Life Support Telemetry has full parity with this panel, this one is no longer meant for a player to see at all. It renders only when the URL includes `?debug=true` — absent by default, so a real player never encounters it, present on demand for verification. `/browser` checks and the playtest skill navigate with the flag included; nothing else about how they read the panel changes.

## Game Over Screen

Plain text, same palette and type as the rest of the interface. No colour deviation, no animation — sols survived this run, the account's best sols survived, and a single "Start New Colony" button, nothing more. It replaces the normal view entirely rather than overlaying it.

## Help Modal

Same palette and type as everything else — plain text, no imagery. Opens over the current view rather than replacing it, unlike the Game Over Screen; the colony keeps ticking underneath. A "?" affordance sits in the bottom-right corner at all times, closeable, available in any game state.

Worth being clear on why this is a second info panel and not one shared with the existing readout: the readout panel in the top-left corner exists for whatever is verifying the build — an agent, a browser check — and answers "what is the state right now." This one exists for the player and answers "what am I supposed to do." Different audience, different corner, never merged.

## Do's and Don'ts

- DO keep the dark theme fixed; no light mode.
- DO update telemetry numbers instantly on value change without tweening or animation.
- DO draw all game elements in code on the 2D Canvas surface; never load external image assets.
- DON'T use the accent color `#7fd4e0` for danger signals or critical alert borders; use `#D94F3D` for critical and `#E0A030` for warning.
- DON'T apply border radiuses, box shadows, gradients, or animated transitions.