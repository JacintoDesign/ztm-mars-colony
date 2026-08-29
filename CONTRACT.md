# Contract

## Data Source

- Intended source: Supabase (PostgreSQL) — colony state, auth, and real-time subscriptions; Supabase serverless functions for authoritative tick route
- Ownership and access: Server session authentication; client never writes authoritative state directly

## Simulation Rules

### Tick
- Tick interval: 1 second of real time
- lastTickAt stored with colony state
- Applying N ticks in one batch must produce exactly the same state as applying N ticks one at a time

### Buildings
- habitat: houses 2 colonists, draws 2 power/tick
- solar: produces 5 power/tick, draws 0
- scrubber: produces 4 oxygen/tick, draws 3 power/tick

### Resources
- oxygen and power are pools, 0–100, clamped at both ends
- Each colonist consumes 3 oxygen/tick

### Health
- If oxygen is 0 OR power is 0 at end of tick: every colonist loses 5 health
- Otherwise: colonists recover 1 health per tick, up to 100

### Colonist movement
- Colonists move one tile per tick toward a destination building, stopping adjacent
- Movement advances inside the tick function, not in rendering
- Every movement choice must be deterministic — no fresh random numbers

### Catch-up
- Catch-up capped at 28,800 ticks (8 hours)

## Pieces

| Piece | Must do |
| --- | --- |
| Auth & Session Manager | Authenticate player, load active colony session, handle reconnects |
| Isometric Canvas Renderer | Render terrain tiles, buildings, resource overlays, and colonist sprites via 2D Canvas |
| Tick Client | Send player actions to serverless tick route; apply authoritative state from Supabase; project state forward on client for display between writes |
| HUD & Text Info Panels | Display colony metrics (oxygen, power, colonist health) and building placement toolbars in plain text/DOM |
| Building & Placement Controller | Handle cursor tile hovering, building validity checks, and placement requests |
| Catch-up Handler | Apply batched offline ticks on load up to the 28,800 tick ceiling |

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
| Isometric Canvas Renderer | invalid_placement | Structure placement tool hovered over blocked/invalid tile | Render red-tinted outline; show plain-text blocker reason in status bar |
| HUD & Text Info Panels | nominal | Oxygen, power, and colonist health levels all above warning threshold | Display metrics in standard text color (#d9dde0) |
| HUD & Text Info Panels | warning_resource_low | Either oxygen or power approaches zero | Render low-resource metric readout with warning status highlight (#E0A030) |
| HUD & Text Info Panels | critical | Either oxygen or power reaches zero | Display critical status alert border (#D94F3D) and trigger colonist health degradation |
| Catch-up Handler | idle | Colony loaded in real-time or caught up | No action required |
| Catch-up Handler | computing | Player loads colony after offline duration | Compute and apply batched server tick catch-up calculations sequentially |
| Catch-up Handler | capped | Offline duration exceeds 28,800 ticks | Cap catch-up at 28,800 ticks; render notification that simulation reached max offline ceiling |

## States That Must Differ

| Piece | State A | State B | Required distinction |
| --- | --- | --- | --- |
| Building & Placement Controller | Placing Structure (Valid) | Placing Structure (Invalid) | Valid shows green-tinted tile outline / preview; Invalid shows red-tinted outline with plain-text blocker reason in the status bar (e.g. "Insufficient Power" or "Obstacle Blocked") |
| Tick Client | Reconnecting (Colony Syncing) | Offline (Telemetry Lost) | Reconnecting shows yellow pulse status text "Re-establishing Uplink..."; Offline shows persistent amber banner "Telemetry Lost - Actions Paused" |

## Failures and Edge Cases

| Piece or source | Failure or edge case | Required behavior |
| --- | --- | --- |
| Network | Disconnect / Telemetry Loss | Retain last rendered snapshot, display "Telemetry Lost", retry Supabase real-time connection with exponential backoff up to 5 times |
| Tick Client | Tick Route Timeout or 500 | Discard client's projected state, re-fetch authoritative colony state from Supabase, and show transient error in status bar |
| Auth & Session Manager | Unauthorized / Expired Session | Clear active session, return to login/auth prompt without wiping local client cache |
| Building & Placement Controller | Rate-Limited Dispatch | Throttle client input dispatch with visual cooldown indicator on action bar |
| Catch-up Handler | Catch-up Ceiling Reached | Cap catch-up computation at 28,800 ticks, display notice indicating simulation capped at maximum offline duration |

## TODOs

- None
