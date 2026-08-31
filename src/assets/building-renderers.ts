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
 * Shows grey hair aging cue when age >= 0.75 * lifespan per DESIGN.md.
 */
export function drawColonist(
  ctx: CanvasRenderingContext2D,
  center: ScreenPoint,
  health: number,
  age = 0,
  lifespan = 15000
): void {
  const cx = center.x;
  const cy = center.y + 2;
  const healthFraction = Math.max(0, Math.min(1, health / 100));
  const isAged = age >= lifespan * 0.75;

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

  // Helmet / Head
  const helmetY = cy - standH;
  ctx.fillStyle = isAged ? '#94a3b8' : '#f8fafc'; // Greyed tone for aged colonists
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx + leanX, helmetY, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Helmet visor (Cyan at full health, Amber/Red when low health)
  ctx.fillStyle = healthFraction > 0.4 ? '#38bdf8' : healthFraction > 0.15 ? '#E0A030' : '#D94F3D';
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
 * Draws the Hydroponic Farm: broad and flat, grid-like surface pattern.
 * Faint green glow when active / producing food.
 */
export function drawFarm(
  ctx: CanvasRenderingContext2D,
  center: ScreenPoint,
  halfW: number,
  halfH: number,
  isProducing: boolean
): void {
  const cx = center.x;
  const cy = center.y;
  const w = halfW * 0.85;
  const h = halfH * 0.85;
  const wallH = 8;

  // 1. Foundation slab
  ctx.fillStyle = '#22150c';
  ctx.strokeStyle = '#110a05';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h - wallH);
  ctx.lineTo(cx + w, cy - wallH);
  ctx.lineTo(cx, cy + h - wallH);
  ctx.lineTo(cx - w, cy - wallH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Foundation drop walls
  ctx.fillStyle = '#170c07';
  ctx.beginPath();
  ctx.moveTo(cx - w, cy - wallH);
  ctx.lineTo(cx, cy + h - wallH);
  ctx.lineTo(cx, cy + h);
  ctx.lineTo(cx - w, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#110804';
  ctx.beginPath();
  ctx.moveTo(cx, cy + h - wallH);
  ctx.lineTo(cx + w, cy - wallH);
  ctx.lineTo(cx + w, cy);
  ctx.lineTo(cx, cy + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Hydroponic Greenhouse Glass Paneling & Bed Grid
  const bedColor = isProducing ? '#15803d' : '#1e293b';
  const gridLineColor = isProducing ? '#4ade80' : '#475569';

  ctx.fillStyle = bedColor;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h - wallH + 2);
  ctx.lineTo(cx + w - 4, cy - wallH);
  ctx.lineTo(cx, cy + h - wallH - 2);
  ctx.lineTo(cx - w + 4, cy - wallH);
  ctx.closePath();
  ctx.fill();

  // Glass Grid Lines
  ctx.strokeStyle = gridLineColor;
  ctx.lineWidth = 1;
  const gridSteps = 4;
  for (let i = 1; i < gridSteps; i++) {
    const frac = i / gridSteps;
    // Left-to-right grid line
    const x1 = cx * (1 - frac) + (cx - w + 4) * frac;
    const y1 = (cy - h - wallH + 2) * (1 - frac) + (cy - wallH) * frac;
    const x2 = (cx + w - 4) * (1 - frac) + cx * frac;
    const y2 = (cy - wallH) * (1 - frac) + (cy + h - wallH - 2) * frac;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Active nutrient mist glow
  if (isProducing) {
    ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - h - wallH);
    ctx.lineTo(cx + w, cy - wallH);
    ctx.lineTo(cx, cy + h - wallH);
    ctx.lineTo(cx - w, cy - wallH);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Draws the Rover Garage: boxy and squared-off with straightened isometric geometry.
 * Features twin roof beacon indicators displaying docked rover occupancy at a glance (0, 1, or 2).
 */
export function drawGarage(
  ctx: CanvasRenderingContext2D,
  center: ScreenPoint,
  halfW: number,
  halfH: number,
  isPowered: boolean,
  dockedRovers: number = 2
): void {
  const cx = center.x;
  const cy = center.y;
  const w = halfW * 0.85;
  const h = halfH * 0.65;
  const height = Math.max(18, Math.round(halfH * 1.15));

  // 1. Concrete Ground Foundation Pad
  ctx.fillStyle = '#1e0e07';
  ctx.strokeStyle = '#100603';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h - 2);
  ctx.lineTo(cx + w + 3, cy);
  ctx.lineTo(cx, cy + h + 2);
  ctx.lineTo(cx - w - 3, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Straightened Isometric Garage Body Walls
  // Left Wall
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - w, cy);
  ctx.lineTo(cx, cy + h);
  ctx.lineTo(cx, cy + h - height);
  ctx.lineTo(cx - w, cy - height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Wall (Hangar Bay Entry Face)
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(cx, cy + h);
  ctx.lineTo(cx + w, cy);
  ctx.lineTo(cx + w, cy - height);
  ctx.lineTo(cx, cy + h - height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Top Roof Deck
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(cx, cy - h - height);
  ctx.lineTo(cx + w, cy - height);
  ctx.lineTo(cx, cy + h - height);
  ctx.lineTo(cx - w, cy - height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4. Large Hangar Bay Entryway with Roll-up Door & Hazard Stripes
  const t0 = 0.18;
  const t1 = 0.82;
  const doorX0 = cx + t0 * w;
  const doorX1 = cx + t1 * w;
  const doorY0Bottom = cy + (1 - t0) * h - 2;
  const doorY1Bottom = cy + (1 - t1) * h - 2;
  const doorY0Top = cy - height + (1 - t0) * h + 5;
  const doorY1Top = cy - height + (1 - t1) * h + 5;

  ctx.fillStyle = '#090d16';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(doorX0, doorY0Bottom);
  ctx.lineTo(doorX1, doorY1Bottom);
  ctx.lineTo(doorX1, doorY1Top);
  ctx.lineTo(doorX0, doorY0Top);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Yellow Hazard Door Header (Strictly parallel to the roofline and door frame)
  ctx.strokeStyle = '#E0A030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(doorX0, doorY0Top);
  ctx.lineTo(doorX1, doorY1Top);
  ctx.stroke();

  // Subtle roll-up door horizontal slat grooves (parallel along vector (+w, -h))
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
  ctx.lineWidth = 0.8;
  for (const fraction of [0.33, 0.66]) {
    ctx.beginPath();
    ctx.moveTo(doorX0, doorY0Top + (doorY0Bottom - doorY0Top) * fraction);
    ctx.lineTo(doorX1, doorY1Top + (doorY1Bottom - doorY1Top) * fraction);
    ctx.stroke();
  }

  // 5. Twin Roof Occupancy Indicator Beacons (Docked Rover Status at a Glance)
  // Left Bay Beacon
  const leftBeaconColor = dockedRovers >= 1 && isPowered ? '#38bdf8' : '#1e293b';
  ctx.fillStyle = leftBeaconColor;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(cx - 8, cy - height - 8, 5, 5);
  ctx.fill();
  ctx.stroke();

  // Right Bay Beacon
  const rightBeaconColor = dockedRovers >= 2 && isPowered ? '#38bdf8' : '#1e293b';
  ctx.fillStyle = rightBeaconColor;
  ctx.beginPath();
  ctx.rect(cx + 3, cy - height - 8, 5, 5);
  ctx.fill();
  ctx.stroke();

  // Roof antennae
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - height - 8);
  ctx.lineTo(cx - 5, cy - height - 16);
  ctx.moveTo(cx + 6, cy - height - 8);
  ctx.lineTo(cx + 6, cy - height - 16);
  ctx.stroke();
}

/**
 * Draws the Refinery: a clean, heavy industrial mineral and power processing facility.
 * Sits flush on the terrain with solid isometric steel framing, central smelting furnace aperture,
 * dual top exhaust ventilation stacks, and active plasma power status indicators.
 */
export function drawRefinery(
  ctx: CanvasRenderingContext2D,
  center: ScreenPoint,
  halfW: number,
  halfH: number,
  isPowered: boolean
): void {
  const cx = center.x;
  const cy = center.y;
  const w = halfW * 0.82;
  const h = halfH * 0.65;
  const height = Math.max(18, Math.round(halfH * 1.15));

  ctx.save();

  // 1. Steel Composite Ground Foundation Frame (Flush with terrain, zero dirt slab)
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h - 2);
  ctx.lineTo(cx + w + 3, cy);
  ctx.lineTo(cx, cy + h + 2);
  ctx.lineTo(cx - w - 3, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Main Isometric Industrial Block
  // Left Wall (Shadowed)
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - w, cy);
  ctx.lineTo(cx, cy + h);
  ctx.lineTo(cx, cy + h - height);
  ctx.lineTo(cx - w, cy - height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Wall (Illuminated)
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(cx, cy + h);
  ctx.lineTo(cx + w, cy);
  ctx.lineTo(cx + w, cy - height);
  ctx.lineTo(cx, cy + h - height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Top Roof Deck
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h - height);
  ctx.lineTo(cx + w, cy - height);
  ctx.lineTo(cx, cy + h - height);
  ctx.lineTo(cx - w, cy - height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Central Molten Smelting Hearth (on Left Wall, facing down-left)
  const tL0 = 0.2;
  const tL1 = 0.8;
  const hearthX0 = cx - w * (1 - tL0);
  const hearthX1 = cx - w * (1 - tL1);
  const hearthY0Bot = cy + tL0 * h - 3;
  const hearthY1Bot = cy + tL1 * h - 3;
  const hearthY0Top = cy - height + tL0 * h + 5;
  const hearthY1Top = cy - height + tL1 * h + 5;

  ctx.fillStyle = isPowered ? '#ea580c' : '#090d16';
  ctx.strokeStyle = isPowered ? '#fbbf24' : '#1e293b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hearthX0, hearthY0Bot);
  ctx.lineTo(hearthX1, hearthY1Bot);
  ctx.lineTo(hearthX1, hearthY1Top);
  ctx.lineTo(hearthX0, hearthY0Top);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner molten core glow
  if (isPowered) {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(hearthX0 + 1.5, hearthY0Bot - 1.5);
    ctx.lineTo(hearthX1 - 1.5, hearthY1Bot - 1.5);
    ctx.lineTo(hearthX1 - 1.5, hearthY1Top + 1.5);
    ctx.lineTo(hearthX0 + 1.5, hearthY0Top + 1.5);
    ctx.closePath();
    ctx.fill();
  }

  // 4. Dual Vertical Cylindrical Exhaust Vents (on Roof Deck)
  const ventRadius = 4.5;
  const ventHeight = 16;
  const vents = [
    { x: cx - 6, y: cy - height - 4 },
    { x: cx + 7, y: cy - height + 2 },
  ];

  for (const v of vents) {
    // Vent cylinder body
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(v.x - ventRadius, v.y - ventHeight, ventRadius * 2, ventHeight);
    ctx.fill();
    ctx.stroke();

    // Top exhaust ring rim
    ctx.fillStyle = isPowered ? '#38bdf8' : '#334155';
    ctx.strokeStyle = isPowered ? '#0284c7' : '#1e293b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(v.x, v.y - ventHeight, ventRadius, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dark vent aperture center
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(v.x, v.y - ventHeight, ventRadius * 0.55, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Active exhaust heat plume
    if (isPowered) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.ellipse(v.x, v.y - ventHeight - 3, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 5. Gold Material Transfer Conduit Pipe along right wall
  const tR0 = 0.2;
  const tR1 = 0.8;
  const pX0 = cx + tR0 * w;
  const pX1 = cx + tR1 * w;
  const pY0 = cy - height + (1 - tR0) * h + 8;
  const pY1 = cy - height + (1 - tR1) * h + 8;

  ctx.strokeStyle = '#E0A030';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(pX0, pY0);
  ctx.lineTo(pX1, pY1);
  ctx.stroke();

  // 6. Battery Power Status LED on Right Wall
  ctx.fillStyle = isPowered ? '#38bdf8' : '#475569';
  ctx.beginPath();
  ctx.arc(cx + w * 0.5, cy + h * 0.5 - 4, 1.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws the simplified permanent Landing Pad circle on tile (0, 0).
 */
export function drawLandingPad(
  ctx: CanvasRenderingContext2D,
  center: ScreenPoint,
  halfW: number,
  halfH: number
): void {
  const cx = center.x;
  const cy = center.y;

  ctx.save();
  ctx.strokeStyle = '#7fd4e0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, halfW * 0.45, halfH * 0.45, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a 4-wheeled car/buggy rover in true isometric perspective:
 * Chassis and cockpit face forward-right along the grid axis, with clean circular wheels,
 * a full-width windshield visor aligned with the front bumper and headlights,
 * and dual bucket seats rendering 0, 1 (driver), or 2 (driver + passenger) seated colonists
 * facing forward through the windshield with gold reflective visors.
 */
export function drawRover(
  ctx: CanvasRenderingContext2D,
  center: ScreenPoint,
  power: number,
  occupants: number = 1
): void {
  const cx = center.x;
  const cy = center.y;

  ctx.save();

  // 1. Ground contact shadow (isometric alignment under chassis)
  ctx.fillStyle = 'rgba(10, 5, 2, 0.6)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 18, 9, 0.46, 0, Math.PI * 2);
  ctx.fill();

  // 2. Far-Side Circular Wheels (Rear-Right and Front-Right - drawn behind chassis)
  const farWheels = [
    { x: -8, y: -8.5 }, // Rear-Right
    { x: 8, y: -0.5 },  // Front-Right
  ];

  for (const w of farWheels) {
    const wx = cx + w.x;
    const wy = cy + w.y;

    // Dark rubber tire (perfect circle)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(wx, wy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wheel rim
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(wx, wy, 2.1, 0, Math.PI * 2);
    ctx.fill();

    // Metallic hubcap
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(wx, wy, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Isometric Buggy Chassis & Body Frame (Facing Down-Right)
  // Longitudinal forward axis: (+12, +6), Transverse axis: (+8, -4), Height: 5px
  // Bottom chassis corners:
  //   Rear-Left:   (cx - 20, cy - 2)
  //   Front-Left:  (cx + 4, cy + 10)
  //   Front-Right: (cx + 20, cy + 2)
  //   Rear-Right:  (cx - 4, cy - 10)
  // Top chassis corners (raised by 5px):
  //   Top Rear-Left:   (cx - 20, cy - 7)
  //   Top Front-Left:  (cx + 4, cy + 5)
  //   Top Front-Right: (cx + 20, cy - 3)
  //   Top Rear-Right:  (cx - 4, cy - 15)

  // Left Chassis Flank
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy - 2);
  ctx.lineTo(cx + 4, cy + 10);
  ctx.lineTo(cx + 4, cy + 5);
  ctx.lineTo(cx - 20, cy - 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Front Bumper Face (Facing Down-Right)
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy + 10);
  ctx.lineTo(cx + 20, cy + 2);
  ctx.lineTo(cx + 20, cy - 3);
  ctx.lineTo(cx + 4, cy + 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hood & Interior Floor Deck
  ctx.fillStyle = '#64748b';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy - 7);
  ctx.lineTo(cx + 4, cy + 5);
  ctx.lineTo(cx + 20, cy - 3);
  ctx.lineTo(cx - 4, cy - 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4. Front Headlights (Centered & Symmetrically spaced on the front bumper)
  // Left Headlight at 25% across bumper: (cx + 8, cy + 6.5)
  // Right Headlight at 75% across bumper: (cx + 16, cy + 2.5)
  const headlights = [
    { x: 8, y: 6.5 },
    { x: 16, y: 2.5 },
  ];

  for (const hl of headlights) {
    const hx = cx + hl.x;
    const hy = cy + hl.y;

    // Outer housing bezel
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(hx, hy, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Bright illuminated lens
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(hx, hy, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 5. Near-Side Circular Wheels (Rear-Left and Front-Left - drawn in front of chassis)
  const nearWheels = [
    { x: -15, y: -0.5 }, // Rear-Left
    { x: 1, y: 7.5 },    // Front-Left
  ];

  for (const w of nearWheels) {
    const wx = cx + w.x;
    const wy = cy + w.y;

    // Dark rubber tire (perfect circle)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(wx, wy, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wheel rim
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(wx, wy, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Metallic hubcap
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(wx, wy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Dual Cockpit Bucket Seats & Seated Astronauts
  // Driver Seat (Left) at (cx - 2, cy - 2)
  // Passenger Seat (Right) at (cx + 6, cy - 6)
  const seats = [
    { x: cx - 2, y: cy - 2 }, // Driver (Left)
    { x: cx + 6, y: cy - 6 }, // Passenger (Right)
  ];

  for (let i = 0; i < 2; i++) {
    const s = seats[i];
    const isOccupied = occupants > i;

    // Seat backrest (angled transversely parallel to bumper)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x - 3, s.y + 1.5);
    ctx.lineTo(s.x + 3, s.y - 1.5);
    ctx.lineTo(s.x + 3, s.y - 7.5);
    ctx.lineTo(s.x - 3, s.y - 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (isOccupied) {
      // Seated Astronaut facing Forward-Right (Down-Right)
      // Torso & arms reaching forward
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x - 2, s.y - 1);
      ctx.lineTo(s.x + 3, s.y + 1.5);
      ctx.lineTo(s.x + 3, s.y - 4.5);
      ctx.lineTo(s.x - 2, s.y - 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Red chest mission badge
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(s.x + 1, s.y - 3.5, 1.8, 1.8);

      // White Helmet (facing forward-right)
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(s.x, s.y - 8.5, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Gold reflective helmet visor (pointing forward-right towards the windshield)
      ctx.fillStyle = '#eab308';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(s.x + 1.2, s.y - 8.5, 1.8, 2.2, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Visor white reflection gleam
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x + 1.4, s.y - 9.5, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 7. Full-Width Aligned Windshield Visor (Spans across entire front cockpit parallel to front bumper)
  // Base line (on hood deck, set back from bumper): (cx + 1, cy + 3.5) to (cx + 17, cy - 4.5)
  // Top line (angled up & rearward): (cx - 1, cy - 5.5) to (cx + 15, cy - 13.5)
  ctx.fillStyle = 'rgba(125, 211, 252, 0.65)';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx + 1, cy + 3.5);
  ctx.lineTo(cx + 17, cy - 4.5);
  ctx.lineTo(cx + 15, cy - 13.5);
  ctx.lineTo(cx - 1, cy - 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Windshield glass specular reflection streaks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 3, cy - 1);
  ctx.lineTo(cx + 5, cy - 9);
  ctx.moveTo(cx + 9, cy - 4);
  ctx.lineTo(cx + 11, cy - 12);
  ctx.stroke();

  // 8. Rear Antenna Mast & Battery LED Indicator
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 11, cy - 9);
  ctx.lineTo(cx - 11, cy - 18);
  ctx.stroke();

  // Battery status LED
  const ledColor = power > 25 ? '#38bdf8' : (power > 0 ? '#E0A030' : '#D94F3D');
  ctx.fillStyle = ledColor;
  ctx.beginPath();
  ctx.arc(cx - 11, cy - 19, 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws the rounded cone Moon/Mars Lander Capsule (at Landing Zone 0,0):
 * A smooth aerodynamic rounded cone (Apollo/Dragon capsule style) with
 * a blunted rounded dome nosecone, curved hull profile, porthole window,
 * heat shield base, small lander legs, and countdown badge.
 */
export function drawLandingCapsule(
  ctx: CanvasRenderingContext2D,
  center: ScreenPoint,
  halfW: number,
  halfH: number,
  ticksRemaining: number
): void {
  const cx = center.x;
  const cy = center.y;
  const isUrgent = ticksRemaining <= 30;

  ctx.save();

  // 1. Landing Legs (4 angled struts with circular footpads)
  const legOffsets = [
    { x: -halfW * 0.35, y: -halfH * 0.25 },
    { x: halfW * 0.35, y: -halfH * 0.25 },
    { x: -halfW * 0.25, y: halfH * 0.35 },
    { x: halfW * 0.25, y: halfH * 0.35 },
  ];

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  for (const leg of legOffsets) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx + leg.x, cy + leg.y);
    ctx.stroke();

    // Circular footpad
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx + leg.x, cy + leg.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 2. Heat Shield Base Rim (Elliptical bottom)
  const baseY = cy - 3;
  const baseRx = 11;
  const baseRy = 5;

  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, baseRx + 1, baseRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. Rounded Aerodynamic Cone Capsule Body
  // Top apex at cy - 24 with rounded dome nosecone
  const apexY = cy - 24;
  const domeRadius = 2.8;

  // Main Capsule Body Path with Smooth Curved Sides and Rounded Dome Apex
  ctx.beginPath();
  // Start from bottom-left heat shield edge
  ctx.moveTo(cx - baseRx, baseY);
  // Curve up along the left hull to the left of the rounded dome nose
  ctx.quadraticCurveTo(cx - baseRx * 0.75, cy - 13, cx - domeRadius, apexY + 1.5);
  // Rounded Dome Nosecone Arc
  ctx.arc(cx, apexY + 1.5, domeRadius, Math.PI, 0, false);
  // Curve down along the right hull to the bottom-right heat shield edge
  ctx.quadraticCurveTo(cx + baseRx * 0.75, cy - 13, cx + baseRx, baseY);
  // Close along the bottom heat shield curve
  ctx.ellipse(cx, baseY, baseRx, baseRy * 0.6, 0, 0, Math.PI, false);
  ctx.closePath();

  // Smooth thermal tile white finish
  ctx.fillStyle = '#f1f5f9';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 4. Volumetric Curved Shading (Right half of the rounded cone)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - baseRx, baseY);
  ctx.quadraticCurveTo(cx - baseRx * 0.75, cy - 13, cx - domeRadius, apexY + 1.5);
  ctx.arc(cx, apexY + 1.5, domeRadius, Math.PI, 0, false);
  ctx.quadraticCurveTo(cx + baseRx * 0.75, cy - 13, cx + baseRx, baseY);
  ctx.ellipse(cx, baseY, baseRx, baseRy * 0.6, 0, 0, Math.PI, false);
  ctx.closePath();
  ctx.clip();

  // Shaded right hemisphere
  ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.beginPath();
  ctx.moveTo(cx, apexY);
  ctx.lineTo(cx + baseRx + 2, apexY);
  ctx.lineTo(cx + baseRx + 2, baseY + 6);
  ctx.lineTo(cx, baseY + 6);
  ctx.closePath();
  ctx.fill();

  // Curved thermal panel seams
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 10, baseRx * 0.65, 2.5, 0, 0, Math.PI * 2);
  ctx.ellipse(cx, cy - 17, baseRx * 0.4, 1.8, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 5. Circular Central Porthole Window
  const portX = cx;
  const portY = cy - 12;
  const portR = 2.6;

  // Bezel ring
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(portX, portY, portR + 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cyan Glass
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(portX, portY, portR, 0, Math.PI * 2);
  ctx.fill();

  // Glass reflection glint
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(portX - 0.8, portY - 0.8, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // 6. Clean Countdown Badge Overhead
  const badgeColor = isUrgent ? '#E0A030' : '#d9dde0';
  ctx.fillStyle = 'rgba(26, 14, 8, 0.85)';
  ctx.strokeStyle = badgeColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(cx - 28, apexY - 15, 56, 11);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = badgeColor;
  ctx.font = 'bold 8px Chakra Petch, monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`ESCORT: ${ticksRemaining}s`, cx, apexY - 9);

  ctx.restore();
}

/**
 * Draws an active Asteroid: a volumetric, multi-faceted 3D cratered meteorite
 * with crater rims, faceted planar shading, and glowing mineral veins.
 */
export function drawAsteroid(ctx: CanvasRenderingContext2D, center: ScreenPoint, halfW: number, halfH: number): void {
  const cx = center.x;
  const cy = center.y;

  ctx.save();
  // 1. Impact scorch mark
  ctx.fillStyle = 'rgba(26, 14, 8, 0.85)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, halfW * 0.75, halfH * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Multi-Faceted 3D Meteorite Body
  // Base shadow facet
  ctx.fillStyle = '#1c130c';
  ctx.strokeStyle = '#0a0604';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy);
  ctx.lineTo(cx - 4, cy + 8);
  ctx.lineTo(cx + 12, cy + 4);
  ctx.lineTo(cx + 14, cy - 8);
  ctx.lineTo(cx + 2, cy - 20);
  ctx.lineTo(cx - 12, cy - 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Illuminated top facet
  ctx.fillStyle = '#3e2c1e';
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 14);
  ctx.lineTo(cx + 2, cy - 20);
  ctx.lineTo(cx + 6, cy - 6);
  ctx.lineTo(cx - 4, cy - 3);
  ctx.closePath();
  ctx.fill();

  // Front facet
  ctx.fillStyle = '#2d1f15';
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 3);
  ctx.lineTo(cx + 6, cy - 6);
  ctx.lineTo(cx + 12, cy + 4);
  ctx.lineTo(cx - 4, cy + 8);
  ctx.closePath();
  ctx.fill();

  // 3. Impact Craters with Depressions
  // Crater 1
  ctx.fillStyle = '#120b06';
  ctx.strokeStyle = '#4e3826';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy - 8, 3.5, 2.2, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Crater 2
  ctx.beginPath();
  ctx.ellipse(cx + 5, cy + 1, 2.8, 1.8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws building condition overlay (broken fault indicator or buried sand mound).
 */
export function drawBuildingConditionOverlay(
  ctx: CanvasRenderingContext2D,
  center: ScreenPoint,
  halfW: number,
  halfH: number,
  condition: 'operational' | 'broken' | 'buried'
): void {
  const cx = center.x;
  const cy = center.y;

  if (condition === 'broken') {
    // Fault indicator: yellow/amber warning hazard marker
    ctx.save();
    ctx.fillStyle = '#E0A030';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 24);
    ctx.lineTo(cx + 6, cy - 14);
    ctx.lineTo(cx - 6, cy - 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 8px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', cx, cy - 17);
    ctx.restore();
  } else if (condition === 'buried') {
    // Buried sand mound overlay matching Martian terrain
    ctx.save();
    ctx.fillStyle = 'rgba(108, 53, 28, 0.85)';
    ctx.strokeStyle = '#4a2110';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 4, halfW * 0.85, halfH * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d9dde0';
    ctx.font = 'bold 7px Chakra Petch, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BURIED', cx, cy - 4);
    ctx.restore();
  }
}

/**
 * Main procedural dispatcher to draw any building type.
 */
export interface DrawBuildingOptions {
  type: BuildingType;
  x: number;
  y: number;
  config: IsoConfig;
  isPreview?: boolean;
  isPowered?: boolean;
  isProducing?: boolean;
  dockedRovers?: number;
}

export function drawBuilding(ctx: CanvasRenderingContext2D, options: DrawBuildingOptions): void {
  const { type, x, y, config, isPreview, isPowered = true, isProducing = true, dockedRovers = 2 } = options;
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
    case 'farm':
      drawFarm(ctx, vertices.center, halfW, halfH, isProducing);
      break;
    case 'garage':
      drawGarage(ctx, vertices.center, halfW, halfH, isPowered, dockedRovers);
      break;
    case 'refinery':
      drawRefinery(ctx, vertices.center, halfW, halfH, isPowered);
      break;
  }

  ctx.restore();
}
