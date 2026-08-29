export type BuildingType = 'habitat' | 'solar' | 'scrubber';

export interface Building {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
}

export interface ColonyState {
  tick: number;
  oxygen: number;
  power: number;
  signedInAccount: string;
  colonyOwner: string;
  buildings: Building[];
  lastAppliedTick: string;
}

export type SimulationAction =
  | {
      type: 'PLACE_BUILDING';
      buildingType: BuildingType;
      x: number;
      y: number;
    };
