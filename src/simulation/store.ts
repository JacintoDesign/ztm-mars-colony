import {
  Building,
  BuildingCost,
  BUILDING_COSTS,
  BuildingType,
  ColonyState,
  PlacementCheckResult,
  SimulationAction,
} from './types';
import { isInGrid } from '../engine/iso-math';

export type StateListener = (state: ColonyState) => void;

export interface DispatchResult {
  success: boolean;
  reason?: 'Insufficient Power' | 'Insufficient Ore' | 'Tile Occupied' | 'Invalid Coordinates';
  building?: Building;
}

export class ColonyStore {
  private state: ColonyState;
  private listeners: Set<StateListener> = new Set();
  private nextBuildingId = 1;

  constructor(initialState?: Partial<ColonyState>) {
    this.state = {
      tick: 0,
      oxygen: 50,
      power: 50,
      ore: 0,
      oreReserve: 500,
      signedInAccount: 'none',
      colonyOwner: 'none',
      buildings: [],
      lastAppliedTick: 'Never',
      ...initialState,
    };
  }

  public getState(): ColonyState {
    return this.state;
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
      default:
        return { success: false };
    }
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
      id: `bld-${this.nextBuildingId++}`,
      type,
      x,
      y,
    };

    this.state = {
      ...this.state,
      power: this.state.power - cost.power,
      ore: this.state.ore - cost.ore,
      buildings: [...this.state.buildings, newBuilding],
    };

    this.notify();
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
