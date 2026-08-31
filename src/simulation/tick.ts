import {
  ColonyState,
  Colonist,
  Building,
  Rover,
  OreDeposit,
  PendingArrival,
  BatteryCell,
  Asteroid,
} from './types';
import { CONTRACT_RULES } from './contract-rules';
import { SeededPRNG } from './prng';
import {
  findNearestAvailableHabitat,
  findShortestRoute,
  getFreeAdjacentTiles,
} from './pathfinding';

/**
 * Pure function to apply a single simulation tick.
 * Strictly adheres to CONTRACT.md Tier 3 specifications, seeded determinism,
 * order of operations, and constraints.
 */
export function applySingleTick(state: ColonyState): ColonyState {
  // If colony is already game_over, no further ticks are applied
  if (state.status === 'game_over') {
    return state;
  }

  const nextTick = state.tick + 1;
  const prng = new SeededPRNG(state.seed);
  const { buildings: bSpecs, arrivals: aSpecs, colonists: cSpecs, maintenance: mSpecs, rovers: rSpecs, pools, ticksPerSol, refinery: refSpecs, asteroids: astSpecs } = CONTRACT_RULES;

  // 1. Weather / Dust Storms (every 5,000-tick window, 20% chance)
  let updatedBuildings: Building[] = state.buildings.map((b) => ({ ...b }));
  if (nextTick % mSpecs.dustStormWindowTicks === 0) {
    if (prng.chance(mSpecs.dustStormChance)) {
      const operationalBuildings = updatedBuildings.filter((b) => b.condition === 'operational');
      const numToBury = Math.min(mSpecs.maxBuriedPerStorm, operationalBuildings.length);
      for (let i = 0; i < numToBury; i++) {
        const target = prng.pick(operationalBuildings.filter((b) => b.condition === 'operational'));
        if (target) {
          target.condition = 'buried';
          target.digProgress = 0;
        }
      }
    }
  }

  // 2. Building Breakage (1-in-15,000 chance per operational building per tick)
  for (const b of updatedBuildings) {
    if (b.condition === 'operational') {
      if (prng.chance(mSpecs.breakageChancePerTick)) {
        b.condition = 'broken';
        b.repairProgress = 0;
      }
    }
  }

  // 3. Active Asteroid lifecycle (~5,000 ticks roll, 200 ticks expiry)
  let currentAsteroid: Asteroid | null = state.activeAsteroid ? { ...state.activeAsteroid } : null;
  if (currentAsteroid && nextTick >= currentAsteroid.expiresAtTick) {
    currentAsteroid = null;
  }
  if (!currentAsteroid && nextTick % astSpecs.spawnWindowTicks === 0) {
    if (prng.chance(astSpecs.spawnChance)) {
      const candidateX = prng.nextInt(12, 19);
      const candidateY = prng.nextInt(12, 19);
      currentAsteroid = {
        id: `ast-${nextTick}`,
        x: candidateX,
        y: candidateY,
        yield: prng.nextInt(astSpecs.minYield, astSpecs.maxYield),
        expiresAtTick: nextTick + astSpecs.lifetimeTicks,
      };
    }
  }

  // 4. Colonist Arrivals & Pending Arrivals Queue
  // Ship lands every 300 ticks if population < total habitat capacity
  let updatedPendingArrivals: PendingArrival[] = state.pendingArrivals.map((p) => ({ ...p }));
  const totalHabitats = updatedBuildings.filter((b) => b.type === 'habitat').length;
  const totalHabitatCapacity = totalHabitats * bSpecs.habitat.capacity;
  const totalPopulation = state.colonists.length + updatedPendingArrivals.length;

  if (nextTick % aSpecs.intervalTicks === 0 && totalPopulation < totalHabitatCapacity) {
    updatedPendingArrivals.push({
      id: `arr-${nextTick}`,
      landedAtTick: nextTick,
      electronics: aSpecs.electronicsPerShip,
      ticksRemaining: aSpecs.escortWindowTicks,
    });
  }

  // 5. Battery Cells Decay (-1 efficiency/tick while stored in refinery)
  const updatedBatteryCells: BatteryCell[] = state.batteryCells.map((c) => ({
    ...c,
    efficiency: Math.max(0, c.efficiency - refSpecs.cellDecayPerTick),
  }));

  // 6. Blocked tiles map for obstacle avoidance
  const blockedTiles = new Set<string>();
  for (const b of updatedBuildings) {
    blockedTiles.add(`${b.x},${b.y}`);
  }

  // 7. Rover Simulation Loop (5 tiles/tick, power drain, landing zone pickup, mining cargo)
  let currentOre = state.ore;
  let currentElectronics = state.electronics;
  const newlyArrivedColonists: Colonist[] = [];

  let updatedRovers: Rover[] = state.rovers.map((r) => {
    let rover = { ...r };

    // Idle at base: recharges 5 power/tick
    if (rover.state === 'idle_at_base') {
      rover.power = Math.min(rSpecs.powerMax, rover.power + rSpecs.rechargeRatePerTick);
      return rover;
    }

    // Traveling or On-site: drains 2 power/tick
    rover.power = Math.max(0, rover.power - rSpecs.powerDrainPerTick);

    // If power hits 0, rover becomes stranded
    if (rover.power === 0) {
      rover.state = 'stranded';
      rover.cargo = null;
      rover.destination = null;
      rover.route = [];
      return rover;
    }

    // Moving along route (5 tiles/tick)
    if (rover.state === 'traveling_out' || rover.state === 'traveling_back') {
      const stepsToTake = Math.min(rSpecs.speedTilesPerTick, rover.route.length);
      for (let s = 0; s < stepsToTake; s++) {
        if (rover.route.length > 0) {
          const nextStep = rover.route.shift()!;
          rover.x = nextStep.x;
          rover.y = nextStep.y;
        }
      }

      // Check if finished traveling out
      if (rover.state === 'traveling_out' && rover.destination && rover.x === rover.destination.x && rover.y === rover.destination.y) {
        rover.state = 'on_site';
        rover.onSiteTicksRemaining = rover.destination.onSiteTicksTotal;
      }

      // Check if finished traveling back to garage
      if (rover.state === 'traveling_back' && rover.x === rover.garageX && rover.y === rover.garageY) {
        // Deliver cargo
        if (rover.cargo) {
          if (rover.cargo.type === 'ore') {
            currentOre += rover.cargo.amount;
          } else if (rover.cargo.type === 'arrival') {
            currentElectronics += rover.cargo.electronics;
            newlyArrivedColonists.push({
              id: `col-${nextTick}-${state.colonists.length + newlyArrivedColonists.length + 1}`,
              x: rover.garageX,
              y: rover.garageY,
              health: cSpecs.maxHealth,
              age: 0,
              lifespan: prng.nextInt(cSpecs.minLifespanTicks, cSpecs.maxLifespanTicks),
              destination: null,
              destinationType: 'habitat',
              targetEntityId: null,
              route: [],
            });
          }
        }
        rover.state = 'idle_at_base';
        rover.occupants = 0;
        rover.cargo = null;
        rover.destination = null;
        rover.route = [];
      }

      return rover;
    }

    // On-site loading / mining
    if (rover.state === 'on_site' && rover.destination) {
      rover.onSiteTicksRemaining -= 1;
      if (rover.onSiteTicksRemaining <= 0) {
        // Collect cargo on departure
        if (rover.destination.type === 'landing_zone') {
          // Take the oldest pending arrival
          if (updatedPendingArrivals.length > 0) {
            const pickedArrival = updatedPendingArrivals.shift()!;
            rover.cargo = {
              type: 'arrival',
              arrivalId: pickedArrival.id,
              electronics: pickedArrival.electronics,
            };
            rover.occupants = 2; // Driver + rescued colonist
          }
        } else if (rover.destination.type === 'mining_site') {
          // Mine from mining site
          const site = state.miningSites.find((s) => s.x === rover.destination!.x && s.y === rover.destination!.y);
          if (site && site.remaining > 0) {
            const mined = Math.min(site.yield * 10, site.remaining);
            site.remaining -= mined;
            rover.cargo = { type: 'ore', amount: mined };
          }
          rover.occupants = 1; // Single driver/operator
        } else if (rover.destination.type === 'asteroid' && currentAsteroid) {
          const mined = currentAsteroid.yield;
          currentAsteroid = null;
          rover.cargo = { type: 'ore', amount: mined };
          rover.occupants = 1; // Single driver/operator
        }

        // Plan return path to garage
        const returnGoal = [{ x: rover.garageX, y: rover.garageY }];
        rover.route = findShortestRoute({ x: rover.x, y: rover.y }, returnGoal, new Set(), 20);
        rover.state = 'traveling_back';
      }
      return rover;
    }

    return rover;
  });

  // 8. Pending Arrivals 150-tick Escort Window countdown
  // Decrease time for arrivals not currently being loaded by a rover
  const roversLoadingArrival = updatedRovers.some(
    (r) => r.state === 'on_site' && r.destination?.type === 'landing_zone'
  );
  if (!roversLoadingArrival) {
    updatedPendingArrivals = updatedPendingArrivals
      .map((arr) => ({ ...arr, ticksRemaining: arr.ticksRemaining - 1 }))
      .filter((arr) => arr.ticksRemaining > 0); // Discard unescorted arrivals after 150 ticks
  }

  // 9. Colonist Labor, Navigation, Digging Out, Repairs, and Recoveries
  let currentColonists: Colonist[] = [...state.colonists, ...newlyArrivedColonists];
  const updatedOreDeposits: OreDeposit[] = state.oreDeposits.map((d) => ({ ...d }));

  // Find maintenance targets
  const buriedBuildings = updatedBuildings.filter((b) => b.condition === 'buried');
  const brokenBuildings = updatedBuildings.filter((b) => b.condition === 'broken');
  const strandedRovers = updatedRovers.filter((r) => r.state === 'stranded');

  currentColonists = currentColonists.map((c) => {
    let colonist = { ...c };

    // Aging: increment age
    colonist.age += 1;

    // Check if colonist needs an automated assignment
    if (!colonist.destination || colonist.route.length === 0) {
      // 1. Digging out buried buildings
      if (buriedBuildings.length > 0) {
        const target = buriedBuildings[0];
        colonist.destination = { x: target.x, y: target.y };
        colonist.destinationType = 'dig';
        colonist.targetEntityId = target.id;
        colonist.route = findShortestRoute({ x: colonist.x, y: colonist.y }, [{ x: target.x, y: target.y }], blockedTiles, 20);
      }
      // 2. Repairing broken buildings
      else if (brokenBuildings.length > 0) {
        const target = brokenBuildings[0];
        const reqElectronics = bSpecs[target.type].repairElectronics;
        if (currentElectronics >= reqElectronics) {
          colonist.destination = { x: target.x, y: target.y };
          colonist.destinationType = 'repair';
          colonist.targetEntityId = target.id;
          colonist.route = findShortestRoute({ x: colonist.x, y: colonist.y }, [{ x: target.x, y: target.y }], blockedTiles, 20);
        }
      }
      // 3. Recovering stranded rovers
      else if (strandedRovers.length > 0) {
        const target = strandedRovers[0];
        colonist.destination = { x: target.x, y: target.y };
        colonist.destinationType = 'rover_recovery';
        colonist.targetEntityId = target.id;
        colonist.route = findShortestRoute({ x: colonist.x, y: colonist.y }, [{ x: target.x, y: target.y }], blockedTiles, 20);
      }
      // 4. Habitat home assignment
      else if (colonist.destinationType !== 'habitat' || !colonist.destination) {
        const targetHabitat = findNearestAvailableHabitat({ x: colonist.x, y: colonist.y }, updatedBuildings, currentColonists);
        if (targetHabitat) {
          const dest = { x: targetHabitat.x, y: targetHabitat.y };
          const goalTiles = getFreeAdjacentTiles(dest, blockedTiles, 20);
          colonist.destination = dest;
          colonist.destinationType = 'habitat';
          colonist.targetEntityId = targetHabitat.id;
          colonist.route = findShortestRoute({ x: colonist.x, y: colonist.y }, goalTiles, blockedTiles, 20);
        }
      }
    }

    // Advance 1 step along route every 5 ticks (0.2 tiles/tick)
    if (colonist.route.length > 0) {
      colonist.moveProgress = (colonist.moveProgress ?? 0) + 1;
      if (colonist.moveProgress >= cSpecs.ticksPerTile) {
        colonist.moveProgress = 0;
        const nextStep = colonist.route[0];
        if (!blockedTiles.has(`${nextStep.x},${nextStep.y}`)) {
          colonist.x = nextStep.x;
          colonist.y = nextStep.y;
          colonist.route = colonist.route.slice(1);
        }
      }
    } else {
      colonist.moveProgress = 0;
    }

    // Colonist labor on site
    if (colonist.destination && colonist.x === colonist.destination.x && colonist.y === colonist.destination.y) {
      if (colonist.destinationType === 'dig' && colonist.targetEntityId) {
        const b = updatedBuildings.find((bld) => bld.id === colonist.targetEntityId);
        if (b && b.condition === 'buried') {
          b.digProgress += 1;
          if (b.digProgress >= mSpecs.digOutDurationTicks) {
            b.condition = 'operational';
            b.digProgress = 0;
            colonist.destination = null;
            colonist.destinationType = null;
          }
        }
      } else if (colonist.destinationType === 'repair' && colonist.targetEntityId) {
        const b = updatedBuildings.find((bld) => bld.id === colonist.targetEntityId);
        if (b && b.condition === 'broken') {
          b.repairProgress += 1;
          if (b.repairProgress >= mSpecs.repairDurationTicks) {
            const reqElectronics = bSpecs[b.type].repairElectronics;
            if (currentElectronics >= reqElectronics) {
              currentElectronics -= reqElectronics;
              b.condition = 'operational';
              b.repairProgress = 0;
              colonist.destination = null;
              colonist.destinationType = null;
            }
          }
        }
      } else if (colonist.destinationType === 'rover_recovery' && colonist.targetEntityId) {
        const r = updatedRovers.find((rov) => rov.id === colonist.targetEntityId);
        if (r && r.state === 'stranded') {
          r.state = 'idle_at_base';
          r.x = r.garageX;
          r.y = r.garageY;
          r.power = 0;
          colonist.destination = null;
          colonist.destinationType = null;
        }
      }
    }

    return colonist;
  });

  // 10. Production & Consumption (Only OPERATIONAL buildings produce / consume!)
  let powerProduced = 0;
  let powerDrawn = 0;
  let oxygenProduced = 0;
  let foodProduced = 0;

  for (const b of updatedBuildings) {
    if (b.condition !== 'operational') continue;

    const spec = bSpecs[b.type];
    powerProduced += spec.powerProduction;
    powerDrawn += spec.powerDraw;
    oxygenProduced += spec.oxygenProduction;
    foodProduced += spec.foodProduction;

    // Extractor: mines 3 ore from local tile deposit
    if (b.type === 'extractor') {
      const deposit = updatedOreDeposits.find((d) => d.x === b.x && d.y === b.y);
      if (deposit && deposit.remaining > 0) {
        const take = Math.min(spec.oreProduction, deposit.remaining);
        deposit.remaining -= take;
        currentOre += take;
      }
    }
  }

  // Living colonists consume 3 Oxygen and 2 Food per tick
  const oxygenConsumed = currentColonists.length * cSpecs.oxygenConsumptionPerTick;
  const foodConsumed = currentColonists.length * cSpecs.foodConsumptionPerTick;

  const nextPower = Math.min(pools.powerMax, Math.max(pools.powerMin, state.power + powerProduced - powerDrawn));
  const nextOxygen = Math.min(pools.oxygenMax, Math.max(pools.oxygenMin, state.oxygen + oxygenProduced - oxygenConsumed));
  const nextFood = Math.min(pools.foodMax, Math.max(pools.foodMin, state.food + foodProduced - foodConsumed));

  // 11. Health Rule: If Oxygen==0 OR Power==0 OR Food==0 -> -5 HP; else +1 HP
  const isStarving = nextOxygen === pools.oxygenMin || nextPower === pools.powerMin || nextFood === pools.foodMin;
  const updatedHealthColonists = currentColonists.map((c) => {
    const newHealth = isStarving
      ? Math.max(0, c.health - cSpecs.healthDamagePerTick)
      : Math.min(cSpecs.maxHealth, c.health + cSpecs.healthRecoveryPerTick);
    return { ...c, health: newHealth };
  });

  // 12. Colonist Mortality (Health == 0 OR Age >= Lifespan)
  const hadColonists = currentColonists.length > 0;
  const livingColonists = updatedHealthColonists.filter((c) => c.health > 0 && c.age < c.lifespan);

  let nextStatus: 'active' | 'game_over' = 'active';
  let nextBestSols = state.bestSolsSurvived;

  if (hadColonists && livingColonists.length === 0) {
    nextStatus = 'game_over';
    const solsSurvived = Math.floor(nextTick / ticksPerSol);
    if (solsSurvived > nextBestSols) {
      nextBestSols = solsSurvived;
    }
  }

  return {
    ...state,
    tick: nextTick,
    seed: prng.getState(),
    oxygen: nextOxygen,
    power: nextPower,
    food: nextFood,
    ore: currentOre,
    electronics: currentElectronics,
    oreDeposits: updatedOreDeposits,
    buildings: updatedBuildings,
    colonists: livingColonists,
    pendingArrivals: updatedPendingArrivals,
    rovers: updatedRovers,
    batteryCells: updatedBatteryCells,
    activeAsteroid: currentAsteroid,
    status: nextStatus,
    bestSolsSurvived: nextBestSols,
  };
}

/**
 * Applies N ticks in one pure batch.
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
