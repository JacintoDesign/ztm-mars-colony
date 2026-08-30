export type BuildingType = 'habitat' | 'solar' | 'scrubber' | 'extractor';

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
    ore: 0,
    oreReserve: 500,
  },

  // Resource Pool limits
  pools: {
    oxygenMin: 0,
    oxygenMax: 100,
    powerMin: 0,
    powerMax: 100,
  },

  // Colonist arrival rules
  arrivals: {
    intervalTicks: 300,
    colonistsPerShip: 1,
    landingTile: { x: 0, y: 0 },
  },

  // Colonist life support and health rules
  colonists: {
    oxygenConsumptionPerTick: 3,
    healthDamagePerTick: 5, // applied if oxygen == 0 OR power == 0
    healthRecoveryPerTick: 1, // applied when both oxygen > 0 AND power > 0
    maxHealth: 100,
  },

  // Building specifications
  buildings: {
    habitat: {
      type: 'habitat' as BuildingType,
      name: 'Habitat',
      description: 'Houses colonists and provides living quarters.',
      capacity: 2,
      powerDraw: 2,
      powerProduction: 0,
      oxygenProduction: 0,
      oreProduction: 0,
      cost: { power: 20, ore: 0 },
    },
    solar: {
      type: 'solar' as BuildingType,
      name: 'Solar Array',
      description: 'Generates electrical power from Martian solar radiation.',
      capacity: 0,
      powerDraw: 0,
      powerProduction: 5,
      oxygenProduction: 0,
      oreProduction: 0,
      cost: { power: 15, ore: 0 },
    },
    scrubber: {
      type: 'scrubber' as BuildingType,
      name: 'Scrubber',
      description: 'Filters atmospheric CO2 and generates breathable oxygen.',
      capacity: 0,
      powerDraw: 3,
      powerProduction: 0,
      oxygenProduction: 4,
      oreProduction: 0,
      cost: { power: 15, ore: 5 },
    },
    extractor: {
      type: 'extractor' as BuildingType,
      name: 'Extractor',
      description: 'Excavates subterranean Martian regolith ore until reserve exhausts.',
      capacity: 0,
      powerDraw: 4,
      powerProduction: 0,
      oxygenProduction: 0,
      oreProduction: 3,
      cost: { power: 25, ore: 0 },
    },
  },
} as const;
