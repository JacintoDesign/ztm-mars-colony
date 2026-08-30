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

All four must read as distinct from one another at a glance.

## State on Screen

- Solar arrays glow while power > 0; go dark when the grid fails
- Scrubbers show a faint vent plume while producing oxygen
- Extractors show a faint vent glow while producing ore; the glow stops the instant the reserve is exhausted, even though the building keeps drawing power
- Scene tints with oxygen level — clear when healthy, dusty haze as it drops
- Colonists stand upright at full health; slump as health falls
- All of these read from state. None animate on their own timer.

## Components

Panels and the toolbar are plain text DOM elements rendered alongside or over the HTML5 2D Canvas viewport. The toolbar uses the accent color (`#7fd4e0`) only for the active selection, with all other items rendered in plain text color (`#d9dde0`). There are no heavy styled buttons, gradients, or modal dialogues.

## Game Over Screen

Plain text, same palette and type as the rest of the interface. No colour deviation, no animation — sols survived this run, the account's best sols survived, and a single "Start New Colony" button, nothing more. It replaces the normal view entirely rather than overlaying it.

## Help Modal

Same palette and type as everything else — plain text, no imagery. Opens over the current view rather than replacing it, unlike the Game Over Screen; the colony keeps ticking underneath. A "?" affordance sits in the top-right corner at all times, closeable, available in any game state.

Worth being clear on why this is a second info panel and not one shared with the existing readout: the readout panel in the top-left corner exists for whatever is verifying the build — an agent, a browser check — and answers "what is the state right now." This one exists for the player and answers "what am I supposed to do." Different audience, different corner, never merged.

## Do's and Don'ts

- DO keep the dark theme fixed; no light mode.
- DO update telemetry numbers instantly on value change without tweening or animation.
- DO draw all game elements in code on the 2D Canvas surface; never load external image assets.
- DON'T use the accent color `#7fd4e0` for danger signals or critical alert borders; use `#D94F3D` for critical and `#E0A030` for warning.
- DON'T apply border radiuses, box shadows, gradients, or animated transitions.