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

  // 2. Clean, solid lower intake block
  const lowerH = 12;
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

  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(cx, cy + baseH);
  ctx.lineTo(cx + baseW, cy);
  ctx.lineTo(cx + baseW, cy - lowerH);
  ctx.lineTo(cx, cy + baseH - lowerH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle horizontal panel seam
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - baseW * 0.85, cy + baseH * 0.5 - lowerH * 0.5);
  ctx.lineTo(cx, cy + baseH - lowerH * 0.5);
  ctx.lineTo(cx + baseW * 0.85, cy + baseH * 0.5 - lowerH * 0.5);
  ctx.stroke();

  // 3. Main vertical filtration column
  const gantryY = cy - lowerH;
  const colTopY = cy - totalH;

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

  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(cx, gantryY + towerH);
  ctx.lineTo(cx + towerW, gantryY);
  ctx.lineTo(cx + towerW, colTopY);
  ctx.lineTo(cx, colTopY + towerH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Vertical radiator cooling fins
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

  const stackW = towerW * 0.65;
  const stackH = 7;
  const stackY = colTopY;

  ctx.fillStyle = '#334155';
  ctx.fillRect(cx - stackW, stackY - stackH, stackW, stackH);

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(cx, stackY - stackH, stackW, stackH);

  ctx.fillStyle = '#090d16';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(cx, stackY - stackH, stackW, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * Draws the Extractor: wide and low Mars heavy industrial surface excavator.
 * A cohesive, architectural mining structure featuring a wide low-slung chassis,
 * an integrated rear power engine with glowing amber horizontal heat vents,
 * a central recessed ore crushing bay, and a massive 3D forward-sloping excavator
 * scoop with heavy side-cheeks, hydraulic push-rods, and a segmented tungsten cutting blade.
 */
export function drawExtractor(ctx: CanvasRenderingContext2D, center: ScreenPoint, halfW: number, halfH: number): void {
  const cx = center.x;
  const cy = center.y;

  const w = halfW * 0.84;
  const h = halfH * 0.84;
  const wallH = 15;

  // 1. Reinforced Ground Plinth Pad
  ctx.fillStyle = '#221209';
  ctx.strokeStyle = '#100602';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h * 1.12);
  ctx.lineTo(cx + w * 1.12, cy);
  ctx.lineTo(cx, cy + h * 1.12);
  ctx.lineTo(cx - w * 1.12, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Main Industrial Machine Chassis (Extruded Isometric Diamond Body)
  const deckY = cy - wallH;

  // Left shadow flank (slope = +0.5)
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - w, cy);
  ctx.lineTo(cx, cy + h);
  ctx.lineTo(cx, deckY + h);
  ctx.lineTo(cx - w, deckY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right illuminated flank (slope = -0.5)
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(cx, cy + h);
  ctx.lineTo(cx + w, cy);
  ctx.lineTo(cx + w, deckY);
  ctx.lineTo(cx, deckY + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Top deck plate (clean diamond)
  ctx.fillStyle = '#64748b';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, deckY - h);
  ctx.lineTo(cx + w, deckY);
  ctx.lineTo(cx, deckY + h);
  ctx.lineTo(cx - w, deckY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Integrated Rear Generator Housing & Perfectly Aligned Amber Radiator Slats
  const genW = w * 0.48;
  const genH = h * 0.48;
  const genCenterY = deckY - h * 0.38;
  const genHgt = 10;

  // Left shadow wall of generator
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - genW, genCenterY);
  ctx.lineTo(cx, genCenterY + genH);
  ctx.lineTo(cx, genCenterY + genH - genHgt);
  ctx.lineTo(cx - genW, genCenterY - genHgt);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right illuminated wall of generator
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(cx, genCenterY + genH);
  ctx.lineTo(cx + genW, genCenterY);
  ctx.lineTo(cx + genW, genCenterY - genHgt);
  ctx.lineTo(cx, genCenterY + genH - genHgt);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Top plate of generator
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, genCenterY - genH - genHgt);
  ctx.lineTo(cx + genW, genCenterY - genHgt);
  ctx.lineTo(cx, genCenterY + genH - genHgt);
  ctx.lineTo(cx - genW, genCenterY - genHgt);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing amber radiator slats on the right generator wall (strictly parallel, slope = -0.5)
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.2;
  const slatDyList = [-6, -4, -2];
  for (const sDy of slatDyList) {
    const tStart = 0.22;
    const tEnd = 0.78;
    const sx1 = cx + genW * tStart;
    const sy1 = genCenterY + genH * (1 - tStart) - genHgt + sDy;
    const sx2 = cx + genW * tEnd;
    const sy2 = genCenterY + genH * (1 - tEnd) - genHgt + sDy;

    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();
  }

  // 4. Central Ore Crushing Bay / Hopper with Raw Ore Stockpile
  const bayW = w * 0.36;
  const bayH = h * 0.36;
  const bayY = deckY + h * 0.05;

  // Recessed dark crusher opening
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, bayY - bayH);
  ctx.lineTo(cx + bayW, bayY);
  ctx.lineTo(cx, bayY + bayH);
  ctx.lineTo(cx - bayW, bayY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing Martian ore chunks in crushing bay
  ctx.fillStyle = '#c2410c';
  ctx.beginPath();
  ctx.moveTo(cx - bayW * 0.6, bayY);
  ctx.lineTo(cx, bayY - bayH * 0.5);
  ctx.lineTo(cx + bayW * 0.6, bayY);
  ctx.lineTo(cx, bayY + bayH * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ea580c';
  ctx.fillRect(cx - 3, bayY - 2, 6, 4);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(cx - 1, bayY - 1, 2, 2);

  // 5. Bold 3D Forward-Sloping Heavy Excavator Scoop
  // Spans across the front edge, slanting downward into the ground
  const sw = w * 0.94;
  const sh = h * 0.94;
  const scoopFrontX = cx;
  const scoopFrontY = cy + h * 1.08;
  const sDepth = 12;

  // Key scoop corner vertices
  const botLeft = { x: cx - sw, y: scoopFrontY - sh };
  const botTip = { x: scoopFrontX, y: scoopFrontY };
  const botRight = { x: cx + sw, y: scoopFrontY - sh };

  const topLeft = { x: cx - sw, y: scoopFrontY - sh - sDepth };
  const topTip = { x: scoopFrontX, y: scoopFrontY - sDepth };
  const topRight = { x: cx + sw, y: scoopFrontY - sh - sDepth };

  // Left shadow cheek plate (slope = +0.5)
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(botLeft.x, botLeft.y);
  ctx.lineTo(botTip.x, botTip.y);
  ctx.lineTo(topTip.x, topTip.y);
  ctx.lineTo(topLeft.x, topLeft.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right illuminated cheek plate (slope = -0.5)
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(botTip.x, botTip.y);
  ctx.lineTo(botRight.x, botRight.y);
  ctx.lineTo(topRight.x, topRight.y);
  ctx.lineTo(topTip.x, topTip.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Scoop dark interior intake throat
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.moveTo(topLeft.x, topLeft.y);
  ctx.lineTo(topTip.x, topTip.y);
  ctx.lineTo(topRight.x, topRight.y);
  ctx.lineTo(botRight.x, botRight.y - sDepth * 0.35);
  ctx.lineTo(botTip.x, botTip.y - sDepth * 0.35);
  ctx.lineTo(botLeft.x, botLeft.y - sDepth * 0.35);
  ctx.closePath();
  ctx.fill();

  // Sharp silver tungsten-carbide cutting edge lip along the ground
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(botLeft.x, botLeft.y);
  ctx.lineTo(botTip.x, botTip.y);
  ctx.lineTo(botRight.x, botRight.y);
  ctx.stroke();

  // Segmented cutting teeth markers along the blade
  ctx.fillStyle = '#f8fafc';
  const teethFractions = [0.25, 0.5, 0.75];
  for (const tf of teethFractions) {
    // Left side teeth
    const lx = botLeft.x * (1 - tf) + botTip.x * tf;
    const ly = botLeft.y * (1 - tf) + botTip.y * tf;
    ctx.fillRect(lx - 1, ly - 1, 2, 2);

    // Right side teeth
    const rx = botTip.x * (1 - tf) + botRight.x * tf;
    const ry = botTip.y * (1 - tf) + botRight.y * tf;
    ctx.fillRect(rx - 1, ry - 1, 2, 2);
  }

  // Heavy hydraulic push-rods
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.72, deckY + 1);
  ctx.lineTo(botLeft.x + sw * 0.35, botLeft.y + sh * 0.35 - sDepth * 0.5);
  ctx.moveTo(cx + w * 0.72, deckY + 1);
  ctx.lineTo(botRight.x - sw * 0.35, botRight.y + sh * 0.35 - sDepth * 0.5);
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
    case 'extractor':
      drawExtractor(ctx, vertices.center, halfW, halfH);
      break;
  }

  ctx.restore();
}
