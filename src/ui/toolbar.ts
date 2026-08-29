import { BuildingType } from '../simulation/types';
import { GridPoint } from '../engine/iso-math';

export interface ToolbarOptions {
  containerId?: string;
  onSelectTool: (tool: BuildingType | null) => void;
}

export class Toolbar {
  private container: HTMLElement;
  private currentTool: BuildingType | null = null;
  private hoveredCoords: GridPoint | null = null;
  private onSelectTool: (tool: BuildingType | null) => void;
  public static readonly CONTAINER_ID = 'toolbar';

  constructor(options: ToolbarOptions) {
    this.onSelectTool = options.onSelectTool;
    const existing = document.getElementById(options.containerId ?? Toolbar.CONTAINER_ID);
    if (existing) {
      this.container = existing;
    } else {
      this.container = document.createElement('div');
      this.container.id = options.containerId ?? Toolbar.CONTAINER_ID;
      document.body.appendChild(this.container);
    }

    this.render();
  }

  public getSelectedTool(): BuildingType | null {
    return this.currentTool;
  }

  public setTool(tool: BuildingType | null): void {
    this.currentTool = tool;
    this.render();
    this.onSelectTool(this.currentTool);
  }

  public setHoveredTile(coords: GridPoint | null): void {
    this.hoveredCoords = coords;
    const coordsEl = this.container.querySelector<HTMLElement>('#toolbar-coords');
    if (coordsEl) {
      if (coords) {
        const padX = String(coords.x).padStart(2, '0');
        const padY = String(coords.y).padStart(2, '0');
        coordsEl.textContent = `[${padX}, ${padY}]`;
        coordsEl.classList.add('active');
      } else {
        coordsEl.textContent = `[--, --]`;
        coordsEl.classList.remove('active');
      }
    }
  }

  private render(): void {
    this.container.innerHTML = '';

    // Left section: Tool selection
    const toolsGroup = document.createElement('div');
    toolsGroup.className = 'toolbar-group';

    const label = document.createElement('span');
    label.className = 'toolbar-label';
    label.textContent = 'BUILD:';
    toolsGroup.appendChild(label);

    const tools: Array<{ type: BuildingType; name: string }> = [
      { type: 'habitat', name: 'Habitat' },
      { type: 'solar', name: 'Solar' },
      { type: 'scrubber', name: 'Scrubber' },
    ];

    for (const tool of tools) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `toolbar-btn ${this.currentTool === tool.type ? 'active' : ''}`;
      btn.id = `tool-${tool.type}`;
      btn.textContent = tool.name;

      btn.addEventListener('click', () => {
        if (this.currentTool === tool.type) {
          this.setTool(null);
        } else {
          this.setTool(tool.type);
        }
      });

      toolsGroup.appendChild(btn);
    }

    this.container.appendChild(toolsGroup);

    // Right section: Coordinate Telemetry
    const coordsGroup = document.createElement('div');
    coordsGroup.className = 'toolbar-group toolbar-coords-group';

    const coordsLabel = document.createElement('span');
    coordsLabel.className = 'toolbar-label';
    coordsLabel.textContent = 'GRID:';
    coordsGroup.appendChild(coordsLabel);

    const coordsValue = document.createElement('span');
    coordsValue.id = 'toolbar-coords';
    coordsValue.className = 'toolbar-coords-val';
    if (this.hoveredCoords) {
      const padX = String(this.hoveredCoords.x).padStart(2, '0');
      const padY = String(this.hoveredCoords.y).padStart(2, '0');
      coordsValue.textContent = `[${padX}, ${padY}]`;
      coordsValue.classList.add('active');
    } else {
      coordsValue.textContent = `[--, --]`;
    }
    coordsGroup.appendChild(coordsValue);

    this.container.appendChild(coordsGroup);
  }
}
