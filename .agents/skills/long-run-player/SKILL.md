---
name: long-run-player
description: Play a fresh colony as far as it survives using catch-up to compress time, placing buildings via browser and querying state via Supabase CLI, and report sols survived and CONTRACT.md inconsistencies without fixing them.
---

# Long-Run Player Skill

Play a fresh colony as far as it survives using catch-up to compress time, placing buildings via the browser and checking state between rounds with the Supabase CLI, and report the outcome.

## Core Rule: Never Fix Anything
This skill is purely about playing the game. **Never modify, patch, or fix game source code or database schemas.** If a bug, glitch, unexpected behavior, or discrepancy with `CONTRACT.md` is discovered, record it in the final report for human review.

---

## Workflow Instructions

### 1. Setup & Starting Move
1. Sign in as a disposable test account (e.g. anonymous guest or fresh test operator) to start from a brand new, empty colony.
2. Use the `/browser` subagent to place the **first Habitat** on the isometric canvas.
   - *Rationale:* No transport ship will land or deposit colonists without habitat capacity to shelter them (2 colonists per habitat).

### 2. Time-Compressed Play Loop (10-Minute Limit)
Run the loop for up to **10 minutes of real time** or until the colony reaches `game_over`.

In each round:
1. **Advance Simulation via Catch-up**:
   - Advance the colony along the catch-up path in chunks up to the **28,800 tick cap** (8 hours of simulation time per chunk).
2. **Check State via Supabase CLI**:
   - Query the colony state via the Supabase CLI (`supabase` or direct database query commands) rather than opening the browser between every round. This minimizes browser overhead and fits maximum rounds into the 10-minute real-time budget.
   - Inspect:
     - `tick`, `status`, `oxygen`, `power`, `ore`, `ore_reserve` from `marscolony_colonies`
     - Placed structures from `marscolony_buildings`
     - Living colonists and health metrics from `marscolony_colonists`
3. **Analyze Balance & Determine Next Move**:
   - Evaluate life support balance using exact numbers from [CONTRACT.md](../../CONTRACT.md):
     - **Power Balance:** Solar (+5 PWR/tick) vs. Habitat (-2), Scrubber (-3), Extractor (-4).
     - **Oxygen Balance:** Scrubber (+4 O2/tick) vs. Colonists (-3 O2/tick per colonist).
     - **Population & Capacity:** New colonist arrives every 300 ticks capped at `2 * numHabitats`.
     - **Ore Reserve & Costs:** Extractor produces 3 Ore/tick until 500 reserve depletes.
       - Habitat: `20 PWR`
       - Solar: `15 PWR`
       - Scrubber: `15 PWR, 5 ORE`
       - Extractor: `25 PWR`
4. **Place Structure via Browser**:
   - If a building is affordable and required to prevent starvation, support incoming colonists, or sustain power/oxygen, invoke `/browser` to place the building.
5. **Check Termination**:
   - If `status === 'game_over'` or 10 minutes of real time have elapsed, exit the loop immediately.

---

## Final Report Structure

When the run concludes, generate a comprehensive report:

1. **Sols Survived**:
   - Total sols survived (derived as `Math.floor(tick / 1000)` at game over or at end of 10 minutes).
2. **Colony Status & Snapshot**:
   - Final status (`active` or `game_over`).
   - Final resource pools (`oxygen`, `power`, `ore`, `ore_reserve`).
   - Final structure counts (`habitats`, `solars`, `scrubbers`, `extractors`).
   - Final colonist population and health metrics.
   - What the colony was doing at the moment it stopped.
3. **Chronological Progression Log**:
   - Summary of rounds, catch-up batches applied, major building decisions, and population milestones.
4. **Inconsistencies & Anomalies vs. CONTRACT.md**:
   - Detailed list of any discrepancies observed between simulation behavior and `CONTRACT.md` (e.g. calculation mismatches, unexpected state mutations, timing glitches).
   - Do not fix them; present them for review.
