import { Colonist, ColonyState, GridCoord } from './types';
import {
  findNearestAvailableHabitat,
  findShortestRoute,
  getFreeAdjacentTiles,
} from './pathfinding';

/**
 * Pure function to apply a single simulation tick.
 * Strictly adheres to CONTRACT.md numbers, order of operations, and constraints.
 */
export function applySingleTick(state: ColonyState): ColonyState {
  // If colony is already game_over, no further ticks are applied
  if (state.status === 'game_over') {
    return state;
  }

  const nextTick = state.tick + 1;

  // 1. Structure counts, capacity, and blocked obstacle tiles
  let numHabitats = 0;
  let numSolars = 0;
  let numScrubbers = 0;
  let numExtractors = 0;

  const blockedTiles = new Set<string>();

  for (const b of state.buildings) {
    blockedTiles.add(`${b.x},${b.y}`);
    if (b.type === 'habitat') numHabitats++;
    else if (b.type === 'solar') numSolars++;
    else if (b.type === 'scrubber') numScrubbers++;
    else if (b.type === 'extractor') numExtractors++;
  }

  const totalHabitatCapacity = numHabitats * 2;

  // 2. Colonist Arrivals:
  // A ship lands every 300 ticks, adding one colonist capped by total habitat capacity.
  // New colonists appear at landing zone (0, 0) and are assigned nearest available habitat with route in the same tick.
  let currentColonists = [...state.colonists];
  if (nextTick % 300 === 0 && currentColonists.length < totalHabitatCapacity) {
    const targetHabitat = findNearestAvailableHabitat({ x: 0, y: 0 }, state.buildings, currentColonists);

    let assignedDest: GridCoord | null = null;
    let initialRoute: GridCoord[] = [];

    if (targetHabitat) {
      assignedDest = { x: targetHabitat.x, y: targetHabitat.y };
      const goalTiles = getFreeAdjacentTiles(assignedDest, blockedTiles, 20);
      initialRoute = findShortestRoute({ x: 0, y: 0 }, goalTiles, blockedTiles, 20);
    }

    const newColonist: Colonist = {
      id: `col-${nextTick}-${currentColonists.length + 1}`,
      x: 0,
      y: 0,
      health: 100,
      destination: assignedDest,
      route: initialRoute,
    };
    currentColonists.push(newColonist);
  }

  // 3. Resource Production & Consumption
  // Power: solar produces 5, habitat draws 2, scrubber draws 3, extractor draws 4
  const powerProduced = numSolars * 5;
  const powerDrawn = numHabitats * 2 + numScrubbers * 3 + numExtractors * 4;
  const nextPower = Math.min(100, Math.max(0, state.power + powerProduced - powerDrawn));

  // Oxygen: scrubber produces 4, each colonist consumes 3
  const oxygenProduced = numScrubbers * 4;
  const oxygenConsumed = currentColonists.length * 3;
  const nextOxygen = Math.min(100, Math.max(0, state.oxygen + oxygenProduced - oxygenConsumed));

  // Ore & Ore Reserve: extractor produces 3 ore/tick depleting reserve toward 0
  let currentReserve = state.oreReserve;
  let oreProduced = 0;
  if (currentReserve > 0 && numExtractors > 0) {
    for (let e = 0; e < numExtractors; e++) {
      if (currentReserve <= 0) break;
      const take = Math.min(3, currentReserve);
      currentReserve -= take;
      oreProduced += take;
    }
  }
  const nextOre = state.ore + oreProduced;
  const nextOreReserve = Math.max(0, currentReserve);

  // 4. Colonist Movement:
  // Step 1 tile per tick along precalculated shortest route.
  // If route is blocked by a newly placed building or empty, recalculate once.
  const movedColonists = currentColonists.map((c) => {
    let colonist = c;

    // If colonist has no destination, attempt to assign nearest available habitat
    if (!colonist.destination) {
      const targetHabitat = findNearestAvailableHabitat({ x: colonist.x, y: colonist.y }, state.buildings, currentColonists);
      if (targetHabitat) {
        const dest = { x: targetHabitat.x, y: targetHabitat.y };
        const goalTiles = getFreeAdjacentTiles(dest, blockedTiles, 20);
        const route = findShortestRoute({ x: colonist.x, y: colonist.y }, goalTiles, blockedTiles, 20);
        colonist = { ...colonist, destination: dest, route };
      }
    }

    // Check if colonist needs a new route (empty route but not yet adjacent to destination)
    if (colonist.destination && colonist.route.length === 0) {
      const dest = colonist.destination;
      const manhattan = Math.abs(dest.x - colonist.x) + Math.abs(dest.y - colonist.y);
      if (manhattan > 1) {
        const goalTiles = getFreeAdjacentTiles(dest, blockedTiles, 20);
        const route = findShortestRoute({ x: colonist.x, y: colonist.y }, goalTiles, blockedTiles, 20);
        colonist = { ...colonist, route };
      }
    }

    // Step 1 tile along the route if available
    if (colonist.route.length > 0) {
      const nextStep = colonist.route[0];

      // If next step is blocked by a building, dynamically recalculate path
      if (blockedTiles.has(`${nextStep.x},${nextStep.y}`)) {
        if (colonist.destination) {
          const goalTiles = getFreeAdjacentTiles(colonist.destination, blockedTiles, 20);
          const newRoute = findShortestRoute({ x: colonist.x, y: colonist.y }, goalTiles, blockedTiles, 20);
          if (newRoute.length > 0) {
            const step = newRoute[0];
            return {
              ...colonist,
              x: step.x,
              y: step.y,
              route: newRoute.slice(1),
            };
          }
        }
        // Walled in or unreachable: stay put
        return {
          ...colonist,
          route: [],
        };
      }

      // Valid unblocked step: advance 1 tile
      return {
        ...colonist,
        x: nextStep.x,
        y: nextStep.y,
        route: colonist.route.slice(1),
      };
    }

    return colonist;
  });

  // 5. Health Rule
  // If oxygen is 0 OR power is 0 at end of tick: every colonist loses 5 health
  // Otherwise: colonists recover 1 health per tick, up to 100
  const isStarving = nextOxygen === 0 || nextPower === 0;
  const updatedHealthColonists = movedColonists.map((c) => {
    const newHealth = isStarving
      ? Math.max(0, c.health - 5)
      : Math.min(100, c.health + 1);
    return {
      ...c,
      health: newHealth,
    };
  });

  // 6. Colonist Death & Game Over
  const hadColonists = currentColonists.length > 0;
  const livingColonists = updatedHealthColonists.filter((c) => c.health > 0);

  let nextStatus: 'active' | 'game_over' = 'active';
  let nextBestSols = state.bestSolsSurvived;

  if (hadColonists && livingColonists.length === 0) {
    nextStatus = 'game_over';
    const solsSurvived = Math.floor(nextTick / 1000);
    if (solsSurvived > nextBestSols) {
      nextBestSols = solsSurvived;
    }
  }

  return {
    ...state,
    tick: nextTick,
    oxygen: nextOxygen,
    power: nextPower,
    ore: nextOre,
    oreReserve: nextOreReserve,
    colonists: livingColonists,
    status: nextStatus,
    bestSolsSurvived: nextBestSols,
  };
}

/**
 * Applies N ticks in one pure batch.
 * Guaranteed: applyTicks(state, N) === calling applySingleTick N times.
 */
export function applyTicks(state: ColonyState, nTicks: number): ColonyState {
  if (nTicks <= 0 || state.status === 'game_over') {
    return state;
  }

  let current = state;
  for (let i = 0; i < nTicks; i++) {
    current = applySingleTick(current);
    if (current.status === 'game_over') {
      break;
    }
  }

  return current;
}
