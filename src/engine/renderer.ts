import { getTileVertices, IsoConfig, GridPoint, screenToGrid, sortBackToFront } from './iso-math';
import { ColonyStore } from '../simulation/store';
import { BuildingType } from '../simulation/types';
import { drawBuilding } from '../assets/building-renderers';

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  store: ColonyStore;
  gridSize?: number;
  onHoverTile?: (tile: GridPoint | null) => void;
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
    this.store.subscribe(() => this.requestRender());
    this.requestRender();

    // Extra checks on initialization to ensure immediate sync with viewport
    requestAnimationFrame(() => this.handleResize());
    setTimeout(() => this.handleResize(), 60);
  }

  public setSelectedTool(tool: BuildingType | null): void {
    this.selectedTool = tool;
    this.requestRender();
  }

  public getSelectedTool(): BuildingType | null {
    return this.selectedTool;
  }

  public getConfig(): IsoConfig {
    return { ...this.config };
  }

  private setupEvents(): void {
    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('load', this.handleResize, { passive: true });
    window.addEventListener('fullscreenchange', this.handleResize, { passive: true });
    document.addEventListener('fullscreenchange', this.handleResize, { passive: true });
    window.addEventListener('orientationchange', this.handleResize, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.handleResize, { passive: true });
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(document.body);
    }

    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.addEventListener('click', this.handleClick);
  }

  public destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('load', this.handleResize);
    window.removeEventListener('fullscreenchange', this.handleResize);
    document.removeEventListener('fullscreenchange', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);

    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.handleResize);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('click', this.handleClick);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  public handleResize(): void {
    this.dpr = window.devicePixelRatio || 1;

    // Use direct viewport measurements
    const width = window.innerWidth || document.documentElement.clientWidth || 1280;
    const height = window.innerHeight || document.documentElement.clientHeight || 720;

    if (width <= 0 || height <= 0) return;

    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);

    // Responsive isometric tile sizing ensuring the grid fills the page properly
    const paddingX = 48;
    const paddingY = 88;
    const maxTileW = (width - paddingX) / this.config.gridSize;
    const maxTileH = (height - paddingY) / this.config.gridSize;

    const idealTileW = Math.min(maxTileW, maxTileH * 2);
    const tileW = Math.max(36, Math.floor(idealTileW / 2) * 2);
    const tileH = tileW / 2;

    this.config.tileWidth = tileW;
    this.config.tileHeight = tileH;

    // Perfectly center the 20x20 grid in the viewport
    this.config.originX = Math.floor(width / 2);
    const totalGridH = this.config.gridSize * tileH;
    this.config.originY = Math.max(16, Math.floor((height - totalGridH) / 2 - 8));

    // Render immediately on resize
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
    this.requestRender();
  }

  private handleMouseLeave(): void {
    if (this.hoveredTile !== null) {
      this.hoveredTile = null;
      if (this.onHoverTile) {
        this.onHoverTile(null);
      }
      this.requestRender();
    }
  }

  private handleClick(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);
    const tile = screenToGrid(x, y, this.config);

    if (!tile || !this.selectedTool) {
      return;
    }

    this.store.dispatch({
      type: 'PLACE_BUILDING',
      buildingType: this.selectedTool,
      x: tile.x,
      y: tile.y,
    });
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

    // 1. Clean dark Martian background across the entire canvas
    ctx.fillStyle = '#1a0e08';
    ctx.fillRect(0, 0, width, height);

    // 2. 3D Extruded Geological Crust Slab
    this.render3DSlab(ctx);

    // 3. 20x20 Isometric Terrain Grid with color-only tile variations
    this.renderTerrainGrid(ctx);

    // 4. Placed Buildings sorted back-to-front
    this.renderBuildings(ctx);

    // 5. Hover Highlight & Placement Ghost Preview
    this.renderHoverHighlight(ctx);
  }

  /**
   * Renders the 3D extruded geological crust slab along the front perimeter edges.
   */
  private render3DSlab(ctx: CanvasRenderingContext2D): void {
    const { gridSize, tileHeight } = this.config;
    const slabDepth = Math.max(30, Math.floor(tileHeight * 1.15));

    // 1. Front-Left Extruded Cliff (gy = gridSize - 1, gx from 0 to gridSize - 1)
    const gy = gridSize - 1;
    for (let gx = 0; gx < gridSize; gx++) {
      const v = getTileVertices(gx, gy, this.config);

      // Shadow facet on left cliff
      ctx.fillStyle = '#1e0e07';
      ctx.beginPath();
      ctx.moveTo(v.left.x, v.left.y);
      ctx.lineTo(v.bottom.x, v.bottom.y);
      ctx.lineTo(v.bottom.x, v.bottom.y + slabDepth);
      ctx.lineTo(v.left.x, v.left.y + slabDepth);
      ctx.closePath();
      ctx.fill();

      // Geological strata stripe
      ctx.fillStyle = '#29140b';
      ctx.beginPath();
      ctx.moveTo(v.left.x, v.left.y + slabDepth * 0.25);
      ctx.lineTo(v.bottom.x, v.bottom.y + slabDepth * 0.25);
      ctx.lineTo(v.bottom.x, v.bottom.y + slabDepth * 0.6);
      ctx.lineTo(v.left.x, v.left.y + slabDepth * 0.6);
      ctx.closePath();
      ctx.fill();

      // Vertical rock joint
      ctx.strokeStyle = '#120703';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(v.bottom.x, v.bottom.y);
      ctx.lineTo(v.bottom.x, v.bottom.y + slabDepth);
      ctx.stroke();
    }

    // 2. Front-Right Extruded Cliff (gx = gridSize - 1, gy from gridSize - 1 down to 0)
    const gx = gridSize - 1;
    for (let gyCurrent = gridSize - 1; gyCurrent >= 0; gyCurrent--) {
      const v = getTileVertices(gx, gyCurrent, this.config);

      // Illuminated facet on right cliff
      ctx.fillStyle = '#2f180e';
      ctx.beginPath();
      ctx.moveTo(v.bottom.x, v.bottom.y);
      ctx.lineTo(v.right.x, v.right.y);
      ctx.lineTo(v.right.x, v.right.y + slabDepth);
      ctx.lineTo(v.bottom.x, v.bottom.y + slabDepth);
      ctx.closePath();
      ctx.fill();

      // Geological strata stripe
      ctx.fillStyle = '#3c2013';
      ctx.beginPath();
      ctx.moveTo(v.bottom.x, v.bottom.y + slabDepth * 0.25);
      ctx.lineTo(v.right.x, v.right.y + slabDepth * 0.25);
      ctx.lineTo(v.right.x, v.right.y + slabDepth * 0.6);
      ctx.lineTo(v.bottom.x, v.bottom.y + slabDepth * 0.6);
      ctx.closePath();
      ctx.fill();

      // Vertical rock joint
      ctx.strokeStyle = '#1a0d06';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(v.right.x, v.right.y);
      ctx.lineTo(v.right.x, v.right.y + slabDepth);
      ctx.stroke();
    }

    // Bottom outer boundary line
    const leftCorner = getTileVertices(0, gridSize - 1, this.config).left;
    const bottomCorner = getTileVertices(gridSize - 1, gridSize - 1, this.config).bottom;
    const rightCorner = getTileVertices(gridSize - 1, 0, this.config).right;

    ctx.strokeStyle = '#100602';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(leftCorner.x, leftCorner.y + slabDepth);
    ctx.lineTo(bottomCorner.x, bottomCorner.y + slabDepth);
    ctx.lineTo(rightCorner.x, rightCorner.y + slabDepth);
    ctx.stroke();
  }

  /**
   * Renders the 20x20 isometric terrain grid with purely color-based Martian earth tone differences.
   */
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

        // Natural Martian earth tone palette variations
        if (rand > 0.85) {
          ctx.fillStyle = '#361c10'; // Warm iron-oxide soil patch
        } else if (rand > 0.65) {
          ctx.fillStyle = '#30180d'; // Medium rust tone
        } else if (rand > 0.35) {
          ctx.fillStyle = '#2b160c'; // Standard Martian regolith
        } else if (rand > 0.15) {
          ctx.fillStyle = '#251208'; // Deep regolith
        } else {
          ctx.fillStyle = '#200f07'; // Dark basalt patch
        }
        ctx.fill();

        ctx.strokeStyle = '#3d2417';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  /**
   * Renders placed buildings sorted back-to-front.
   */
  private renderBuildings(ctx: CanvasRenderingContext2D): void {
    const buildings = this.store.getState().buildings;
    const sorted = sortBackToFront(buildings);

    for (const b of sorted) {
      drawBuilding(ctx, {
        type: b.type,
        x: b.x,
        y: b.y,
        config: this.config,
        isPreview: false,
      });
    }
  }

  /**
   * Renders hovered tile highlights and building placement preview ghost.
   */
  private renderHoverHighlight(ctx: CanvasRenderingContext2D): void {
    if (!this.hoveredTile) return;

    const { x, y } = this.hoveredTile;
    const v = getTileVertices(x, y, this.config);
    const isOccupied = this.store.hasBuildingAt(x, y);

    // Draw diamond outline highlight
    ctx.beginPath();
    ctx.moveTo(v.top.x, v.top.y);
    ctx.lineTo(v.right.x, v.right.y);
    ctx.lineTo(v.bottom.x, v.bottom.y);
    ctx.lineTo(v.left.x, v.left.y);
    ctx.closePath();

    if (isOccupied && this.selectedTool) {
      // Invalid placement over occupied tile (Critical tone #D94F3D)
      ctx.fillStyle = 'rgba(217, 79, 61, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#D94F3D';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    } else {
      // Valid hover / empty tile
      ctx.fillStyle = 'rgba(217, 221, 224, 0.12)';
      ctx.fill();
      ctx.strokeStyle = '#d9dde0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // If a tool is selected and tile is empty, draw preview ghost
      if (this.selectedTool && !isOccupied) {
        drawBuilding(ctx, {
          type: this.selectedTool,
          x,
          y,
          config: this.config,
          isPreview: true,
        });
      }
    }
  }
}
