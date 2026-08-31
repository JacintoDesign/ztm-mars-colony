import {
  Building,
  BuildingCost,
  BUILDING_COSTS,
  BuildingType,
  ColonyState,
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
  reason?: 'Insufficient Power' | 'Insufficient Ore' | 'Tile Occupied' | 'Invalid Coordinates' | 'Tile Buried' | 'No Battery Cells' | 'Rover Busy' | 'Storage Full' | 'Tile (0, 0) is reserved for Landing Pad';
  building?: Building;
}

export type BuildingPlacementCallback = (building: Building, cost: BuildingCost) => Promise<void>;
export type RestartColonyCallback = () => Promise<void>;

export class ColonyStore {
  private state: ColonyState;
  private listeners: Set<StateListener> = new Set();
  private nextBuildingId = 1;
  private nextRoverId = 1;
  private onBuildingPlacedHandler: BuildingPlacementCallback | null = null;
  private onRestartHandler: RestartColonyCallback | null = null;

  constructor(initialState?: Partial<ColonyState>) {
    const seed = initialState?.seed ?? generateInitialSeed();
    const prng = new SeededPRNG(seed);
    const { oreDeposits, miningSites } = generateOreDistribution(prng);

    this.state = {
      tick: 0,
      oxygen: 50,
      power: 50,
      food: 50,
      ore: 0,
      electronics: 0,
      seed,
      oreDeposits,
      buildings: [],
      colonists: [],
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

  public loadState(newState: Partial<ColonyState>): void {
    this.state = {
      ...this.state,
      ...newState,
    };
    this.notify();
  }

  public reset(): void {
    const seed = generateInitialSeed();
    const prng = new SeededPRNG(seed);
    const { oreDeposits, miningSites } = generateOreDistribution(prng);

    this.state = {
      tick: 0,
      oxygen: 50,
      power: 50,
      food: 50,
      ore: 0,
      electronics: 0,
      seed,
      oreDeposits,
      buildings: [],
      colonists: [],
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

    if (this.state.power < cost.power) {
      return { canPlace: false, reason: 'Insufficient Power', cost };
    }

    if (this.state.ore < cost.ore) {
      return { canPlace: false, reason: 'Insufficient Ore', cost };
    }

    return { canPlace: true, cost };
  }

  public dispatch(action: SimulationAction): DispatchResult {
    switch (action.type) {
      case 'PLACE_BUILDING':
        return this.handlePlaceBuilding(action.buildingType, action.x, action.y);
      case 'REFINE_CELL':
        return this.handleRefineCell();
      case 'DISPATCH_ROVER':
        return this.handleDispatchRover(action.roverId, action.destinationType, action.targetTile, action.targetArrivalId);
      case 'RESTART_COLONY':
        return this.handleRestartColony();
      default:
        return { success: false };
    }
  }

  private handleRefineCell(): DispatchResult {
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
      buildings: [],
      colonists: [],
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
          power: 100,
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
