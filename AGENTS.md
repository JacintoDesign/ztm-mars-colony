## Identity
- A browser-based isometric colony simulator on the surface of Mars.
- Players balance life support, power, and colonist health in a continuous real-time simulation.

## Stack
- Languages and runtimes: TypeScript, browser JavaScript runtime
- Frameworks and major libraries: HTML5 Canvas 2D API, Vite, Supabase JS client
- Data sources: Supabase (PostgreSQL) — colony state, auth, real-time subscriptions
- Backend: Supabase (serverless functions for the tick route)
- Deploy target: Vercel

## Conventions
- File layout: Feature-based (src/engine/, src/simulation/, src/ui/, src/assets/)
- Naming: kebab-case for files and folders, PascalCase for classes and types, camelCase for functions and variables

## Never Do
- Never mutate game simulation state directly from rendering or UI event handlers; all mutations must go through dispatched actions/commands evaluated during the simulation tick.
- Never hardcode grid coordinates or screen offsets without using the isometric coordinate transform utility.
- Never render buildings without sorting back-to-front by grid
  position; overlap must always resolve correctly.
- Never run the simulation tick on a client-side timer or requestAnimationFrame loop; the tick is a pure server-side function.
- Never derive owner identity from the client; always read it from the server session.
- Never load an image asset into the game surface; draw all game elements in code.
