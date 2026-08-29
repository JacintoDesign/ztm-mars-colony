import './style.css';
import { ColonyStore } from './simulation/store';
import { InternalReadout } from './ui/internal-readout';
import { Toolbar } from './ui/toolbar';
import { IsometricRenderer } from './engine/renderer';

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
});
