import { BuildingType } from '../simulation/types';
import { getTileVertices, IsoConfig, ScreenPoint } from '../engine/iso-math';

export interface DrawBuildingOptions {
  type: BuildingType;
  x: number;
  y: number;
  config: IsoConfig;
  isPreview?: boolean;
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

  // 1. Reinforced octagonal ground pad / plinth
  ctx.fillStyle = '#2b170d';
  ctx.strokeStyle = '#180b05';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, baseW * 1.15, baseH * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2. Extruded cylindrical base wall
  // Shadowed left wall
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

  // Illuminated right wall
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(cx, cy + baseH);
  ctx.lineTo(cx + baseW, cy);
  ctx.lineTo(cx + baseW, cy - wallH);
  ctx.lineTo(cx, cy + baseH - wallH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wall panel vertical seam lines
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - baseW * 0.5, cy + baseH * 0.5);
  ctx.lineTo(cx - baseW * 0.5, cy + baseH * 0.5 - wallH);
  ctx.moveTo(cx + baseW * 0.5, cy + baseH * 0.5);
  ctx.lineTo(cx + baseW * 0.5, cy + baseH * 0.5 - wallH);
  ctx.stroke();

  // 3. Main rounded dome structure
  const domeBaseY = cy - wallH;
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, domeBaseY, baseW, baseH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Upper dome curve
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.ellipse(cx, domeBaseY - domeH * 0.45, baseW * 0.75, baseH * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Geodesic panel seam lines
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - baseW * 0.6, domeBaseY - 2);
  ctx.quadraticCurveTo(cx, domeBaseY - domeH * 0.8, cx + baseW * 0.6, domeBaseY - 2);
  ctx.stroke();

  // Top observation cupola
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, domeBaseY - domeH * 0.75, baseW * 0.28, baseH * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cupola glass reflection
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(cx - 1, domeBaseY - domeH * 0.75 - 1, baseW * 0.12, baseH * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Front airlock vestibule module
  const alW = baseW * 0.38;
  const alH = 9;
  const alY = cy + baseH;

  // Airlock shell
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

  // Airlock door
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - 3, alY - alH + 3, 6, alH - 2);

  // Status beacon light
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(cx - 1, alY - alH + 1, 2, 2);
}

/**
 * Draws the Solar Array: strictly mirror-symmetrical dual-wing photovoltaic array.
 * Left and right wings have identical geometry, frame styling, cell grid lines, and colors.
 */
export function drawSolar(ctx: CanvasRenderingContext2D, center: ScreenPoint, halfW: number, halfH: number): void {
  const cx = center.x;
  const cy = center.y;

  // 1. Concrete ground anchor pad
  ctx.fillStyle = '#2a160d';
  ctx.strokeStyle = '#150a04';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3, 11, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2. Central support pylon and gimbal hub
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

  // Horizontal support crossbar
  const spanW = halfW * 0.95;
  const spanH = halfH * 0.95;

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - spanW * 0.85, hubY);
  ctx.lineTo(cx + spanW * 0.85, hubY);
  ctx.stroke();

  // Gimbal hub circle
  ctx.fillStyle = '#64748b';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, hubY, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. Strictly Symmetrical Dual Solar Wings (Left & Right)
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

    // Under-bevel / framing thickness
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

    // Main solar panel surface
    ctx.fillStyle = '#0a192f';
    ctx.strokeStyle = '#64748b';
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

    // PV cell grid dividing lines
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 0.8;

    // Horizontal centerline
    ctx.beginPath();
    ctx.moveTo((pTopIn.x + pBotIn.x) / 2, (pTopIn.y + pBotIn.y) / 2);
    ctx.lineTo((pTopOut.x + pBotOut.x) / 2, (pTopOut.y + pBotOut.y) / 2);
    ctx.stroke();

    // Vertical cell dividers
    for (let f = 0.33; f <= 0.67; f += 0.34) {
      const topX = pTopIn.x * (1 - f) + pTopOut.x * f;
      const topY = pTopIn.y * (1 - f) + pTopOut.y * f;
      const botX = pBotIn.x * (1 - f) + pBotOut.x * f;
      const botY = pBotIn.y * (1 - f) + pBotOut.y * f;

      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(botX, botY);
      ctx.stroke();
    }
  };

  // Draw Left Wing and Right Wing with identical mirror logic
  drawWing(false);
  drawWing(true);

  // Central power indicator dot
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(cx, hubY, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws the Scrubber: simplified, elegant industrial atmospheric filtration tower.
 * Features a clean solid base plinth (no black squares), tall vertical column with heatsink ribs,
 * and a simple, bold top exhaust stack.
 */
export function drawScrubber(ctx: CanvasRenderingContext2D, center: ScreenPoint, halfW: number, halfH: number): void {
  const cx = center.x;
  const cy = center.y;

  const totalH = 54;
  const baseW = halfW * 0.55;
  const baseH = halfH * 0.55;
  const towerW = halfW * 0.34;
  const towerH = halfH * 0.34;

  // 1. Reinforced heavy foundation plinth
  ctx.fillStyle = '#1e110a';
  ctx.strokeStyle = '#0f0804';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - baseH * 1.25);
  ctx.lineTo(cx + baseW * 1.25, cy);
  ctx.lineTo(cx, cy + baseH * 1.25);
  ctx.lineTo(cx - baseW * 1.25, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Clean, solid lower intake block (no black squares, clean faceted industrial panels)
  const lowerH = 12;
  // Left shadow face
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - baseW, cy);
  ctx.lineTo(cx, cy + baseH);
  ctx.lineTo(cx, cy + baseH - lowerH);
  ctx.lineTo(cx - baseW, cy - lowerH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right light face
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(cx, cy + baseH);
  ctx.lineTo(cx + baseW, cy);
  ctx.lineTo(cx + baseW, cy - lowerH);
  ctx.lineTo(cx, cy + baseH - lowerH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle horizontal panel seam on base
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - baseW * 0.85, cy + baseH * 0.5 - lowerH * 0.5);
  ctx.lineTo(cx, cy + baseH - lowerH * 0.5);
  ctx.lineTo(cx + baseW * 0.85, cy + baseH * 0.5 - lowerH * 0.5);
  ctx.stroke();

  // 3. Main vertical filtration column (Upper Stage)
  const gantryY = cy - lowerH;
  const colTopY = cy - totalH;

  // Left shadow face
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - towerW, gantryY);
  ctx.lineTo(cx, gantryY + towerH);
  ctx.lineTo(cx, colTopY + towerH);
  ctx.lineTo(cx - towerW, colTopY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right illuminated face
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(cx, gantryY + towerH);
  ctx.lineTo(cx + towerW, gantryY);
  ctx.lineTo(cx + towerW, colTopY);
  ctx.lineTo(cx, colTopY + towerH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Vertical radiator cooling fins on right face
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  for (let f = 0.25; f <= 0.75; f += 0.25) {
    const rx = cx + towerW * f;
    const ry1 = gantryY + towerH * (1 - f);
    const ry2 = colTopY + towerH * (1 - f);
    ctx.beginPath();
    ctx.moveTo(rx, ry1);
    ctx.lineTo(rx, ry2);
    ctx.stroke();
  }

  // Vertical oxygen conduit line
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 2, gantryY + towerH - 2);
  ctx.lineTo(cx - 2, colTopY + towerH - 2);
  ctx.stroke();

  // 4. Clean, simplified top exhaust chimney
  // Flat cap plate
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, colTopY - towerH * 0.9);
  ctx.lineTo(cx + towerW * 1.1, colTopY);
  ctx.lineTo(cx, colTopY + towerH * 0.9);
  ctx.lineTo(cx - towerW * 1.1, colTopY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Single clean central cylindrical exhaust stack
  const stackW = towerW * 0.65;
  const stackH = 7;
  const stackY = colTopY;

  // Left shadow stack face
  ctx.fillStyle = '#334155';
  ctx.fillRect(cx - stackW, stackY - stackH, stackW, stackH);

  // Right light stack face
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(cx, stackY - stackH, stackW, stackH);

  // Dark circular exhaust vent aperture with cyan status ring
  ctx.fillStyle = '#090d16';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(cx, stackY - stackH, stackW, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * Main procedural dispatcher to draw any building type.
 */
export function drawBuilding(ctx: CanvasRenderingContext2D, options: DrawBuildingOptions): void {
  const { type, x, y, config, isPreview } = options;
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
      drawSolar(ctx, vertices.center, halfW, halfH);
      break;
    case 'scrubber':
      drawScrubber(ctx, vertices.center, halfW, halfH);
      break;
  }

  ctx.restore();
}
