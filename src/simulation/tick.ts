import { Building, Colonist, ColonyState, GridCoord } from './types';

/**
 * Finds the nearest habitat structure to a given coordinate.
 */
function findNearestHabitat(origin: GridCoord, buildings: Building[]): GridCoord | null {
  const habitats = buildings.filter((b) => b.type === 'habitat');
  if (habitats.length === 0) return null;

  let best: GridCoord | null = null;
  let bestDist = Infinity;

  for (const h of habitats) {
    const dist = Math.abs(h.x - origin.x) + Math.abs(h.y - origin.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = { x: h.x, y: h.y };
    }
  }

  return best;
}

/**
 * Deterministically steps a colonist 1 tile closer to their destination, stopping adjacent.
 */
function stepColonist(colonist: Colonist): Colonist {
  if (!colonist.destination) {
    return colonist;
  }

  const dest = colonist.destination;
  const dx = dest.x - colonist.x;
  const dy = dest.y - colonist.y;
  const manhattanDist = Math.abs(dx) + Math.abs(dy);

  // Stop when adjacent (distance <= 1)
  if (manhattanDist <= 1) {
    return colonist;
  }

  let newX = colonist.x;
  let newY = colonist.y;

  // Move 1 tile along axis with largest distance (deterministic tie-breaking: prefer X)
  if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
    newX += Math.sign(dx);
  } else if (dy !== 0) {
    newY += Math.sign(dy);
  }

  return {
    ...colonist,
    x: newX,
    y: newY,
  };
}

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

  // 1. Structure counts and capacity
  let numHabitats = 0;
  let numSolars = 0;
  let numScrubbers = 0;
  let numExtractors = 0;

  for (const b of state.buildings) {
    if (b.type === 'habitat') numHabitats++;
    else if (b.type === 'solar') numSolars++;
    else if (b.type === 'scrubber') numScrubbers++;
    else if (b.type === 'extractor') numExtractors++;
  }

  const totalHabitatCapacity = numHabitats * 2;

  // 2. Colonist Arrivals:
  // A ship lands every 300 ticks, adding one colonist capped by total habitat capacity.
  // New colonists appear at landing zone (0, 0) and are assigned nearest habitat.
  let currentColonists = [...state.colonists];
  if (nextTick % 300 === 0 && currentColonists.length < totalHabitatCapacity) {
    const dest = findNearestHabitat({ x: 0, y: 0 }, state.buildings);
    const newColonist: Colonist = {
      id: `col-${nextTick}-${currentColonists.length + 1}`,
      x: 0,
      y: 0,
      health: 100,
      destination: dest,
      route: [],
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

  // 4. Colonist Movement
  const movedColonists = currentColonists.map((c) => {
    let colonist = c;
    if (!colonist.destination) {
      colonist = { ...colonist, destination: findNearestHabitat({ x: colonist.x, y: colonist.y }, state.buildings) };
    }
    return stepColonist(colonist);
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
