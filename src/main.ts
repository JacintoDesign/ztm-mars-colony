import './style.css';
import { ColonyStore } from './simulation/store';
import { InternalReadout } from './ui/internal-readout';
import { Toolbar } from './ui/toolbar';
import { ResourcePanel } from './ui/resource-panel';
import { HelpModal } from './ui/help-modal';
import { IsometricRenderer } from './engine/renderer';
import { AuthModal } from './ui/auth-modal';
import { HeaderBar } from './ui/header-bar';
import { GameOverModal } from './ui/game-over-modal';
import { authManager, AuthState } from './services/auth-manager';
import { colonyService } from './services/colony-service';
import { RealtimeChannel } from '@supabase/supabase-js';

// Initialize simulation store
const store = new ColonyStore();

// Initialize telemetry readout and resource panel
const readout = new InternalReadout();
readout.update(store.getState());

const resourcePanel = new ResourcePanel();
resourcePanel.updateFromState(store.getState());

// Initialize help modal
const helpModal = new HelpModal();

// Initialize building placement toolbar
const toolbar = new Toolbar({
  containerId: 'toolbar',
  onSelectTool: (tool) => {
    renderer.setSelectedTool(tool);
  },
  onRefineCell: () => {
    const res = store.dispatch({ type: 'REFINE_CELL' });
    if (res.success) {
      toolbar.setStatus('Cell Refined (+1 Battery Cell)', 'nominal');
    } else {
      toolbar.setStatus(res.reason ? `Refine Failed: ${res.reason}` : 'Refine Failed', 'warning');
    }
  },
  onDispatchEscort: () => {
    const state = store.getState();
    const idleRover = state.rovers.find((r) => r.state === 'idle_at_base');
    if (!idleRover) {
      toolbar.setStatus('Escort Failed: No Idle Rovers', 'warning');
      return;
    }
    if (state.batteryCells.length === 0) {
      toolbar.setStatus('Escort Failed: No Battery Cells', 'warning');
      return;
    }
    const res = store.dispatch({
      type: 'DISPATCH_ROVER',
      roverId: idleRover.id,
      destinationType: 'landing_zone',
    });
    if (res.success) {
      toolbar.setStatus('Rover Dispatched to Landing Zone', 'nominal');
    } else {
      toolbar.setStatus(res.reason ? `Dispatch Failed: ${res.reason}` : 'Dispatch Failed', 'warning');
    }
  },
  onDispatchMining: () => {
    const state = store.getState();
    const idleRover = state.rovers.find((r) => r.state === 'idle_at_base');
    if (!idleRover) {
      toolbar.setStatus('Mining Failed: No Idle Rovers', 'warning');
      return;
    }
    if (state.batteryCells.length === 0) {
      toolbar.setStatus('Mining Failed: No Battery Cells', 'warning');
      return;
    }
    // Prefer asteroid if active, else first mining site with remaining ore
    let destType: 'asteroid' | 'mining_site' = 'mining_site';
    let targetTile = state.miningSites.length > 0 ? { x: state.miningSites[0].x, y: state.miningSites[0].y } : { x: 15, y: 15 };

    if (state.activeAsteroid) {
      destType = 'asteroid';
      targetTile = { x: state.activeAsteroid.x, y: state.activeAsteroid.y };
    }

    const res = store.dispatch({
      type: 'DISPATCH_ROVER',
      roverId: idleRover.id,
      destinationType: destType,
      targetTile,
    });
    if (res.success) {
      toolbar.setStatus(`Rover Dispatched to ${destType === 'asteroid' ? 'Asteroid' : 'Mining Site'}`, 'nominal');
    } else {
      toolbar.setStatus(res.reason ? `Dispatch Failed: ${res.reason}` : 'Dispatch Failed', 'warning');
    }
  },
  onTogglePower: () => {
    renderer.toggleBuildingPower();
  },
  onRelocateExtractor: () => {
    renderer.startRelocateBuilding();
  },
});

// Initialize canvas renderer
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Game canvas element not found');
}

const renderer = new IsometricRenderer({
  canvas,
  store,
  gridSize: 20,
  onHoverTile: (tile) => {
    if (tile) {
      const tileOre = store.getTileOre(tile.x, tile.y);
      toolbar.setHoveredTile(tile, tileOre);
    } else {
      toolbar.setHoveredTile(null);
    }
  },
  onStatusChange: (message, level) => {
    toolbar.setStatus(message, level);
  },
});

// Expose on window for debugging & automated playtesting
(window as any).__COLONY_STORE__ = store;
(window as any).__COLONY_RENDERER__ = renderer;
(window as any).__COLONY_SERVICE__ = colonyService;
(window as any).__COLONY_RESOURCE_PANEL__ = resourcePanel;
(window as any).__COLONY_HELP_MODAL__ = helpModal;
(window as any).__COLONY_TOOLBAR__ = toolbar;

// Active session tracking & timers
let activeUserId: string | null = null;
let activeColonyId: string | null = null;
let isInitializingUserId: string | null = null;
let clientProjectionInterval: number | null = null;
let serverSyncInterval: number | null = null;
let realtimeChannel: RealtimeChannel | null = null;

// Game Over Screen Modal
const gameOverModal = new GameOverModal({
  onRestart: async () => {
    if (!activeColonyId || !activeUserId) return;
    toolbar.setStatus('Re-initializing Colony...', 'warning');

    try {
      await colonyService.restartColony(activeColonyId, activeUserId);
      store.dispatch({ type: 'RESTART_COLONY' });
      gameOverModal.hide();
      toolbar.setStatus('Colony Re-established', 'nominal');
    } catch (err: any) {
      console.error('Failed to restart colony:', err);
      toolbar.setStatus(`Restart Error: ${err.message}`, 'critical');
    }
  },
});

// Subscribe readout, resource panel and game over screen to store updates
store.subscribe((state) => {
  readout.update(state);
  resourcePanel.updateFromState(state);

  if (state.status === 'game_over') {
    const solsSurvived = Math.floor(state.tick / 1000);
    gameOverModal.show(solsSurvived, state.bestSolsSurvived);
    toolbar.setStatus('CRITICAL: All Colonists Deceased', 'critical');
  } else {
    gameOverModal.hide();
  }
});

// Top-right Header Bar
const headerBar = new HeaderBar({
  onSignOut: async () => {
    toolbar.setStatus('Signing out...', 'warning');
    await authManager.signOut();
  },
  onUpgradeAccount: async (email, password) => {
    const res = await authManager.linkGuestAccount(email, password);
    if (!res.error) {
      toolbar.setStatus('Account Upgraded Successfully', 'nominal');
      store.loadState({
        signedInAccount: email,
      });
    }
    return res;
  },
});

// Authentication Modal
const authModal = new AuthModal({
  onSignIn: async (email, password) => {
    return await authManager.signIn(email, password);
  },
  onSignUp: async (email, password) => {
    return await authManager.signUp(email, password);
  },
  onGuestSignIn: async () => {
    return await authManager.signInAsGuest();
  },
});

/**
 * Starts the continuous 1-second client-side simulation projection
 * and 15-second server synchronization interval.
 */
function startSimulationLoops(userId: string): void {
  stopSimulationLoops();

  // 1. Client-side projection: 1 tick every 1 second of real time
  clientProjectionInterval = window.setInterval(() => {
    const state = store.getState();
    if (state.status === 'active') {
      store.advanceTicks(1);
    }
  }, 1000);

  // 2. Periodic server sync: save authoritative snapshot every 15 seconds
  serverSyncInterval = window.setInterval(async () => {
    const state = store.getState();
    if (state.colonyId && activeUserId === userId) {
      try {
        await colonyService.syncColonyState(state, userId);
      } catch (err) {
        console.warn('Periodic sync failed:', err);
      }
    }
  }, 15000);
}

function stopSimulationLoops(): void {
  if (clientProjectionInterval !== null) {
    clearInterval(clientProjectionInterval);
    clientProjectionInterval = null;
  }
  if (serverSyncInterval !== null) {
    clearInterval(serverSyncInterval);
    serverSyncInterval = null;
  }
  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }
}

async function handleAuthStateChange(authState: AuthState): Promise<void> {
  headerBar.updateAuth(authState);

  if (!authState.user) {
    // Unauthenticated
    stopSimulationLoops();
    activeUserId = null;
    activeColonyId = null;
    isInitializingUserId = null;
    store.setPersistenceHandler(null);
    store.setRestartHandler(null);
    store.reset();
    renderer.setSelectedTool(null);
    toolbar.setStatus('Authentication Required', 'warning');
    gameOverModal.hide();
    authModal.show();
    return;
  }

  // Authenticated user session established
  const user = authState.user;
  const isGuest = authState.isGuest;
  const userDisplay = isGuest ? `guest-${user.id.slice(0, 6)}` : (user.email ?? user.id.slice(0, 8));

  // If already active or currently initializing for this exact user, avoid re-triggering
  if (activeUserId === user.id || isInitializingUserId === user.id) {
    store.loadState({ signedInAccount: userDisplay });
    return;
  }

  isInitializingUserId = user.id;
  authModal.hide();
  toolbar.setStatus('Establishing Uplink...', 'nominal');

  try {
    const colonyData = await colonyService.loadOrCreateColony(user.id);
    activeUserId = user.id;
    activeColonyId = colonyData.colony.id;

    // Populate store with authoritative colony state
    store.loadState({
      colonyId: colonyData.colony.id,
      signedInAccount: userDisplay,
      colonyOwner: colonyData.colony.owner,
      oxygen: colonyData.colony.oxygen,
      power: colonyData.colony.power,
      food: colonyData.colony.food ?? 50,
      ore: colonyData.colony.ore,
      electronics: colonyData.colony.electronics ?? 0,
      seed: colonyData.colony.seed ?? 133742,
      oreDeposits: colonyData.oreDeposits,
      miningSites: colonyData.colony.mining_sites ?? [],
      activeAsteroid: colonyData.colony.active_asteroid ?? null,
      pendingArrivals: colonyData.colony.pending_arrivals ?? [],
      batteryCells: colonyData.colony.battery_cells ?? [],
      rovers: colonyData.rovers,
      buildings: colonyData.buildings,
      colonists: colonyData.colonists,
      status: colonyData.colony.status,
      bestSolsSurvived: colonyData.bestSolsSurvived,
      lastAppliedTick: colonyData.colony.last_tick_at
        ? new Date(colonyData.colony.last_tick_at).toLocaleTimeString()
        : 'Never',
    });

    // Configure database persistence on building placement
    store.setPersistenceHandler(async (building, cost) => {
      if (!activeUserId || activeUserId !== user.id || !activeColonyId) return;
      await colonyService.placeBuilding(
        activeColonyId,
        user.id,
        building.type,
        building.x,
        building.y,
        cost,
        store.getState()
      );
    });

    // Configure database restart handler
    store.setRestartHandler(async () => {
      if (!activeColonyId || !activeUserId) return;
      await colonyService.restartColony(activeColonyId, activeUserId);
    });

    // Start simulation projection & sync loops
    startSimulationLoops(user.id);

    // Subscribe to realtime changes on this colony
    realtimeChannel = colonyService.subscribeToColony(colonyData.colony.id, (payload) => {
      if (payload.new && payload.new.owner === user.id) {
        const row = payload.new;
        store.loadState({
          oxygen: row.oxygen,
          power: row.power,
          food: row.food,
          ore: row.ore,
          electronics: row.electronics,
          seed: row.seed,
          tick: Math.max(store.getState().tick, row.tick),
          status: row.status,
        });
      }
    });

    toolbar.setStatus('Telemetry Link Nominal', 'nominal');

    // Auto-open help modal on first load for this user
    helpModal.handleUserSession(user.id);
  } catch (err: any) {
    console.error('Error initializing colony session:', err);
    toolbar.setStatus(`Colony Load Error: ${err.message}`, 'critical');
    authModal.setStatus(`Failed to load colony: ${err.message}`, true);
    authModal.show();
  } finally {
    isInitializingUserId = null;
  }
}

// Subscribe to auth state changes
authManager.subscribe((state) => {
  handleAuthStateChange(state);
});

// Initialize auth
authManager.init();
