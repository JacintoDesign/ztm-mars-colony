import { BuildingType } from '../simulation/types';
import { GridPoint } from '../engine/iso-math';

export type StatusLevel = 'nominal' | 'warning' | 'critical';

export interface ToolbarOptions {
  containerId?: string;
  onSelectTool: (tool: BuildingType | null) => void;
  onRefineCell?: () => void;
  onDispatchEscort?: () => void;
  onDispatchMining?: () => void;
  onTogglePower?: () => void;
  onRelocateExtractor?: () => void;
}

export class Toolbar {
  private container: HTMLElement;
  private currentTool: BuildingType | null = null;
  private currentStatus: string = 'Nominal';
  private currentStatusLevel: StatusLevel = 'nominal';
  private onSelectTool: (tool: BuildingType | null) => void;
  private onRefineCell?: () => void;
  private onDispatchEscort?: () => void;
  private onDispatchMining?: () => void;
  private onTogglePower?: () => void;
  private onRelocateExtractor?: () => void;
  public static readonly CONTAINER_ID = 'toolbar';

  constructor(options: ToolbarOptions) {
    this.onSelectTool = options.onSelectTool;
    this.onRefineCell = options.onRefineCell;
    this.onDispatchEscort = options.onDispatchEscort;
    this.onDispatchMining = options.onDispatchMining;
    this.onTogglePower = options.onTogglePower;
    this.onRelocateExtractor = options.onRelocateExtractor;

    const existing = document.getElementById(options.containerId ?? Toolbar.CONTAINER_ID);
    if (existing) {
      this.container = existing;
    } else {
      this.container = document.createElement('div');
      this.container.id = options.containerId ?? Toolbar.CONTAINER_ID;
      document.body.appendChild(this.container);
    }

    document.addEventListener('click', () => {
      document.querySelectorAll<HTMLElement>('.custom-dropdown-drawer').forEach((d) => (d.style.display = 'none'));
      document.querySelectorAll<HTMLElement>('.custom-dropdown-trigger').forEach((t) => t.classList.remove('open'));
    });

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

  public setStatus(message: string, level: StatusLevel = 'nominal'): void {
    this.currentStatus = message;
    this.currentStatusLevel = level;
    const statusEl = this.container.querySelector<HTMLElement>('#toolbar-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `toolbar-status-val status-${level}`;
    }
  }

  public setHoveredTile(_coords: GridPoint | null, _oreRemaining: number | null = null): void {
    // Grid coordinate tracking removed per UI design
  }

  private render(): void {
    this.container.innerHTML = '';

    const tools: Array<{ type: BuildingType; name: string; cost: string }> = [
      { type: 'habitat', name: 'Habitat', cost: '20 PWR' },
      { type: 'solar', name: 'Solar', cost: '15 PWR' },
      { type: 'scrubber', name: 'Scrubber', cost: '15 PWR, 5 Ore' },
      { type: 'extractor', name: 'Extractor', cost: '25 PWR' },
      { type: 'farm', name: 'Farm', cost: '20 PWR, 5 Ore' },
      { type: 'garage', name: 'Garage', cost: '30 PWR, 10 Ore' },
      { type: 'refinery', name: 'Refinery', cost: '25 PWR, 15 Ore' },
    ];

    // 1. Tool selection group (All 7 buildings)
    const toolsGroup = document.createElement('div');
    toolsGroup.className = 'toolbar-group';

    const label = document.createElement('span');
    label.className = 'toolbar-label';
    label.textContent = 'BUILD:';
    toolsGroup.appendChild(label);

    // 1a. Buttons View (Wide screens)
    const buttonsView = document.createElement('div');
    buttonsView.className = 'toolbar-buttons-view';

    for (const tool of tools) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `toolbar-btn ${this.currentTool === tool.type ? 'active' : ''}`;
      btn.id = `tool-${tool.type}`;
      btn.textContent = tool.name;

      btn.addEventListener('click', () => {
        if (this.currentTool === tool.type) {
          this.setTool(null);
          this.setStatus('Nominal', 'nominal');
        } else {
          this.setTool(tool.type);
        }
      });

      buttonsView.appendChild(btn);
    }
    toolsGroup.appendChild(buttonsView);

    // 1b. Dropdown View (Narrow / Compact screens)
    const dropdownView = document.createElement('div');
    dropdownView.className = 'toolbar-dropdown-view';

    const buildDropdownItems = tools.map((tool) => ({
      value: tool.type,
      label: `${tool.name} (${tool.cost})`,
      active: this.currentTool === tool.type,
    }));

    const buildCustomDropdown = this.createCustomDropdown({
      id: 'toolbar-build-dropdown',
      placeholder: '[ BUILD STRUCTURE... ]',
      items: buildDropdownItems,
      onSelect: (val) => {
        if (this.currentTool === val) {
          this.setTool(null);
          this.setStatus('Nominal', 'nominal');
        } else {
          this.setTool(val as BuildingType);
        }
      },
    });

    dropdownView.appendChild(buildCustomDropdown);
    toolsGroup.appendChild(dropdownView);

    this.container.appendChild(toolsGroup);

    // 2. Actions Group (Refine Cell, Dispatch Escort, Dispatch Mining)
    const actionsGroup = document.createElement('div');
    actionsGroup.className = 'toolbar-group toolbar-actions-group';

    const actLabel = document.createElement('span');
    actLabel.className = 'toolbar-label';
    actLabel.textContent = 'ACTIONS:';
    actionsGroup.appendChild(actLabel);

    // 2a. Buttons View
    const actButtonsView = document.createElement('div');
    actButtonsView.className = 'toolbar-buttons-view';

    const refineBtn = document.createElement('button');
    refineBtn.type = 'button';
    refineBtn.className = 'toolbar-btn toolbar-action-btn';
    refineBtn.id = 'action-refine-cell';
    refineBtn.textContent = 'Refine Cell (10 Ore)';
    refineBtn.addEventListener('click', () => {
      if (this.onRefineCell) this.onRefineCell();
    });
    actButtonsView.appendChild(refineBtn);

    const escortBtn = document.createElement('button');
    escortBtn.type = 'button';
    escortBtn.className = 'toolbar-btn toolbar-action-btn';
    escortBtn.id = 'action-dispatch-escort';
    escortBtn.textContent = 'Dispatch Escort';
    escortBtn.addEventListener('click', () => {
      if (this.onDispatchEscort) this.onDispatchEscort();
    });
    actButtonsView.appendChild(escortBtn);

    const miningBtn = document.createElement('button');
    miningBtn.type = 'button';
    miningBtn.className = 'toolbar-btn toolbar-action-btn';
    miningBtn.id = 'action-dispatch-mining';
    miningBtn.textContent = 'Dispatch Mining';
    miningBtn.addEventListener('click', () => {
      if (this.onDispatchMining) this.onDispatchMining();
    });
    actButtonsView.appendChild(miningBtn);

    const togglePowerBtn = document.createElement('button');
    togglePowerBtn.type = 'button';
    togglePowerBtn.className = 'toolbar-btn toolbar-action-btn';
    togglePowerBtn.id = 'action-toggle-power';
    togglePowerBtn.textContent = 'Toggle Power';
    togglePowerBtn.title = 'Turn off/on selected building or extractor to save power';
    togglePowerBtn.addEventListener('click', () => {
      if (this.onTogglePower) this.onTogglePower();
    });
    actButtonsView.appendChild(togglePowerBtn);

    const moveBtn = document.createElement('button');
    moveBtn.type = 'button';
    moveBtn.className = 'toolbar-btn toolbar-action-btn';
    moveBtn.id = 'action-move-extractor';
    moveBtn.textContent = 'Move Extractor (10P)';
    moveBtn.title = 'Relocate extractor to a new ore deposit';
    moveBtn.addEventListener('click', () => {
      if (this.onRelocateExtractor) this.onRelocateExtractor();
    });
    actButtonsView.appendChild(moveBtn);

    actionsGroup.appendChild(actButtonsView);

    // 2b. Dropdown View
    const actDropdownView = document.createElement('div');
    actDropdownView.className = 'toolbar-dropdown-view';

    const actDropdownItems = [
      { value: 'refine', label: 'Refine Cell (10 Ore)' },
      { value: 'escort', label: 'Dispatch Escort' },
      { value: 'mining', label: 'Dispatch Mining' },
      { value: 'toggle', label: 'Toggle Power (OFF/ON)' },
      { value: 'move', label: 'Move Extractor (10P)' },
    ];

    const actCustomDropdown = this.createCustomDropdown({
      id: 'toolbar-actions-dropdown',
      placeholder: '[ SELECT ACTION... ]',
      items: actDropdownItems,
      onSelect: (val) => {
        if (val === 'refine' && this.onRefineCell) {
          this.onRefineCell();
        } else if (val === 'escort' && this.onDispatchEscort) {
          this.onDispatchEscort();
        } else if (val === 'mining' && this.onDispatchMining) {
          this.onDispatchMining();
        } else if (val === 'toggle' && this.onTogglePower) {
          this.onTogglePower();
        } else if (val === 'move' && this.onRelocateExtractor) {
          this.onRelocateExtractor();
        }
      },
    });

    actDropdownView.appendChild(actCustomDropdown);
    actionsGroup.appendChild(actDropdownView);

    this.container.appendChild(actionsGroup);

    // 3. Status Bar section
    const statusGroup = document.createElement('div');
    statusGroup.className = 'toolbar-group toolbar-status-group';

    const statusLabel = document.createElement('span');
    statusLabel.className = 'toolbar-label';
    statusLabel.textContent = 'STATUS:';
    statusGroup.appendChild(statusLabel);

    const statusValue = document.createElement('span');
    statusValue.id = 'toolbar-status';
    statusValue.className = `toolbar-status-val status-${this.currentStatusLevel}`;
    statusValue.textContent = this.currentStatus;
    statusGroup.appendChild(statusValue);

    this.container.appendChild(statusGroup);
  }

  private createCustomDropdown(options: {
    id: string;
    placeholder: string;
    items: Array<{ value: string; label: string; active?: boolean }>;
    onSelect: (value: string) => void;
  }): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-dropdown';
    wrapper.id = `${options.id}-wrapper`;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-dropdown-trigger';
    trigger.id = options.id;

    const activeItem = options.items.find((i) => i.active);
    const triggerText = document.createElement('span');
    triggerText.className = 'custom-dropdown-text';
    triggerText.textContent = activeItem ? activeItem.label : options.placeholder;
    trigger.appendChild(triggerText);

    const arrow = document.createElement('span');
    arrow.className = 'custom-dropdown-arrow';
    arrow.textContent = '▼';
    trigger.appendChild(arrow);

    const drawer = document.createElement('div');
    drawer.className = 'custom-dropdown-drawer';
    drawer.style.display = 'none';

    for (const item of options.items) {
      const itemEl = document.createElement('div');
      itemEl.className = `custom-dropdown-item ${item.active ? 'active' : ''}`;
      itemEl.textContent = item.label;
      itemEl.dataset.value = item.value;

      itemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        drawer.style.display = 'none';
        trigger.classList.remove('open');
        options.onSelect(item.value);
      });

      drawer.appendChild(itemEl);
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer.style.display === 'block';
      document.querySelectorAll<HTMLElement>('.custom-dropdown-drawer').forEach((d) => {
        if (d !== drawer) d.style.display = 'none';
      });
      document.querySelectorAll<HTMLElement>('.custom-dropdown-trigger').forEach((t) => {
        if (t !== trigger) t.classList.remove('open');
      });

      if (isOpen) {
        drawer.style.display = 'none';
        trigger.classList.remove('open');
      } else {
        drawer.style.display = 'block';
        trigger.classList.add('open');
      }
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(drawer);
    return wrapper;
  }
}
