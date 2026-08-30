import { BuildingType } from '../simulation/types';
import { getTileVertices, IsoConfig, ScreenPoint } from '../engine/iso-math';

export interface DrawBuildingOptions {
  type: BuildingType;
  x: number;
  y: number;
  config: IsoConfig;
  isPreview?: boolean;
  isPowered?: boolean;
  isProducing?: boolean;
}

/**
 * Draws the Colonist sprite: stands upright at full health, slumps as health drops.
 */
export function drawColonist(ctx: CanvasRenderingContext2D, center: ScreenPoint, health: number): void {
  const cx = center.x;
  const cy = center.y + 2;
  const healthFraction = Math.max(0, Math.min(1, health / 100));

  // Slump factor: at 100 health slump is 0, at 10 health slump is 1
  const slump = 1 - healthFraction;
  const standH = 14 - slump * 5; // Height compresses as colonist slouches
  const leanX = slump * 3; // Leans forward in exhaustion

  ctx.save();

  // Ground contact shadow
  ctx.fillStyle = 'rgba(10, 5, 2, 0.6)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Suit legs
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy);
  ctx.lineTo(cx - 1.5, cy - standH * 0.4);
  ctx.moveTo(cx + 2, cy);
  ctx.lineTo(cx + 1.5, cy - standH * 0.4);
  ctx.stroke();

  // Suit torso
  const torsoY = cy - standH * 0.75;
  ctx.fillStyle = healthFraction > 0.3 ? '#cbd5e1' : '#94a3b8';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(cx - 3 + leanX * 0.5, torsoY, 6, standH * 0.45);
  ctx.fill();
  ctx.stroke();

  // Life support backpack
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 4.5 + leanX * 0.3, torsoY + 1, 2, standH * 0.35);

  // Helmet
  const helmetY = cy - standH;
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx + leanX, helmetY, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Helmet visor (Cyan at full health, Amber/Red when low health)
  ctx.fillStyle = healthFraction > 0.4 ? '#38bdf8' : (healthFraction > 0.15 ? '#E0A030' : '#D94F3D');
  ctx.beginPath();
  ctx.arc(cx + 1 + leanX, helmetY, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws the Habitat structure: low-profile, rounded composite biodome with airlock and cupola.
 */
export function drawHabitat(ctx: CanvasRenderingContext2D, center: ScreenPoint, halfW: number, halfH: number): void {
  const cx = center.x;
  const cy = center.y;

  const baseW = halfW * 0.72;
  const baseH = halfH * 0.72;
  const wallH = 13;
  const domeH = 15;

  // 1. Ground pad
  ctx.fillStyle = '#2b170d';
  ctx.strokeStyle = '#180b05';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, baseW * 1.15, baseH * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2. Base wall
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - baseW, cy);
  ctx.lineTo(cx, cy + baseH);
  ctx.lineTo(cx, cy + baseH - wallH);
  ctx.lineTo(cx - baseW, cy - wallH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(cx, cy + baseH);
  ctx.lineTo(cx + baseW, cy);
  ctx.lineTo(cx + baseW, cy - wallH);
  ctx.lineTo(cx, cy + baseH - wallH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Dome
  const domeBaseY = cy - wallH;
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, domeBaseY, baseW, baseH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.ellipse(cx, domeBaseY - domeH * 0.45, baseW * 0.75, baseH * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cupola
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, domeBaseY - domeH * 0.75, baseW * 0.28, baseH * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(cx - 1, domeBaseY - domeH * 0.75 - 1, baseW * 0.12, baseH * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Airlock
  const alW = baseW * 0.38;
  const alH = 9;
  const alY = cy + baseH;

  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - alW * 0.5, alY - 3);
  ctx.lineTo(cx + alW * 0.5, alY + 3);
  ctx.lineTo(cx + alW * 0.5, alY + 3 - alH);
  ctx.lineTo(cx - alW * 0.5, alY - 3 - alH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - 3, alY - alH + 3, 6, alH - 2);

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(cx - 1, alY - alH + 1, 2, 2);
}

/**
 * Draws the Solar Array: glows when power > 0; goes dark when grid fails.
 */
export function drawSolar(
  ctx: CanvasRenderingContext2D,
  center: ScreenPoint,
  halfW: number,
  halfH: number,
  isPowered = true
): void {
  const cx = center.x;
  const cy = center.y;

  // Ground anchor pad
  ctx.fillStyle = '#2a160d';
  ctx.strokeStyle = '#150a04';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3, 11, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Support pylon
  const pylonH = 16;
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 3);
  ctx.lineTo(cx + 3, cy + 3);
  ctx.lineTo(cx + 2.5, cy - pylonH);
  ctx.lineTo(cx - 2.5, cy - pylonH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const hubY = cy - pylonH;
  const spanW = halfW * 0.95;
  const spanH = halfH * 0.95;

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - spanW * 0.85, hubY);
  ctx.lineTo(cx + spanW * 0.85, hubY);
  ctx.stroke();

  // Gimbal hub
  ctx.fillStyle = '#64748b';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, hubY, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const gap = 2.5;
  const pw = spanW * 0.82;
  const ph = spanH * 0.65;
  const panelTiltY = 8;

  const drawWing = (isRight: boolean) => {
    const sign = isRight ? 1 : -1;
    const xIn = cx + sign * gap;
    const xOut = cx + sign * pw;

    const pTopIn = { x: xIn, y: hubY - ph - panelTiltY };
    const pBotIn = { x: xIn, y: hubY + ph };
    const pBotOut = { x: xOut, y: hubY + ph * 0.2 };
    const pTopOut = { x: xOut, y: hubY - ph * 0.8 - panelTiltY };

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(pTopOut.x, pTopOut.y);
    ctx.lineTo(pBotOut.x, pBotOut.y);
    ctx.lineTo(pBotIn.x, pBotIn.y);
    ctx.lineTo(pBotIn.x, pBotIn.y + 2);
    ctx.lineTo(pBotOut.x, pBotOut.y + 2);
    ctx.lineTo(pTopOut.x, pTopOut.y + 2);
    ctx.closePath();
    ctx.fill();

    // Solar panel surface: glowing blue when powered, dark matte black when unpowered
    ctx.fillStyle = isPowered ? '#0a2540' : '#090d12';
    ctx.strokeStyle = isPowered ? '#38bdf8' : '#334155';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(pTopIn.x, pTopIn.y);
    if (isRight) {
      ctx.lineTo(pTopOut.x, pTopOut.y);
      ctx.lineTo(pBotOut.x, pBotOut.y);
      ctx.lineTo(pBotIn.x, pBotIn.y);
    } else {
      ctx.lineTo(pBotIn.x, pBotIn.y);
      ctx.lineTo(pBotOut.x, pBotOut.y);
      ctx.lineTo(pTopOut.x, pTopOut.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Active power grid glow highlight
    if (isPowered) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo((pTopIn.x + pBotIn.x) / 2, (pTopIn.y + pBotIn.y) / 2);
      ctx.lineTo((pTopOut.x + pBotOut.x) / 2, (pTopOut.y + pBotOut.y) / 2);
      ctx.stroke();
    }
  };

  drawWing(false);
  drawWing(true);
}

/**
 * Draws the Scrubber: tall tower showing faint vent plume while producing oxygen.
 */
export function drawScrubber(
  ctx: CanvasRenderingContext2D,
  center: ScreenPoint,
  halfW: number,
  halfH: number,
  isProducing = true
): void {
  const cx = center.x;
  const cy = center.y;
  const towerH = 34;
  const w = halfW * 0.42;

  // Ground base pad
  ctx.fillStyle = '#2b170d';
  ctx.strokeStyle = '#180b05';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, w * 1.5, halfH * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tower body
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - w, cy);
  ctx.lineTo(cx, cy + halfH * 0.35);
  ctx.lineTo(cx, cy + halfH * 0.35 - towerH);
  ctx.lineTo(cx - w, cy - towerH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(cx, cy + halfH * 0.35);
  ctx.lineTo(cx + w, cy);
  ctx.lineTo(cx + w, cy - towerH);
  ctx.lineTo(cx, cy + halfH * 0.35 - towerH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Top vent cowl
  const topY = cy - towerH;
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.ellipse(cx, topY, w, halfH * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Vent Plume effect per DESIGN.md
  if (isProducing) {
    ctx.fillStyle = 'rgba(217, 221, 224, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, topY - 5, w * 0.65, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(217, 221, 224, 0.18)';
    ctx.beginPath();
    ctx.ellipse(cx, topY - 10, w * 0.9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draws the Extractor: wide low structure with scoop and vent glow while producing ore.
 */
export function drawExtractor(
  ctx: CanvasRenderingContext2D,
  center: ScreenPoint,
  halfW: number,
  halfH: number,
  isProducing = true
): void {
  const cx = center.x;
  const cy = center.y;
  const w = halfW * 0.68;
  const h = halfH * 0.68;
  const deckH = 12;

  // Foundation slab
  ctx.fillStyle = '#2b170d';
  ctx.strokeStyle = '#180b05';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, w * 1.25, h * 1.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Main chassis
  const deckY = cy - deckH;
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - w, cy);
  ctx.lineTo(cx, cy + h * 0.5);
  ctx.lineTo(cx, cy + h * 0.5 - deckH);
  ctx.lineTo(cx - w, deckY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(cx, cy + h * 0.5);
  ctx.lineTo(cx + w, cy);
  ctx.lineTo(cx + w, deckY);
  ctx.lineTo(cx, cy + h * 0.5 - deckH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Top deck
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(cx, deckY - h * 0.4);
  ctx.lineTo(cx + w, deckY);
  ctx.lineTo(cx, deckY + h * 0.5);
  ctx.lineTo(cx - w, deckY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Front scoop
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.6, cy + h * 0.4);
  ctx.lineTo(cx + w * 0.6, cy + h * 0.4);
  ctx.lineTo(cx + w * 0.4, cy + h * 0.9);
  ctx.lineTo(cx - w * 0.4, cy + h * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Vent Glow effect per DESIGN.md (glows while oreReserve > 0, stops when exhausted)
  if (isProducing) {
    ctx.fillStyle = '#E0A030';
    ctx.fillRect(cx - 3, deckY - 4, 6, 3);
    ctx.fillStyle = 'rgba(224, 160, 48, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, deckY - 3, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Dark unpowered vent
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 3, deckY - 4, 6, 3);
  }
}

/**
 * Main procedural dispatcher to draw any building type.
 */
export function drawBuilding(ctx: CanvasRenderingContext2D, options: DrawBuildingOptions): void {
  const { type, x, y, config, isPreview, isPowered = true, isProducing = true } = options;
  const vertices = getTileVertices(x, y, config);
  const halfW = config.tileWidth / 2;
  const halfH = config.tileHeight / 2;

  ctx.save();
  if (isPreview) {
    ctx.globalAlpha = 0.65;
  }

  switch (type) {
    case 'habitat':
      drawHabitat(ctx, vertices.center, halfW, halfH);
      break;
    case 'solar':
      drawSolar(ctx, vertices.center, halfW, halfH, isPowered);
      break;
    case 'scrubber':
      drawScrubber(ctx, vertices.center, halfW, halfH, isProducing);
      break;
    case 'extractor':
      drawExtractor(ctx, vertices.center, halfW, halfH, isProducing);
      break;
  }

  ctx.restore();
}
