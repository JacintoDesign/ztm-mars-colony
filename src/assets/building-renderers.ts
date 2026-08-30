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

    // PV cell grid dividing lines
    ctx.strokeStyle = isPowered ? '#0284c7' : '#1e293b';
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

  // Central power indicator dot
  ctx.fillStyle = isPowered ? '#0284c7' : '#334155';
  ctx.beginPath();
  ctx.arc(cx, hubY, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws the Scrubber: detailed architectural industrial atmospheric filtration tower.
 * Features a heavy reinforced base plinth, clean faceted lower intake block with panel seams,
 * tall vertical column with heatsink ribs and cyan oxygen conduit line, and a cylindrical
 * top exhaust stack with cyan status aperture and faint vent plume when producing oxygen.
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

  // 2. Clean, solid lower intake block (faceted industrial panels)
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

  // 4. Top exhaust chimney and aperture
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

  // 5. Vent Plume effect per DESIGN.md while actively producing oxygen
  if (isProducing) {
    ctx.fillStyle = 'rgba(217, 221, 224, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, stackY - stackH - 4, stackW * 0.8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(217, 221, 224, 0.18)';
    ctx.beginPath();
    ctx.ellipse(cx, stackY - stackH - 9, stackW * 1.2, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draws the Extractor: wide and low Mars heavy industrial surface excavator.
 * A cohesive, architectural mining structure featuring a wide low-slung chassis,
 * an integrated rear power engine with glowing amber horizontal heat vents,
 * a central recessed ore crushing bay, and a massive 3D forward-sloping excavator
 * scoop with heavy side-cheeks, hydraulic push-rods, and a segmented tungsten cutting blade.
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

  // 3. Integrated Rear Generator Housing & Amber Radiator Slats
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
  // Glows amber while isProducing is true, dark gray when reserve is exhausted
  ctx.strokeStyle = isProducing ? '#f59e0b' : '#334155';
  ctx.lineWidth = isProducing ? 1.4 : 1.0;
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

  // Faint vent glow aura when actively extracting
  if (isProducing) {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.beginPath();
    ctx.ellipse(cx + genW * 0.5, genCenterY + genH * 0.5 - genHgt - 3, genW * 0.6, genH * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
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

  // Martian ore chunks in crushing bay
  ctx.fillStyle = isProducing ? '#c2410c' : '#7c2d12';
  ctx.beginPath();
  ctx.moveTo(cx - bayW * 0.6, bayY);
  ctx.lineTo(cx, bayY - bayH * 0.5);
  ctx.lineTo(cx + bayW * 0.6, bayY);
  ctx.lineTo(cx, bayY + bayH * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = isProducing ? '#ea580c' : '#9a3412';
  ctx.fillRect(cx - 3, bayY - 2, 6, 4);
  if (isProducing) {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(cx - 1, bayY - 1, 2, 2);
  }

  // 5. Bold 3D Forward-Sloping Heavy Excavator Scoop
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
