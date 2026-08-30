# Contract

## Data Source

- Intended source: Supabase (PostgreSQL) — colony state, auth, and real-time subscriptions; Supabase serverless functions for authoritative tick route
- Ownership and access: Server session authentication; client never writes authoritative state directly

## Ownership

- One colony per account. A colony is created on first sign-in and never reset thereafter, with one exception below.
- Each account has its own row in a users table, separate from the colony's own state — matching the identity split DATABASE.md requires between this application and Waypoint. It holds bestSolsSurvived, the one piece of account-level data that outlives a colony restart.
- A colony in `game_over` status may be restarted by the same account, from the game-over screen only. This is the one exception to "never reset" — a player's own deliberate action, not something the server or an agent triggers on its own.
- Restarting returns oxygen, power, ore and the ore reserve to starting values, and clears buildings and colonists. Status returns to `active`. bestSolsSurvived is untouched — it lives on the account, not the colony.

## Simulation Rules

### Tick
- Tick interval: 1 second of real time
- lastTickAt stored with colony state
- Applying N ticks in one batch must produce exactly the same state as applying N ticks one at a time

### Starting State
- A new colony starts with oxygen 50, power 50, no buildings, no colonists, ore 0, ore reserve 500

### Buildings
- habitat: houses 2 colonists, draws 2 power/tick
- solar: produces 5 power/tick, draws 0
- scrubber: produces 4 oxygen/tick, draws 3 power/tick
- extractor: produces 3 ore/tick, draws 4 power/tick

### Resources
- oxygen and power are pools, 0–100, clamped at both ends
- Each colonist consumes 3 oxygen/tick

### Ore
- ore is a stockpile, not a pool: 0 or above, no upper clamp
- ore does not participate in the health rule. Only oxygen and power can trigger colonist health loss

### Ore Reserve
- A fixed underground reserve of 500 ore, set once at colony creation, never replenished
- Each tick the extractor produces, the reserve drops by the same amount produced
- Once the reserve reaches 0, the extractor produces 0 ore/tick from then on. It still draws power — an idle extractor is not a free one

### Placement Costs
- habitat: 20 power
- solar: 15 power
- scrubber: 15 power, 5 ore
- extractor: 25 power
- A placement is rejected if the account cannot afford its cost. Cost is deducted server-side the instant placement succeeds

### Health
- If oxygen is 0 OR power is 0 at end of tick: every colonist loses 5 health
- Otherwise: colonists recover 1 health per tick, up to 100

### Colonist Death
- A colonist whose health reaches 0 dies and is removed from the colony in the same tick

### Game Over
- If the last colonist dies, colony status becomes `game_over`. No further ticks are applied once set — every tick requested after that, including catch-up, returns the state unchanged
- 1 sol = 1000 ticks. Sols survived is the tick count at the moment of game over, divided by 1000, rounded down
- At the moment of game over, compare sols survived against the account's bestSolsSurvived. If higher, update it. If not, leave it unchanged

### Colonist Arrivals
- A ship lands every 300 ticks, adding one colonist — capped by total habitat capacity (2 colonists per habitat)
- No landing occurs if capacity is already full
- New colonists appear at the fixed landing zone, tile (0, 0)

### Colonist movement
- Colonists move one tile per tick toward a destination building, stopping adjacent
- Movement advances inside the tick function, not in rendering
- Every movement choice must be deterministic — no fresh random numbers
- A newly-landed colonist is assigned a destination — the nearest habitat with unclaimed capacity — in the same tick it's created. Capacity is claimed on assignment, not on arrival

### Catch-up
- Catch-up capped at 28,800 ticks (8 hours)

## State Shape

Every field that needs to persist, in one place — the source of truth for the database schema in Lesson 7.10 and everything the tick function reads or writes in Lesson 7.11.

- ownerId
- oxygen, power — 0–100
- ore — stockpile, 0 or above
- oreReserve — 500 at creation, depletes toward 0
- tick — monotonic counter
- lastTickAt — timestamp of the most recent applied tick
- status — `active` or `game_over`
- buildings — array of `{ type, x, y }`
- colonists — array of `{ x, y, health, destination, route }`

Sols survived is never stored. It's derived at display time from `tick`, per the Game Over rule above.

## Account Data

Fields that persist per account, separate from any single colony — outlives a colony restart even though the colony's own state doesn't.

- bestSolsSurvived — 0 at account creation, updated only when a colony's sols at game over exceed the current value

## Pieces

| Piece | Must do |
| --- | --- |
| Auth & Session Manager | Authenticate player, load active colony session, handle reconnects |
| Isometric Canvas Renderer | Render terrain tiles, buildings, resource overlays, and colonist sprites via 2D Canvas |
| Tick Client | Send player actions to serverless tick route; apply authoritative state from Supabase; project state forward on client for display between writes |
| HUD & Text Info Panels | Display colony metrics (oxygen, power, ore, colonist health) and building placement toolbars in plain text/DOM |
| Building & Placement Controller | Handle cursor tile hovering, building validity and affordability checks, and placement requests |
| Catch-up Handler | Apply batched offline ticks on load up to the 28,800 tick ceiling |
| Game Over Screen | Display sols survived when the colony ends; offer a "Start New Colony" action that resets the account's colony to starting state |

## States

| Piece | State | Trigger | Required rendering and behavior |
| --- | --- | --- | --- |
| Auth & Session Manager | unauthenticated | Initial app load without valid auth session token | Display plain-text login/session form; halt game state subscriptions |
| Auth & Session Manager | authenticating | User submits credentials / token | Show authenticating status indicator; await session response |
| Auth & Session Manager | session_active | Valid session established | Load colony data, initialize real-time subscription, and proceed to simulation |
| Auth & Session Manager | reconnecting | Real-time connection dropped | Display yellow pulsing status text "Re-establishing Uplink..."; attempt exponential backoff |
| Auth & Session Manager | session_expired | Session invalidated or token rejected | Clear active session token, pause actions, return to login/auth prompt |
| Tick Client | idle | Authoritative state up to date and no pending user actions | Await new simulation tick or user inputs |
| Tick Client | submitting_action | Player dispatches placement or colony action | Dispatch action to serverless tick route with rate-limiting throttle |
| Tick Client | awaiting_state | Action acknowledged, waiting for server tick execution | Maintain client projection while waiting for authoritative state payload |
| Tick Client | projection_active | Simulation time advances between server writes | Run deterministic client projection for UI readouts and animations without mutating authoritative store |
| Tick Client | offline | Network or real-time connection severed | Display persistent amber banner "Telemetry Lost - Actions Paused"; pause action dispatch |
| Isometric Canvas Renderer | idle_viewing | Canvas active, no placement tool selected | Render terrain, placed structures, and colonists with standard viewport loop |
| Isometric Canvas Renderer | tile_hovered | Cursor hovers over grid tile | Highlight hovered tile boundary using isometric coordinate transform |
| Isometric Canvas Renderer | panning_zoom | User drags canvas or scrolls wheel | Adjust viewport camera offset / zoom scale without altering grid coordinates |
| Isometric Canvas Renderer | placing_structure | Structure placement tool active over valid tile | Render green-tinted tile outline and building preview sprite |
| Isometric Canvas Renderer | invalid_placement | Structure placement tool hovered over blocked/invalid tile, or placement rejected for insufficient power/ore | Render red-tinted outline; show plain-text blocker reason in status bar |
| HUD & Text Info Panels | nominal | Oxygen, power, and colonist health levels all above warning threshold | Display metrics in standard text color (#d9dde0) |
| HUD & Text Info Panels | warning_resource_low | Either oxygen or power approaches zero | Render low-resource metric readout with warning status highlight (#E0A030) |
| HUD & Text Info Panels | critical | Either oxygen or power reaches zero | Display critical status alert border (#D94F3D) and trigger colonist health degradation |
| Catch-up Handler | idle | Colony loaded in real-time or caught up | No action required |
| Catch-up Handler | computing | Player loads colony after offline duration | Compute and apply batched server tick catch-up calculations sequentially |
| Catch-up Handler | capped | Offline duration exceeds 28,800 ticks | Cap catch-up at 28,800 ticks; render notification that simulation reached max offline ceiling |
| Game Over Screen | inactive | Colony status is active | Not rendered; normal HUD and canvas shown |
| Game Over Screen | shown | Colony status becomes game_over | Replace normal view with sols-survived display and a "Start New Colony" button |

## States That Must Differ

| Piece | State A | State B | Required distinction |
| --- | --- | --- | --- |
| Building & Placement Controller | Placing Structure (Valid) | Placing Structure (Invalid) | Valid shows green-tinted tile outline / preview; Invalid shows red-tinted outline with plain-text blocker reason in the status bar (e.g. "Insufficient Power" or "Obstacle Blocked") |
| Tick Client | Reconnecting (Colony Syncing) | Offline (Telemetry Lost) | Reconnecting shows yellow pulse status text "Re-establishing Uplink..."; Offline shows persistent amber banner "Telemetry Lost - Actions Paused" |
| Building & Placement Controller | Extractor Producing (Reserve Available) | Extractor Idle (Reserve Depleted) | Producing shows the vent glow per DESIGN.md's state-on-screen rules; Idle shows the same structure with no glow, and the panel's ore line stops increasing while power draw continues unchanged |

## Failures and Edge Cases

| Piece or source | Failure or edge case | Required behavior |
| --- | --- | --- |
| Network | Disconnect / Telemetry Loss | Retain last rendered snapshot, display "Telemetry Lost", retry Supabase real-time connection with exponential backoff up to 5 times |
| Tick Client | Tick Route Timeout or 500 | Discard client's projected state, re-fetch authoritative colony state from Supabase, and show transient error in status bar |
| Auth & Session Manager | Unauthorized / Expired Session | Clear active session, return to login/auth prompt without wiping local client cache |
| Building & Placement Controller | Rate-Limited Dispatch | Throttle client input dispatch with visual cooldown indicator on action bar |
| Catch-up Handler | Catch-up Ceiling Reached | Cap catch-up computation at 28,800 ticks, display notice indicating simulation capped at maximum offline duration |
| Tick Function | Ore Reserve Exhausted | Extractor production drops to 0/tick; power draw continues unchanged; not an error state, this is expected steady-state behavior |
| Tick Function | Last Colonist Dies | Set colony status to game_over; stop applying further ticks, including catch-up; display sols survived on the Game Over Screen |
| Tick Function | Restart Requested | Only honored when colony status is game_over and the request originates from the Start New Colony button; resets oxygen, power, ore, and the ore reserve to starting values, clears buildings and colonists, sets status to active |

## TODOs

- None