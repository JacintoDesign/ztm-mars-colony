import {
  Building,
  BuildingCost,
  BUILDING_COSTS,
  BuildingType,
  BuildingCondition,
  ColonyState,
  Colonist,
  PlacementCheckResult,
  SimulationAction,
  Rover,
  BatteryCell,
  RoverDestinationType,
  GridCoord,
} from './types';
import { isInGrid } from '../engine/iso-math';
import { applyTicks } from './tick';
import { SeededPRNG, generateInitialSeed } from './prng';
import { generateOreDistribution } from './ore-generator';
import { findShortestRoute } from './pathfinding';
import { CONTRACT_RULES } from './contract-rules';

export type StateListener = (state: ColonyState) => void;

export interface DispatchResult {
  success: boolean;
  reason?: 'Insufficient Power' | 'Insufficient Ore' | 'Tile Occupied' | 'Invalid Coordinates' | 'Tile Buried' | 'No Battery Cells' | 'Rover Busy' | 'Storage Full' | 'Tile (0, 0) is reserved for Landing Pad' | 'Colonist Workforce Required';
  building?: Building;
}

export type BuildingPlacementCallback = (building: Building, cost: BuildingCost) => Promise<void>;
export type RestartColonyCallback = () => Promise<void>;
export type ServerActionCallback = (action: SimulationAction) => Promise<{ success: boolean; reason?: string }>;

export function createStarterEntities(seed: number): { buildings: Building[]; colonists: Colonist[] } {
  const prng = new SeededPRNG(seed);
  const { starting, colonists: cSpecs } = CONTRACT_RULES;
  const habX = starting.starterHabitat?.x ?? 7;
  const habY = starting.starterHabitat?.y ?? 7;
  const solX = starting.starterSolar?.x ?? 5;
  const solY = starting.starterSolar?.y ?? 7;

  const starterHabitat: Building = {
    id: 'starter-habitat',
    type: 'habitat',
    x: habX,
    y: habY,
    condition: 'operational',
    repairProgress: 0,
    digProgress: 0,
    wasBrokenBeforeBurial: false,
  };
  const starterSolar: Building = {
    id: 'starter-solar',
    type: 'solar',
    x: solX,
    y: solY,
    condition: 'operational',
    repairProgress: 0,
    digProgress: 0,
    wasBrokenBeforeBurial: false,
  };

  const starterColonists: Colonist[] = [];
  const numPioneers = starting.starterColonistsCount ?? 2;
  for (let i = 1; i <= numPioneers; i++) {
    starterColonists.push({
      id: `col-pioneer-${i}`,
      x: habX,
      y: habY,
      health: cSpecs.maxHealth,
      age: 0,
      lifespan: prng.nextInt(cSpecs.minLifespanTicks, cSpecs.maxLifespanTicks),
      destination: { x: habX, y: habY },
      destinationType: 'habitat',
      targetEntityId: 'starter-habitat',
      route: [],
    });
  }

  return {
    buildings: [starterHabitat, starterSolar],
    colonists: starterColonists,
  };
}

export class ColonyStore {
  private state: ColonyState;
  private listeners: Set<StateListener> = new Set();
  private nextBuildingId = 1;
  private nextRoverId = 1;
  private onBuildingPlacedHandler: BuildingPlacementCallback | null = null;
  private onRestartHandler: RestartColonyCallback | null = null;
  private serverActionHandler: ServerActionCallback | null = null;

  constructor(initialState?: Partial<ColonyState>) {
    const seed = initialState?.seed ?? generateInitialSeed();
    const prng = new SeededPRNG(seed);
    const { oreDeposits, miningSites } = generateOreDistribution(prng);
    const { buildings: starterBuildings, colonists: starterColonists } = createStarterEntities(seed);

    this.state = {
      tick: 0,
      oxygen: 50,
      power: 50,
      food: 50,
      ore: 0,
      electronics: 0,
      seed,
      oreDeposits,
      buildings: starterBuildings,
      colonists: starterColonists,
      pendingArrivals: [],
      rovers: [],
      batteryCells: [],
      miningSites,
      activeAsteroid: null,
      signedInAccount: 'none',
      colonyOwner: 'none',
      status: 'active',
      bestSolsSurvived: 0,
      lastAppliedTick: 'Never',
      ...initialState,
    };
  }

  public getState(): ColonyState {
    return this.state;
  }

  public setPersistenceHandler(handler: BuildingPlacementCallback | null): void {
    this.onBuildingPlacedHandler = handler;
  }

  public setRestartHandler(handler: RestartColonyCallback | null): void {
    this.onRestartHandler = handler;
  }

  public setServerActionHandler(handler: ServerActionCallback | null): void {
    this.serverActionHandler = handler;
  }

  public loadState(newState: Partial<ColonyState>): void {
    this.state = {
      ...this.state,
      ...newState,
    };
    this.notify();
  }

  public loadColonyData(data: { colony: any; buildings: Building[]; colonists: any[]; rovers: any[]; oreDeposits: any[]; bestSolsSurvived: number }, signedInAccount: string): void {
    const monotonicTick = Math.max(this.state.tick, data.colony.tick ?? 0);
    this.state = {
      colonyId: data.colony.id,
      tick: monotonicTick,
      oxygen: data.colony.oxygen,
      power: data.colony.power,
      food: data.colony.food ?? 50,
      ore: data.colony.ore,
      electronics: data.colony.electronics ?? 0,
      seed: data.colony.seed ?? 133742,
      oreDeposits: data.oreDeposits,
      buildings: data.buildings,
      colonists: data.colonists,
      pendingArrivals: data.colony.pending_arrivals ?? [],
      rovers: data.rovers,
      batteryCells: data.colony.battery_cells ?? [],
      miningSites: data.colony.mining_sites ?? [],
      activeAsteroid: data.colony.active_asteroid ?? null,
      signedInAccount,
      colonyOwner: data.colony.owner,
      status: data.colony.status,
      bestSolsSurvived: data.bestSolsSurvived,
      lastAppliedTick: data.colony.last_tick_at
        ? new Date(data.colony.last_tick_at).toLocaleTimeString()
        : 'Never',
    };
    this.notify();
  }

  public reset(): void {
    const seed = generateInitialSeed();
    const prng = new SeededPRNG(seed);
    const { oreDeposits, miningSites } = generateOreDistribution(prng);
    const { buildings: starterBuildings, colonists: starterColonists } = createStarterEntities(seed);

    this.state = {
      tick: 0,
      oxygen: 50,
      power: 50,
      food: 50,
      ore: 0,
      electronics: 0,
      seed,
      oreDeposits,
      buildings: starterBuildings,
      colonists: starterColonists,
      pendingArrivals: [],
      rovers: [],
      batteryCells: [],
      miningSites,
      activeAsteroid: null,
      signedInAccount: 'none',
      colonyOwner: 'none',
      status: 'active',
      bestSolsSurvived: 0,
      lastAppliedTick: 'Never',
      colonyId: undefined,
    };
    this.notify();
  }

  public advanceTicks(nTicks: number): void {
    if (this.state.status === 'game_over' || nTicks <= 0) return;
    this.state = applyTicks(this.state, nTicks);
    this.notify();
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public hasBuildingAt(x: number, y: number): boolean {
    return this.state.buildings.some((b) => b.x === x && b.y === y);
  }

  public getBuildingAt(x: number, y: number): Building | undefined {
    return this.state.buildings.find((b) => b.x === x && b.y === y);
  }

  public getTileOre(x: number, y: number): number {
    const deposit = this.state.oreDeposits.find((d) => d.x === x && d.y === y);
    return deposit?.remaining ?? 0;
  }

  public getCost(type: BuildingType): BuildingCost {
    return BUILDING_COSTS[type];
  }

  public canAfford(type: BuildingType): { canAfford: boolean; reason?: 'Insufficient Power' | 'Insufficient Ore'; cost: BuildingCost } {
    const cost = BUILDING_COSTS[type];
    if (this.state.power < cost.power) {
      return { canAfford: false, reason: 'Insufficient Power', cost };
    }
    if (this.state.ore < cost.ore) {
      return { canAfford: false, reason: 'Insufficient Ore', cost };
    }
    return { canAfford: true, cost };
  }

  public checkPlacement(type: BuildingType, x: number, y: number): PlacementCheckResult {
    const cost = BUILDING_COSTS[type];

    if (!isInGrid(x, y, 20)) {
      return { canPlace: false, reason: 'Invalid Coordinates', cost };
    }

    if (x === 0 && y === 0) {
      return { canPlace: false, reason: 'Tile (0, 0) is reserved for Landing Pad', cost };
    }

    if (this.hasBuildingAt(x, y)) {
      return { canPlace: false, reason: 'Tile Occupied', cost };
    }

    if (this.state.colonists.length === 0) {
      return { canPlace: false, reason: 'Colonist Workforce Required', cost };
    }

    if (this.state.power < cost.power) {
      return { canPlace: false, reason: 'Insufficient Power', cost };
    }

    if (this.state.ore < cost.ore) {
      return { canPlace: false, reason: 'Insufficient Ore', cost };
    }

    return { canPlace: true, cost };
  }

  public dispatch(action: SimulationAction): DispatchResult {
    if (this.serverActionHandler) {
      this.serverActionHandler(action).catch((err) => {
        console.error('Server action dispatch error:', err);
      });
    }

    switch (action.type) {
      case 'PLACE_BUILDING':
        return this.handlePlaceBuilding(action.buildingType, action.x, action.y);
      case 'REFINE_CELL':
        return this.handleRefineCell();
      case 'DISPATCH_ROVER':
        return this.handleDispatchRover(action.roverId, action.destinationType, action.targetTile, action.targetArrivalId);
      case 'TOGGLE_BUILDING_POWER':
        return this.handleToggleBuildingPower(action.buildingId);
      case 'MOVE_BUILDING':
        return this.handleMoveBuilding(action.buildingId, action.targetX, action.targetY);
      case 'RESTART_COLONY':
        return this.handleRestartColony();
      default:
        return { success: false };
    }
  }

  private handleToggleBuildingPower(buildingId: string): DispatchResult {
    const buildingIndex = this.state.buildings.findIndex((b) => b.id === buildingId);
    if (buildingIndex < 0) {
      return { success: false };
    }

    const building = this.state.buildings[buildingIndex];
    if (building.condition === 'broken' || building.condition === 'buried') {
      return { success: false, reason: 'Insufficient Power' };
    }

    const nextCondition: BuildingCondition = building.condition === 'deactivated' ? 'operational' : 'deactivated';
    const updatedBuildings = [...this.state.buildings];
    updatedBuildings[buildingIndex] = {
      ...building,
      condition: nextCondition,
    };

    this.state = {
      ...this.state,
      buildings: updatedBuildings,
    };

    this.notify();
    return { success: true };
  }

  private handleMoveBuilding(buildingId: string, targetX: number, targetY: number): DispatchResult {
    const buildingIndex = this.state.buildings.findIndex((b) => b.id === buildingId);
    if (buildingIndex < 0) {
      return { success: false };
    }

    const building = this.state.buildings[buildingIndex];
    if (building.condition === 'broken' || building.condition === 'buried') {
      return { success: false, reason: 'Insufficient Power' };
    }

    if (!isInGrid(targetX, targetY, 20)) {
      return { success: false, reason: 'Invalid Coordinates' };
    }

    if (targetX === 0 && targetY === 0) {
      return { success: false, reason: 'Tile (0, 0) is reserved for Landing Pad' };
    }

    if (this.hasBuildingAt(targetX, targetY)) {
      return { success: false, reason: 'Tile Occupied' };
    }

    const movePowerCost = 10;
    if (this.state.power < movePowerCost) {
      return { success: false, reason: 'Insufficient Power' };
    }

    const updatedBuildings = [...this.state.buildings];
    updatedBuildings[buildingIndex] = {
      ...building,
      x: targetX,
      y: targetY,
    };

    this.state = {
      ...this.state,
      power: Math.max(0, this.state.power - movePowerCost),
      buildings: updatedBuildings,
    };

    this.notify();
    return { success: true };
  }

  private handleRefineCell(): DispatchResult {
    if (this.state.colonists.length === 0) {
      return { success: false, reason: 'Colonist Workforce Required' };
    }

    const oreCost = CONTRACT_RULES.refinery.oreCostPerCell;
    const maxCapacity = CONTRACT_RULES.refinery.maxCellCapacity;

    const hasRefinery = this.state.buildings.some((b) => b.type === 'refinery' && b.condition === 'operational');
    if (!hasRefinery) {
      return { success: false, reason: 'Insufficient Power' };
    }

    if (this.state.ore < oreCost) {
      return { success: false, reason: 'Insufficient Ore' };
    }

    if (this.state.batteryCells.length >= maxCapacity) {
      return { success: false, reason: 'Storage Full' };
    }

    const newCell: BatteryCell = {
      id: `cell-${Date.now()}-${this.state.batteryCells.length + 1}`,
      efficiency: CONTRACT_RULES.refinery.initialCellEfficiency,
    };

    this.state = {
      ...this.state,
      ore: this.state.ore - oreCost,
      batteryCells: [...this.state.batteryCells, newCell],
    };

    this.notify();
    return { success: true };
  }

  private handleDispatchRover(
    roverId: string,
    destType: RoverDestinationType,
    targetTile?: GridCoord,
    targetArrivalId?: string
  ): DispatchResult {
    if (this.state.batteryCells.length === 0) {
      return { success: false, reason: 'No Battery Cells' };
    }

    const roverIndex = this.state.rovers.findIndex((r) => r.id === roverId);
    if (roverIndex < 0) {
      return { success: false, reason: 'Rover Busy' };
    }

    const rover = this.state.rovers[roverIndex];
    if (rover.state !== 'idle_at_base') {
      return { success: false, reason: 'Rover Busy' };
    }

    let destCoord: GridCoord = { x: 0, y: 0 };
    let onSiteTicks = 5;

    if (destType === 'landing_zone') {
      destCoord = { x: 0, y: 0 };
      onSiteTicks = CONTRACT_RULES.rovers.landingZoneLoadTicks;
    } else if (destType === 'mining_site' && targetTile) {
      destCoord = targetTile;
      onSiteTicks = 20;
    } else if (destType === 'asteroid' && this.state.activeAsteroid) {
      destCoord = { x: this.state.activeAsteroid.x, y: this.state.activeAsteroid.y };
      onSiteTicks = 15;
    }

    // Plan route to destination
    const plannedRoute = findShortestRoute({ x: rover.x, y: rover.y }, [destCoord], new Set(), 20);

    // Consume 1 battery cell
    const updatedCells = this.state.batteryCells.slice(1);

    const updatedRovers = [...this.state.rovers];
    updatedRovers[roverIndex] = {
      ...rover,
      power: CONTRACT_RULES.rovers.powerMax, // Fueled with full charge from battery cell
      state: 'traveling_out',
      occupants: 1,
      destination: {
        type: destType,
        x: destCoord.x,
        y: destCoord.y,
        onSiteTicksTotal: onSiteTicks,
        targetId: targetArrivalId,
      },
      onSiteTicksRemaining: onSiteTicks,
      route: plannedRoute,
    };

    this.state = {
      ...this.state,
      batteryCells: updatedCells,
      rovers: updatedRovers,
    };

    this.notify();
    return { success: true };
  }

  private handleRestartColony(): DispatchResult {
    if (this.state.status !== 'game_over') {
      return { success: false };
    }

    const seed = generateInitialSeed();
    const prng = new SeededPRNG(seed);
    const { oreDeposits, miningSites } = generateOreDistribution(prng);
    const { buildings: starterBuildings, colonists: starterColonists } = createStarterEntities(seed);

    this.state = {
      ...this.state,
      oxygen: 50,
      power: 50,
      food: 50,
      ore: 0,
      electronics: 0,
      seed,
      oreDeposits,
      miningSites,
      buildings: starterBuildings,
      colonists: starterColonists,
      pendingArrivals: [],
      rovers: [],
      batteryCells: [],
      activeAsteroid: null,
      tick: 0,
      status: 'active',
      lastAppliedTick: new Date().toLocaleTimeString(),
    };

    this.notify();

    if (this.onRestartHandler) {
      this.onRestartHandler().catch((err) => {
        console.error('Failed to persist colony restart:', err);
      });
    }

    return { success: true };
  }

  private handlePlaceBuilding(type: BuildingType, x: number, y: number): DispatchResult {
    const check = this.checkPlacement(type, x, y);
    if (!check.canPlace) {
      return {
        success: false,
        reason: check.reason,
      };
    }

    const cost = check.cost;
    const newBuilding: Building = {
      id: `bld-${Date.now()}-${this.nextBuildingId++}`,
      type,
      x,
      y,
      condition: 'operational',
      repairProgress: 0,
      digProgress: 0,
    };

    // If placed garage, automatically spawn up to 2 rovers at the garage tile
    let newRovers = [...this.state.rovers];
    if (type === 'garage') {
      for (let r = 0; r < CONTRACT_RULES.rovers.maxRoversPerGarage; r++) {
        const rover: Rover = {
          id: `rov-${Date.now()}-${this.nextRoverId++}`,
          garageX: x,
          garageY: y,
          x,
          y,
          state: 'idle_at_base',
          power: CONTRACT_RULES.rovers.powerMax,
          cargo: null,
          destination: null,
          onSiteTicksRemaining: 0,
          route: [],
        };
        newRovers.push(rover);
      }
    }

    this.state = {
      ...this.state,
      power: this.state.power - cost.power,
      ore: this.state.ore - cost.ore,
      buildings: [...this.state.buildings, newBuilding],
      rovers: newRovers,
    };

    this.notify();

    if (this.onBuildingPlacedHandler) {
      this.onBuildingPlacedHandler(newBuilding, cost).catch((err) => {
        console.error('Failed to persist building placement to Supabase:', err);
      });
    }

    return {
      success: true,
      building: newBuilding,
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
