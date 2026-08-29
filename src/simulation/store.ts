import { Building, BuildingType, ColonyState, SimulationAction } from './types';
import { isInGrid } from '../engine/iso-math';

export type StateListener = (state: ColonyState) => void;

export class ColonyStore {
  private state: ColonyState;
  private listeners: Set<StateListener> = new Set();
  private nextBuildingId = 1;

  constructor(initialState?: Partial<ColonyState>) {
    this.state = {
      tick: 0,
      oxygen: 80,
      power: 65,
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

  public dispatch(action: SimulationAction): boolean {
    switch (action.type) {
      case 'PLACE_BUILDING':
        return this.handlePlaceBuilding(action.buildingType, action.x, action.y);
      default:
        return false;
    }
  }

  private handlePlaceBuilding(type: BuildingType, x: number, y: number): boolean {
    if (!isInGrid(x, y, 20)) {
      return false;
    }

    if (this.hasBuildingAt(x, y)) {
      return false;
    }

    const newBuilding: Building = {
      id: `bld-${this.nextBuildingId++}`,
      type,
      x,
      y,
    };

    this.state = {
      ...this.state,
      buildings: [...this.state.buildings, newBuilding],
    };

    this.notify();
    return true;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
