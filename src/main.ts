import './style.css';
import { ColonyStore } from './simulation/store';
import { InternalReadout } from './ui/internal-readout';
import { Toolbar } from './ui/toolbar';
import { IsometricRenderer } from './engine/renderer';
import { AuthModal } from './ui/auth-modal';
import { HeaderBar } from './ui/header-bar';
import { authManager, AuthState } from './services/auth-manager';
import { colonyService } from './services/colony-service';

// Initialize simulation store
const store = new ColonyStore();

// Initialize telemetry readout
const readout = new InternalReadout();
readout.update(store.getState());

// Subscribe readout to store updates
store.subscribe((state) => {
  readout.update(state);
});

// Initialize building placement toolbar
const toolbar = new Toolbar({
  containerId: 'toolbar',
  onSelectTool: (tool) => {
    renderer.setSelectedTool(tool);
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
    toolbar.setHoveredTile(tile);
  },
  onStatusChange: (message, level) => {
    toolbar.setStatus(message, level);
  },
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
      // Update account label in state
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

// Active colony loading state tracker
let activeColonyOwner: string | null = null;

async function handleAuthStateChange(authState: AuthState): Promise<void> {
  headerBar.updateAuth(authState);

  if (!authState.user) {
    // Unauthenticated: pause colony actions, reset store, show auth modal
    activeColonyOwner = null;
    store.setPersistenceHandler(null);
    store.reset();
    renderer.setSelectedTool(null);
    toolbar.setStatus('Authentication Required', 'warning');
    authModal.show();
    return;
  }

  // Authenticated user session established
  const user = authState.user;
  const isGuest = authState.isGuest;
  const userDisplay = isGuest ? `guest-${user.id.slice(0, 6)}` : (user.email ?? user.id.slice(0, 8));

  authModal.hide();
  toolbar.setStatus('Establishing Uplink...', 'nominal');

  try {
    const colonyData = await colonyService.loadOrCreateColony(user.id);
    activeColonyOwner = user.id;

    // Populate store with authoritative colony state from Supabase
    store.loadState({
      colonyId: colonyData.colony.id,
      signedInAccount: userDisplay,
      colonyOwner: colonyData.colony.owner,
      oxygen: colonyData.colony.oxygen,
      power: colonyData.colony.power,
      ore: colonyData.colony.ore,
      oreReserve: colonyData.colony.ore_reserve,
      tick: colonyData.colony.tick,
      buildings: colonyData.buildings,
      lastAppliedTick: colonyData.colony.last_tick_at
        ? new Date(colonyData.colony.last_tick_at).toLocaleTimeString()
        : 'Never',
    });

    // Configure database persistence on building placement
    store.setPersistenceHandler(async (building, cost) => {
      if (!activeColonyOwner || activeColonyOwner !== user.id) return;
      await colonyService.placeBuilding(
        colonyData.colony.id,
        user.id,
        building.type,
        building.x,
        building.y,
        cost,
        store.getState()
      );
    });

    toolbar.setStatus('Telemetry Link Nominal', 'nominal');
  } catch (err: any) {
    console.error('Error initializing colony session:', err);
    toolbar.setStatus(`Colony Load Error: ${err.message}`, 'critical');
    authModal.setStatus(`Failed to load colony: ${err.message}`, true);
    authModal.show();
  }
}

// Subscribe to auth state changes
authManager.subscribe((state) => {
  handleAuthStateChange(state);
});

// Initialize auth
authManager.init();
