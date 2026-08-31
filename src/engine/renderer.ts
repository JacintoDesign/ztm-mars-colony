import { getTileVertices, IsoConfig, GridPoint, screenToGrid } from './iso-math';
import { ColonyStore } from '../simulation/store';
import { BuildingType } from '../simulation/types';
import {
  drawBuilding,
  drawColonist,
  drawRover,
  drawAsteroid,
  drawBuildingConditionOverlay,
  drawLandingCapsule,
  drawLandingPad,
} from '../assets/building-renderers';
import { StatusLevel } from '../ui/toolbar';

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  store: ColonyStore;
  gridSize?: number;
  onHoverTile?: (tile: GridPoint | null) => void;
  onStatusChange?: (message: string, level: StatusLevel) => void;
}

function tileColorHash(gx: number, gy: number): number {
  let h = gx * 374761393 + gy * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

export class IsometricRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private store: ColonyStore;
  private config: IsoConfig;
  private hoveredTile: GridPoint | null = null;
  private selectedTool: BuildingType | null = null;
  private onHoverTile?: (tile: GridPoint | null) => void;
  private onStatusChange?: (message: string, level: StatusLevel) => void;
  private dpr = 1;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(options: RendererOptions) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;
    this.store = options.store;
    this.onHoverTile = options.onHoverTile;
    this.onStatusChange = options.onStatusChange;

    const gridSize = options.gridSize ?? 20;

    this.config = {
      gridSize,
      tileWidth: 64,
      tileHeight: 32,
      originX: 0,
      originY: 0,
    };

    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.render = this.render.bind(this);

    this.setupEvents();
    this.handleResize();
    this.store.subscribe(() => {
      this.updateStatus();
      this.requestRender();
    });
    this.requestRender();

    requestAnimationFrame(() => this.handleResize());
  }

  public setSelectedTool(tool: BuildingType | null): void {
    this.selectedTool = tool;
    this.updateStatus();
    this.requestRender();
  }

  public getSelectedTool(): BuildingType | null {
    return this.selectedTool;
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener('resize', this.handleResize);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('click', this.handleClick);
  }

  private setupEvents(): void {
    window.addEventListener('resize', this.handleResize);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.addEventListener('click', this.handleClick);

    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.canvas);
      if (this.canvas.parentElement) {
        this.resizeObserver.observe(this.canvas.parentElement);
      }
      this.resizeObserver.observe(document.body);
    }
  }

  private handleResize(): void {
    const width = Math.max(window.innerWidth, document.documentElement.clientWidth || 0);
    const height = Math.max(window.innerHeight, document.documentElement.clientHeight || 0);

    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';

    // Compute scale so the 20x20 isometric board stays centered and fills the screen smoothly
    const baseTileW = 64;
    const baseTileH = 32;
    const totalW = this.config.gridSize * baseTileW; // 1280
    const totalH = this.config.gridSize * baseTileH; // 640

    // Leave margin for header (64px) and toolbar (64px)
    const topMargin = 64;
    const bottomMargin = 64;
    const availableW = Math.max(300, width - 32);
    const availableH = Math.max(300, height - topMargin - bottomMargin);
    const scale = Math.max(0.5, Math.min(availableW / totalW, availableH / (totalH + 40)));

    const tileW = Math.floor(baseTileW * scale);
    const tileH = Math.floor(baseTileH * scale);
    this.config.tileWidth = tileW;
    this.config.tileHeight = tileH;

    this.config.originX = Math.floor(width / 2);
    const totalGridH = this.config.gridSize * tileH;
    this.config.originY = Math.max(10, Math.floor(topMargin + (availableH - totalGridH) / 2));

    this.render();
  }

  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private handleMouseMove(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);
    const tile = screenToGrid(x, y, this.config);

    if (!this.hoveredTile && !tile) return;
    if (this.hoveredTile && tile && this.hoveredTile.x === tile.x && this.hoveredTile.y === tile.y) return;

    this.hoveredTile = tile;
    if (this.onHoverTile) {
      this.onHoverTile(tile);
    }
    this.updateStatus();
    this.requestRender();
  }

  private handleMouseLeave(): void {
    if (this.hoveredTile !== null) {
      this.hoveredTile = null;
      if (this.onHoverTile) {
        this.onHoverTile(null);
      }
      this.updateStatus();
      this.requestRender();
    }
  }

  private handleClick(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);
    const tile = screenToGrid(x, y, this.config);

    if (!tile || !this.selectedTool) {
      return;
    }

    const result = this.store.dispatch({
      type: 'PLACE_BUILDING',
      buildingType: this.selectedTool,
      x: tile.x,
      y: tile.y,
    });

    if (!result.success && this.onStatusChange) {
      const level: StatusLevel = result.reason === 'Tile Occupied' ? 'warning' : 'critical';
      this.onStatusChange(result.reason ?? 'Placement Rejected', level);
    } else if (result.success && this.onStatusChange) {
      this.onStatusChange('Building Placed', 'nominal');
    }
    this.requestRender();
  }

  public requestRender(): void {
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(this.render);
    }
  }

  private render(): void {
    this.animationFrameId = null;
    const ctx = this.ctx;
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;

    // Reset transform matrix and apply DPR scale
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // 1. Dark Martian background
    ctx.fillStyle = '#1a0e08';
    ctx.fillRect(0, 0, width, height);

    // 2. 3D Geological Crust Slab
    this.render3DSlab(ctx);

    // 3. 20x20 Isometric Terrain Grid
    this.renderTerrainGrid(ctx);

    // 4. Placed Buildings & Colonists sorted back-to-front
    this.renderEntities(ctx);

    // 5. Atmospheric Haze effect per DESIGN.md (tints when oxygen < 50)
    this.renderAtmosphericHaze(ctx, width, height);

    // 6. Hover Highlight & Placement Ghost Preview
    this.renderHoverHighlight(ctx);
  }

  /**
   * Renders atmospheric dusty haze over the scene as oxygen drops below 50.
   */
  private renderAtmosphericHaze(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const oxygen = this.store.getState().oxygen;
    if (oxygen < 50) {
      const severity = (50 - oxygen) / 50; // 0 at oxygen=50, 1 at oxygen=0
      const opacity = severity * 0.48; // Max 48% dusty red-orange haze
      ctx.fillStyle = `rgba(180, 80, 20, ${opacity})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  private render3DSlab(ctx: CanvasRenderingContext2D): void {
    const { gridSize, tileHeight } = this.config;
    const slabDepth = Math.max(30, Math.floor(tileHeight * 1.15));

    // Front-Left Cliff
    const gy = gridSize - 1;
    for (let gx = 0; gx < gridSize; gx++) {
      const v = getTileVertices(gx, gy, this.config);
      ctx.fillStyle = '#1e0e07';
      ctx.beginPath();
      ctx.moveTo(v.left.x, v.left.y);
      ctx.lineTo(v.bottom.x, v.bottom.y);
      ctx.lineTo(v.bottom.x, v.bottom.y + slabDepth);
      ctx.lineTo(v.left.x, v.left.y + slabDepth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#29140b';
      ctx.beginPath();
      ctx.moveTo(v.left.x, v.left.y + slabDepth * 0.25);
      ctx.lineTo(v.bottom.x, v.bottom.y + slabDepth * 0.25);
      ctx.lineTo(v.bottom.x, v.bottom.y + slabDepth * 0.6);
      ctx.lineTo(v.left.x, v.left.y + slabDepth * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#120703';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(v.bottom.x, v.bottom.y);
      ctx.lineTo(v.bottom.x, v.bottom.y + slabDepth);
      ctx.stroke();
    }

    // Front-Right Cliff
    const gx = gridSize - 1;
    for (let gyCurrent = gridSize - 1; gyCurrent >= 0; gyCurrent--) {
      const v = getTileVertices(gx, gyCurrent, this.config);
      ctx.fillStyle = '#2f180e';
      ctx.beginPath();
      ctx.moveTo(v.bottom.x, v.bottom.y);
      ctx.lineTo(v.right.x, v.right.y);
      ctx.lineTo(v.right.x, v.right.y + slabDepth);
      ctx.lineTo(v.bottom.x, v.bottom.y + slabDepth);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#3c2013';
      ctx.beginPath();
      ctx.moveTo(v.bottom.x, v.bottom.y + slabDepth * 0.25);
      ctx.lineTo(v.right.x, v.right.y + slabDepth * 0.25);
      ctx.lineTo(v.right.x, v.right.y + slabDepth * 0.6);
      ctx.lineTo(v.bottom.x, v.bottom.y + slabDepth * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#1a0d06';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(v.right.x, v.right.y);
      ctx.lineTo(v.right.x, v.right.y + slabDepth);
      ctx.stroke();
    }
  }

  private renderTerrainGrid(ctx: CanvasRenderingContext2D): void {
    const { gridSize } = this.config;

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const v = getTileVertices(gx, gy, this.config);
        const rand = tileColorHash(gx, gy);

        ctx.beginPath();
        ctx.moveTo(v.top.x, v.top.y);
        ctx.lineTo(v.right.x, v.right.y);
        ctx.lineTo(v.bottom.x, v.bottom.y);
        ctx.lineTo(v.left.x, v.left.y);
        ctx.closePath();

        if (rand > 0.85) ctx.fillStyle = '#361c10';
        else if (rand > 0.65) ctx.fillStyle = '#30180d';
        else if (rand > 0.35) ctx.fillStyle = '#2b160c';
        else if (rand > 0.15) ctx.fillStyle = '#251208';
        else ctx.fillStyle = '#200f07';
        ctx.fill();

        ctx.strokeStyle = '#3d2417';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Landing Pad simple circle on (0, 0) ONLY if no ship is currently landed
        if (gx === 0 && gy === 0 && this.store.getState().pendingArrivals.length === 0) {
          drawLandingPad(ctx, v.center, this.config.tileWidth / 2, this.config.tileHeight / 2);
        }
      }
    }
  }

  /**
   * Renders placed buildings, colonists, rovers, asteroids, and landing zone pending arrivals sorted back-to-front by depth (x + y).
   */
  private renderEntities(ctx: CanvasRenderingContext2D): void {
    const state = this.store.getState();
    const isPowered = state.power > 0;
    const halfW = this.config.tileWidth / 2;
    const halfH = this.config.tileHeight / 2;

    // Combined entity list for unified depth sorting
    type RenderItem =
      | { kind: 'building'; x: number; y: number; building: typeof state.buildings[0] }
      | { kind: 'colonist'; x: number; y: number; colonist: typeof state.colonists[0] }
      | { kind: 'rover'; x: number; y: number; rover: typeof state.rovers[0] }
      | { kind: 'asteroid'; x: number; y: number; asteroid: typeof state.activeAsteroid };

    const entities: RenderItem[] = [
      ...state.buildings.map((b) => ({ kind: 'building' as const, x: b.x, y: b.y, building: b })),
      ...state.colonists.map((c) => ({ kind: 'colonist' as const, x: c.x, y: c.y, colonist: c })),
      ...state.rovers
        .filter((r) => r.state !== 'idle_at_base')
        .map((r) => ({ kind: 'rover' as const, x: r.x, y: r.y, rover: r })),
    ];

    if (state.activeAsteroid) {
      entities.push({
        kind: 'asteroid',
        x: state.activeAsteroid.x,
        y: state.activeAsteroid.y,
        asteroid: state.activeAsteroid,
      });
    }

    // Depth sort entities back-to-front by isometric distance (x + y)
    entities.sort((a, b) => {
      const depthA = a.x + a.y;
      const depthB = b.x + b.y;
      if (depthA !== depthB) {
        return depthA - depthB;
      }
      return a.y - b.y;
    });

    for (const item of entities) {
      if (item.kind === 'building') {
        const b = item.building;
        const isOperational = b.condition === 'operational';
        const tileDeposit = this.store.getTileOre(b.x, b.y);

        let isProducing = false;
        let dockedRovers = 2;

        if (b.type === 'garage') {
          dockedRovers = state.rovers.filter((r) => r.state === 'idle_at_base' && r.garageX === b.x && r.garageY === b.y).length;
        }

        if (isOperational) {
          if (b.type === 'solar') isProducing = isPowered;
          else if (b.type === 'scrubber') isProducing = state.power >= 3;
          else if (b.type === 'extractor') isProducing = tileDeposit > 0 && state.power >= 4;
          else if (b.type === 'farm') isProducing = state.power >= 2;
        }

        drawBuilding(ctx, {
          type: b.type,
          x: b.x,
          y: b.y,
          config: this.config,
          isPreview: false,
          isPowered: isPowered && isOperational,
          isProducing,
          dockedRovers,
        });

        // Condition overlay if broken or buried
        if (b.condition !== 'operational') {
          const v = getTileVertices(b.x, b.y, this.config);
          drawBuildingConditionOverlay(ctx, v.center, halfW, halfH, b.condition);
        }
      } else if (item.kind === 'colonist') {
        const c = item.colonist;
        const v = getTileVertices(c.x, c.y, this.config);
        drawColonist(ctx, v.center, c.health, c.age, c.lifespan);
      } else if (item.kind === 'rover') {
        const r = item.rover;
        const v = getTileVertices(r.x, r.y, this.config);
        const occupants = r.occupants ?? (r.state === 'idle_at_base' ? 0 : 1);
        drawRover(ctx, v.center, r.power, occupants);
      } else if (item.kind === 'asteroid') {
        const a = item.asteroid!;
        const v = getTileVertices(a.x, a.y, this.config);
        drawAsteroid(ctx, v.center, halfW, halfH);
      }
    }

    // Render Landing Zone (0, 0) pending arrivals with compact lunar/mars landing capsule
    if (state.pendingArrivals.length > 0) {
      const v0 = getTileVertices(0, 0, this.config);
      const arrival = state.pendingArrivals[0];
      drawLandingCapsule(ctx, v0.center, halfW, halfH, arrival.ticksRemaining);
    }
  }

  private renderHoverHighlight(ctx: CanvasRenderingContext2D): void {
    if (!this.hoveredTile) return;

    const { x, y } = this.hoveredTile;
    const v = getTileVertices(x, y, this.config);

    ctx.beginPath();
    ctx.moveTo(v.top.x, v.top.y);
    ctx.lineTo(v.right.x, v.right.y);
    ctx.lineTo(v.bottom.x, v.bottom.y);
    ctx.lineTo(v.left.x, v.left.y);
    ctx.closePath();

    if (this.selectedTool) {
      const check = this.store.checkPlacement(this.selectedTool, x, y);

      if (!check.canPlace) {
        ctx.fillStyle = 'rgba(217, 79, 61, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#D94F3D';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(217, 221, 224, 0.12)';
        ctx.fill();
        ctx.strokeStyle = '#d9dde0';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        drawBuilding(ctx, {
          type: this.selectedTool,
          x,
          y,
          config: this.config,
          isPreview: true,
        });
      }
    } else {
      ctx.fillStyle = 'rgba(217, 221, 224, 0.12)';
      ctx.fill();
      ctx.strokeStyle = '#8c9ba5';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  private updateStatus(): void {
    if (!this.onStatusChange) return;

    if (!this.selectedTool) {
      this.onStatusChange('Telemetry Link Nominal', 'nominal');
      return;
    }

    if (!this.hoveredTile) {
      this.onStatusChange('Select Tile', 'nominal');
      return;
    }

    const check = this.store.checkPlacement(this.selectedTool, this.hoveredTile.x, this.hoveredTile.y);
    if (!check.canPlace) {
      const level: StatusLevel = check.reason === 'Tile Occupied' ? 'warning' : 'critical';
      this.onStatusChange(check.reason ?? 'Placement Blocked', level);
    } else {
      const cost = check.cost;
      const costStr = cost.ore > 0 ? `${cost.power} Power, ${cost.ore} Ore` : `${cost.power} Power`;
      this.onStatusChange(`Ready (Cost: ${costStr})`, 'nominal');
    }
  }
}
