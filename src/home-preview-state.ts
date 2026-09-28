import { SeededPRNG } from './simulation/prng';
import type { Building, BuildingType, ColonyState, Colonist, Rover } from './simulation/types';

// Decorative fixture for the signed-out home screen.
// Never loaded into the colony store or sent to the server.
const random = new SeededPRNG(41827);
const types: BuildingType[] = ['habitat', 'solar', 'farm', 'scrubber', 'habitat', 'solar', 'garage', 'extractor', 'refinery'];
const buildings: Building[] = [];
for (let attempt = 0; attempt < 500 && buildings.length < 26; attempt++) {
  const x = random.nextInt(4, 15);
  const y = random.nextInt(4, 15);
  if (Math.hypot(x - 9.5, y - 9.5) > 6 || buildings.some((b) => Math.abs(b.x - x) + Math.abs(b.y - y) < 2)) continue;
  buildings.push({
    id: `home-${buildings.length}`,
    type: types[buildings.length % types.length],
    x,
    y,
    condition: 'operational',
    repairProgress: 0,
    digProgress: 0,
  });
}

const openTiles: { x: number; y: number }[] = [];
for (let x = 5; x <= 14; x++) {
  for (let y = 6; y <= 14; y++) {
    if (!buildings.some((b) => b.x === x && b.y === y)) openTiles.push({ x, y });
  }
}

function colonistAt(id: string, x: number, y: number, health = 100, age = 0): Colonist {
  return {
    id,
    x,
    y,
    health,
    age,
    lifespan: 8000,
    destination: null,
    destinationType: null,
    targetEntityId: null,
    route: [],
  };
}

const colonistTiles = openTiles.filter((_, i) => i % 7 === 0).slice(0, 6);
const colonists: Colonist[] = colonistTiles.map((tile, i) =>
  colonistAt(`home-colonist-${i}`, tile.x, tile.y, i === 1 ? 62 : 100, i === 1 ? 6500 : 0),
);

const garage = buildings.find((b) => b.type === 'garage');
const roverTiles = openTiles.filter((tile) => !colonistTiles.some((c) => c.x === tile.x && c.y === tile.y));
const parked = roverTiles[4];
const traveling = roverTiles[18];

const rovers: Rover[] = [];
if (garage) {
  rovers.push({
    id: 'home-rover-docked',
    garageX: garage.x,
    garageY: garage.y,
    x: garage.x,
    y: garage.y,
    state: 'idle_at_base',
    power: 140,
    cargo: null,
    destination: null,
    onSiteTicksRemaining: 0,
    route: [],
    occupants: 2,
  });
}
if (parked) {
  rovers.push({
    id: 'home-rover-parked',
    garageX: garage?.x ?? parked.x,
    garageY: garage?.y ?? parked.y,
    x: parked.x,
    y: parked.y,
    state: 'traveling_out',
    power: 110,
    cargo: null,
    destination: null,
    onSiteTicksRemaining: 0,
    route: [],
    occupants: 1,
  });
}
if (traveling) {
  rovers.push({
    id: 'home-rover-traveling',
    garageX: garage?.x ?? traveling.x,
    garageY: garage?.y ?? traveling.y,
    x: traveling.x,
    y: traveling.y,
    state: 'traveling_back',
    power: 80,
    cargo: { type: 'ore', amount: 12 },
    destination: null,
    onSiteTicksRemaining: 0,
    route: [],
    occupants: 1,
  });
}

export const homePreviewState: ColonyState = {
  tick: 0,
  oxygen: 100,
  power: 100,
  food: 100,
  ore: 40,
  electronics: 2,
  seed: 41827,
  oreDeposits: buildings.filter((b) => b.type === 'extractor').map((b) => ({ x: b.x, y: b.y, remaining: 100 })),
  buildings,
  colonists,
  pendingArrivals: [],
  rovers,
  batteryCells: [],
  miningSites: [],
  activeAsteroid: { id: 'home-meteor', x: 16, y: 16, yield: 40, expiresAtTick: 1000 },
  signedInAccount: '',
  colonyOwner: '',
  status: 'active',
  bestSolsSurvived: 0,
  lastAppliedTick: 'Never',
};
