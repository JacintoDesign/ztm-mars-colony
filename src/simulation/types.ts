export type BuildingType = 'habitat' | 'solar' | 'scrubber' | 'extractor';

export interface BuildingCost {
  power: number;
  ore: number;
}

export const BUILDING_COSTS: Record<BuildingType, BuildingCost> = {
  habitat: { power: 20, ore: 0 },
  solar: { power: 15, ore: 0 },
  scrubber: { power: 15, ore: 5 },
  extractor: { power: 25, ore: 0 },
};

export interface Building {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
}

export interface ColonyState {
  colonyId?: string;
  tick: number;
  oxygen: number;
  power: number;
  ore: number;
  oreReserve: number;
  signedInAccount: string;
  colonyOwner: string;
  buildings: Building[];
  lastAppliedTick: string;
}

export interface PlacementCheckResult {
  canPlace: boolean;
  reason?: 'Insufficient Power' | 'Insufficient Ore' | 'Tile Occupied' | 'Invalid Coordinates';
  cost: BuildingCost;
}

export type SimulationAction =
  | {
      type: 'PLACE_BUILDING';
      buildingType: BuildingType;
      x: number;
      y: number;
    };
