export type BuildingType =
  | 'habitat'
  | 'solar'
  | 'scrubber'
  | 'extractor'
  | 'farm'
  | 'garage'
  | 'refinery';

export type BuildingCondition = 'operational' | 'broken' | 'buried';

export type ColonistDestinationType = 'habitat' | 'repair' | 'dig' | 'rover_recovery';

export type RoverState = 'idle_at_base' | 'traveling_out' | 'on_site' | 'traveling_back' | 'stranded';

export type RoverDestinationType = 'mining_site' | 'asteroid' | 'landing_zone';

/**
 * Authoritative constants and numbers read directly from CONTRACT.md.
 * Used across simulation logic, telemetry HUD, and the player Help Modal.
 */
export const CONTRACT_RULES = {
  // Tick & Sol timing
  ticksPerSol: 1000,
  maxCatchUpTicks: 28800, // 8 hours

  // Starting values
  starting: {
    oxygen: 50,
    power: 50,
    food: 50,
    ore: 0,
    electronics: 0,
    totalOreDistribution: 500,
  },

  // Resource Pool limits
  pools: {
    oxygenMin: 0,
    oxygenMax: 100,
    powerMin: 0,
    powerMax: 100,
    foodMin: 0,
    foodMax: 100,
  },

  // Colonist arrival and escort rules
  arrivals: {
    intervalTicks: 300,
    colonistsPerShip: 1,
    electronicsPerShip: 2,
    escortWindowTicks: 150,
    urgentCountdownTicks: 30,
    landingTile: { x: 0, y: 0 },
  },

  // Colonist life support and health rules
  colonists: {
    ticksPerTile: 5, // 5 ticks to walk from one tile to another
    oxygenConsumptionPerTick: 3,
    foodConsumptionPerTick: 2,
    healthDamagePerTick: 5, // applied if oxygen == 0 OR power == 0 OR food == 0
    healthRecoveryPerTick: 1, // applied when oxygen > 0 AND power > 0 AND food > 0
    maxHealth: 100,
    minLifespanTicks: 12000,
    maxLifespanTicks: 18000,
    agingVisualThresholdFraction: 0.75,
  },

  // Maintenance & Building Condition
  maintenance: {
    breakageChancePerTick: 1 / 15000, // 1-in-15,000 per operational building per tick
    repairDurationTicks: 50,
    dustStormWindowTicks: 5000,
    dustStormChance: 0.2, // 20% per 5,000-tick window
    maxBuriedPerStorm: 3,
    digOutDurationTicks: 100,
  },

  // Rover specs
  rovers: {
    speedTilesPerTick: 1, // 1 tick to travel from one tile to another
    powerMax: 100,
    powerDrainPerTick: 2,
    rechargeRatePerTick: 5,
    landingZoneLoadTicks: 5,
    maxRoversPerGarage: 2,
  },

  // Battery cell & Refinery specs
  refinery: {
    oreCostPerCell: 10,
    maxCellCapacity: 20,
    cellDecayPerTick: 1, // -1 efficiency/tick while stored
    initialCellEfficiency: 100,
  },

  // Asteroid specs
  asteroids: {
    spawnWindowTicks: 5000,
    spawnChance: 0.5,
    lifetimeTicks: 200,
    minYield: 60,
    maxYield: 120,
  },

  // Building specifications
  buildings: {
    habitat: {
      type: 'habitat' as BuildingType,
      name: 'Habitat',
      description: 'Houses 2 colonists and provides living quarters.',
      capacity: 2,
      powerDraw: 2,
      powerProduction: 0,
      oxygenProduction: 0,
      foodProduction: 0,
      oreProduction: 0,
      cost: { power: 20, ore: 0 },
      repairLabor: 1,
      repairElectronics: 1,
    },
    solar: {
      type: 'solar' as BuildingType,
      name: 'Solar Array',
      description: 'Generates electrical power from Martian solar radiation.',
      capacity: 0,
      powerDraw: 0,
      powerProduction: 5,
      oxygenProduction: 0,
      foodProduction: 0,
      oreProduction: 0,
      cost: { power: 15, ore: 0 },
      repairLabor: 1,
      repairElectronics: 1,
    },
    scrubber: {
      type: 'scrubber' as BuildingType,
      name: 'Scrubber',
      description: 'Filters atmospheric CO2 and generates breathable oxygen.',
      capacity: 0,
      powerDraw: 3,
      powerProduction: 0,
      oxygenProduction: 4,
      foodProduction: 0,
      oreProduction: 0,
      cost: { power: 15, ore: 5 },
      repairLabor: 1,
      repairElectronics: 1,
    },
    extractor: {
      type: 'extractor' as BuildingType,
      name: 'Extractor',
      description: 'Excavates ore from its local tile deposit (3 ore/tick).',
      capacity: 0,
      powerDraw: 4,
      powerProduction: 0,
      oxygenProduction: 0,
      foodProduction: 0,
      oreProduction: 3,
      cost: { power: 25, ore: 0 },
      repairLabor: 2,
      repairElectronics: 2,
    },
    farm: {
      type: 'farm' as BuildingType,
      name: 'Hydroponic Farm',
      description: 'Cultivates nutritious crops to nourish colonists.',
      capacity: 0,
      powerDraw: 2,
      powerProduction: 0,
      oxygenProduction: 0,
      foodProduction: 4,
      oreProduction: 0,
      cost: { power: 20, ore: 5 },
      repairLabor: 1,
      repairElectronics: 1,
    },
    garage: {
      type: 'garage' as BuildingType,
      name: 'Rover Garage',
      description: 'Houses, repairs, and recharges up to 2 surface rovers.',
      capacity: 0,
      powerDraw: 1,
      powerProduction: 0,
      oxygenProduction: 0,
      foodProduction: 0,
      oreProduction: 0,
      cost: { power: 30, ore: 10 },
      repairLabor: 2,
      repairElectronics: 2,
    },
    refinery: {
      type: 'refinery' as BuildingType,
      name: 'Refinery',
      description: 'Converts raw ore into high-energy battery cells (max 20).',
      capacity: 0,
      powerDraw: 5,
      powerProduction: 0,
      oxygenProduction: 0,
      foodProduction: 0,
      oreProduction: 0,
      cost: { power: 25, ore: 15 },
      repairLabor: 2,
      repairElectronics: 2,
    },
  },
} as const;
