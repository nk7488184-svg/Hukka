// ============================================================
// Hookah Renderer — Canvas 2D
// All drawing functions for the hookah apparatus
// ============================================================

import { Vec2, cubicBezier } from './physics';

// Hookah dimensions relative to canvas size
export interface HookahLayout {
  centerX: number;
  centerY: number;
  scale: number;
  // Key positions
  baseCenter: Vec2;
  baseTop: Vec2;
  baseBottom: Vec2;
  stemTop: Vec2;
  bowlCenter: Vec2;
  hosePort: Vec2; // Where hose connects to the stem
  waterLevel: number; // Y coordinate of water surface
  baseWidth: number;
  baseHeight: number;
}

export function calculateLayout(canvasWidth: number, canvasHeight: number): HookahLayout {
  const scale = Math.min(canvasWidth / 1400, canvasHeight / 900);
  const centerX = canvasWidth * 0.32;
  const centerY = canvasHeight * 0.55;
  
  const baseWidth = 140 * scale;
  const baseHeight = 160 * scale;
  
  return {
    centerX,
    centerY,
    scale,
    baseCenter: { x: centerX, y: centerY + 80 * scale },
    baseTop: { x: centerX, y: centerY + 10 * scale },
    baseBottom: { x: centerX, y: centerY + 160 * scale },
    stemTop: { x: centerX, y: centerY - 180 * scale },
    bowlCenter: { x: centerX, y: centerY - 200 * scale },
    hosePort: { x: centerX + 30 * scale, y: centerY - 40 * scale },
    waterLevel: centerY + 60 * scale,
    baseWidth,
    baseHeight,
  };
}

/**
 * Render the complete hookah
 */
export function renderHookah(
  ctx: CanvasRenderingContext2D,
  layout: HookahLayout,
  hoseEndPos: Vec2,
  hoseGlow: number,
  time: number,
  burnIntensity: number = 0
) {
  ctx.save();
  
  // Draw order: base (back) → water → stem → bowl → hose → coal glow
  drawBase(ctx, layout, time);
  drawWater(ctx, layout, time);
  drawStem(ctx, layout);
  drawBowl(ctx, layout, time);
  drawHose(ctx, layout, hoseEndPos, hoseGlow);
  drawCoalGlow(ctx, layout, time, burnIntensity);
  
  ctx.restore();
}

/**
 * Draw the glass base / water chamber
 */
function drawBase(ctx: CanvasRenderingContext2D, layout: HookahLayout, time: number) {
  const { baseCenter, scale } = layout;
  const w = 140 * scale;
  const h = 150 * scale;
  
  ctx.save();
  
  // Outer glass shape - rounded vase
  ctx.beginPath();
  // Use bezier curves for a vase/bulb shape
  const topY = baseCenter.y - h * 0.45;
  const botY = baseCenter.y + h * 0.5;
  const midY = baseCenter.y + h * 0.1;
  const neckW = w * 0.25;
  const bulgeW = w * 0.55;
  const bottomW = w * 0.35;
  
  // Start at top-left of neck
  ctx.moveTo(baseCenter.x - neckW, topY);
  
  // Left side: neck → bulge → bottom
  ctx.bezierCurveTo(
    baseCenter.x - neckW, topY + h * 0.15,
    baseCenter.x - bulgeW, midY - h * 0.15,
    baseCenter.x - bulgeW, midY
  );
  ctx.bezierCurveTo(
    baseCenter.x - bulgeW, midY + h * 0.2,
    baseCenter.x - bottomW, botY - h * 0.1,
    baseCenter.x - bottomW, botY
  );
  
  // Bottom curve
  ctx.quadraticCurveTo(
    baseCenter.x, botY + h * 0.08,
    baseCenter.x + bottomW, botY
  );
  
  // Right side: bottom → bulge → neck (mirror)
  ctx.bezierCurveTo(
    baseCenter.x + bottomW, botY - h * 0.1,
    baseCenter.x + bulgeW, midY + h * 0.2,
    baseCenter.x + bulgeW, midY
  );
  ctx.bezierCurveTo(
    baseCenter.x + bulgeW, midY - h * 0.15,
    baseCenter.x + neckW, topY + h * 0.15,
    baseCenter.x + neckW, topY
  );
  
  ctx.closePath();
  
  // Glass gradient fill
  const glassGrad = ctx.createLinearGradient(
    baseCenter.x - bulgeW, topY,
    baseCenter.x + bulgeW, botY
  );
  glassGrad.addColorStop(0, 'rgba(100, 140, 180, 0.15)');
  glassGrad.addColorStop(0.3, 'rgba(80, 120, 170, 0.25)');
  glassGrad.addColorStop(0.6, 'rgba(60, 100, 150, 0.2)');
  glassGrad.addColorStop(1, 'rgba(40, 80, 130, 0.3)');
  
  ctx.fillStyle = glassGrad;
  ctx.fill();
  
  // Glass outline
  ctx.strokeStyle = 'rgba(150, 200, 255, 0.3)';
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();
  
  // Glass reflection/highlight (left side)
  ctx.beginPath();
  ctx.ellipse(
    baseCenter.x - bulgeW * 0.5,
    midY - h * 0.05,
    4 * scale,
    h * 0.25,
    -0.15,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = 'rgba(180, 220, 255, 0.12)';
  ctx.fill();
  
  ctx.restore();
}

/**
 * Draw the water inside the base
 */
function drawWater(ctx: CanvasRenderingContext2D, layout: HookahLayout, time: number) {
  const { baseCenter, waterLevel, scale } = layout;
  const w = 140 * scale;
  const h = 150 * scale;
  const botY = baseCenter.y + h * 0.5;
  const bulgeW = w * 0.55;
  const bottomW = w * 0.35;
  
  ctx.save();
  
  // Clip to base shape but only below water level
  ctx.beginPath();
  
  // Water surface with subtle wave
  const waveAmp = 2 * scale;
  const waveX1 = baseCenter.x - bulgeW * 0.9;
  const waveX2 = baseCenter.x + bulgeW * 0.9;
  
  ctx.moveTo(waveX1, waterLevel);
  for (let x = waveX1; x <= waveX2; x += 2) {
    const wave = Math.sin((x * 0.02) + time * 0.003) * waveAmp;
    ctx.lineTo(x, waterLevel + wave);
  }
  
  // Continue down the right side of the base
  const midY = baseCenter.y + h * 0.1;
  ctx.bezierCurveTo(
    baseCenter.x + bulgeW, midY + h * 0.2,
    baseCenter.x + bottomW, botY - h * 0.1,
    baseCenter.x + bottomW, botY
  );
  
  // Bottom
  ctx.quadraticCurveTo(
    baseCenter.x, botY + h * 0.08,
    baseCenter.x - bottomW, botY
  );
  
  // Left side back up to water level
  ctx.bezierCurveTo(
    baseCenter.x - bottomW, botY - h * 0.1,
    baseCenter.x - bulgeW, midY + h * 0.2,
    waveX1, waterLevel
  );
  
  ctx.closePath();
  
  // Water gradient
  const waterGrad = ctx.createLinearGradient(
    baseCenter.x, waterLevel,
    baseCenter.x, botY
  );
  waterGrad.addColorStop(0, 'rgba(50, 120, 200, 0.25)');
  waterGrad.addColorStop(0.5, 'rgba(30, 80, 160, 0.35)');
  waterGrad.addColorStop(1, 'rgba(20, 60, 140, 0.45)');
  
  ctx.fillStyle = waterGrad;
  ctx.fill();
  
  ctx.restore();
}

/**
 * Draw the stem (metal tube from base to bowl)
 */
function drawStem(ctx: CanvasRenderingContext2D, layout: HookahLayout) {
  const { baseCenter, stemTop, hosePort, scale } = layout;
  const stemWidth = 14 * scale;
  const baseTopY = baseCenter.y - layout.baseHeight * 0.45;
  
  ctx.save();
  
  // Main stem
  const stemGrad = ctx.createLinearGradient(
    layout.centerX - stemWidth, baseTopY,
    layout.centerX + stemWidth, baseTopY
  );
  stemGrad.addColorStop(0, 'rgba(120, 120, 140, 0.8)');
  stemGrad.addColorStop(0.3, 'rgba(180, 180, 200, 0.9)');
  stemGrad.addColorStop(0.5, 'rgba(220, 220, 240, 1)');
  stemGrad.addColorStop(0.7, 'rgba(180, 180, 200, 0.9)');
  stemGrad.addColorStop(1, 'rgba(120, 120, 140, 0.8)');
  
  // Draw main vertical stem
  ctx.fillStyle = stemGrad;
  ctx.beginPath();
  ctx.roundRect(
    layout.centerX - stemWidth / 2,
    stemTop.y,
    stemWidth,
    baseTopY - stemTop.y + 15 * scale,
    3 * scale
  );
  ctx.fill();
  
  // Decorative rings on stem
  const ringPositions = [0.2, 0.5, 0.8];
  for (const rp of ringPositions) {
    const ry = stemTop.y + (baseTopY - stemTop.y) * rp;
    ctx.fillStyle = 'rgba(200, 170, 100, 0.7)';
    ctx.beginPath();
    ctx.roundRect(
      layout.centerX - stemWidth * 0.7,
      ry - 3 * scale,
      stemWidth * 1.4,
      6 * scale,
      2 * scale
    );
    ctx.fill();
  }
  
  // Hose port connector (small cylinder on the side of stem)
  const portGrad = ctx.createLinearGradient(
    layout.centerX, hosePort.y - 8 * scale,
    layout.centerX + 40 * scale, hosePort.y + 8 * scale
  );
  portGrad.addColorStop(0, 'rgba(180, 180, 200, 0.9)');
  portGrad.addColorStop(1, 'rgba(140, 140, 160, 0.8)');
  
  ctx.fillStyle = portGrad;
  ctx.beginPath();
  ctx.roundRect(
    layout.centerX + stemWidth / 2 - 2 * scale,
    hosePort.y - 6 * scale,
    25 * scale,
    12 * scale,
    4 * scale
  );
  ctx.fill();
  
  ctx.restore();
}

/**
 * Draw the bowl at the top of the hookah
 */
function drawBowl(ctx: CanvasRenderingContext2D, layout: HookahLayout, time: number) {
  const { bowlCenter, scale } = layout;
  
  ctx.save();
  
  // Bowl body (clay/ceramic look)
  const bowlW = 30 * scale;
  const bowlH = 25 * scale;
  
  const bowlGrad = ctx.createRadialGradient(
    bowlCenter.x, bowlCenter.y, 0,
    bowlCenter.x, bowlCenter.y, bowlW
  );
  bowlGrad.addColorStop(0, 'rgba(180, 100, 60, 0.9)');
  bowlGrad.addColorStop(0.6, 'rgba(140, 70, 40, 0.85)');
  bowlGrad.addColorStop(1, 'rgba(100, 50, 30, 0.8)');
  
  // Bowl shape (trapezoid-ish, wider at top)
  ctx.beginPath();
  ctx.moveTo(bowlCenter.x - bowlW * 0.6, bowlCenter.y - bowlH * 0.5);
  ctx.lineTo(bowlCenter.x - bowlW, bowlCenter.y + bowlH * 0.3);
  ctx.quadraticCurveTo(
    bowlCenter.x, bowlCenter.y + bowlH * 0.6,
    bowlCenter.x + bowlW, bowlCenter.y + bowlH * 0.3
  );
  ctx.lineTo(bowlCenter.x + bowlW * 0.6, bowlCenter.y - bowlH * 0.5);
  ctx.closePath();
  
  ctx.fillStyle = bowlGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(80, 40, 20, 0.5)';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();
  
  // Bowl rim
  ctx.beginPath();
  ctx.ellipse(
    bowlCenter.x,
    bowlCenter.y - bowlH * 0.5,
    bowlW * 0.6,
    6 * scale,
    0, 0, Math.PI * 2
  );
  ctx.fillStyle = 'rgba(160, 90, 50, 0.8)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(100, 50, 25, 0.6)';
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Draw the coal glow effect on top of the bowl (intensifies brightly when user inhales)
 */
function drawCoalGlow(
  ctx: CanvasRenderingContext2D,
  layout: HookahLayout,
  time: number,
  burnIntensity: number = 0
) {
  const { bowlCenter, scale } = layout;
  
  ctx.save();
  
  // Base pulsing glow + bright flare during inhalation
  const basePulse = 0.6 + Math.sin(time * 0.002) * 0.2 + Math.sin(time * 0.005) * 0.1;
  const pulse = basePulse + burnIntensity * 1.2;
  const glowRadius = (35 + burnIntensity * 25) * scale;
  
  const glowGrad = ctx.createRadialGradient(
    bowlCenter.x, bowlCenter.y - 15 * scale, 0,
    bowlCenter.x, bowlCenter.y - 15 * scale, glowRadius
  );
  glowGrad.addColorStop(0, `rgba(255, ${120 + burnIntensity * 80}, 40, ${Math.min(0.95, 0.5 * pulse)})`);
  glowGrad.addColorStop(0.35, `rgba(255, 70, 10, ${Math.min(0.8, 0.35 * pulse)})`);
  glowGrad.addColorStop(0.7, `rgba(220, 40, 0, ${Math.min(0.5, 0.15 * pulse)})`);
  glowGrad.addColorStop(1, 'rgba(200, 30, 0, 0)');
  
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(bowlCenter.x, bowlCenter.y - 15 * scale, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Small coal pieces
  const coals = [
    { ox: -8, oy: -18, s: 6 },
    { ox: 5, oy: -20, s: 7 },
    { ox: -2, oy: -14, s: 5 },
  ];
  
  for (const coal of coals) {
    const cx = bowlCenter.x + coal.ox * scale;
    const cy = bowlCenter.y + coal.oy * scale;
    const cs = coal.s * scale * (1 + burnIntensity * 0.2);
    
    const coalGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cs);
    coalGrad.addColorStop(0, `rgba(255, ${160 + burnIntensity * 80}, 60, ${Math.min(1, 0.85 * pulse)})`);
    coalGrad.addColorStop(0.5, `rgba(230, 80, 20, ${Math.min(0.9, 0.7 * pulse)})`);
    coalGrad.addColorStop(1, `rgba(90, 25, 10, ${Math.min(0.7, 0.45 * pulse)})`);
    
    ctx.fillStyle = coalGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, cs, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Draw the hose from the hookah port to the mouthpiece position
 */
function drawHose(
  ctx: CanvasRenderingContext2D,
  layout: HookahLayout,
  endPos: Vec2,
  glowIntensity: number
) {
  const { hosePort, scale } = layout;
  const hoseWidth = 8 * scale;
  
  ctx.save();
  
  // Calculate control points for a natural-looking hose curve
  const dx = endPos.x - hosePort.x;
  const dy = endPos.y - hosePort.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Gravity droop - hose sags naturally
  const sag = Math.min(dist * 0.3, 120 * scale);
  
  const cp1: Vec2 = {
    x: hosePort.x + dx * 0.25,
    y: hosePort.y + sag,
  };
  const cp2: Vec2 = {
    x: hosePort.x + dx * 0.75,
    y: endPos.y + sag * 0.3,
  };
  
  // Glow effect when hand is near
  if (glowIntensity > 0.01) {
    ctx.shadowColor = `rgba(139, 92, 246, ${glowIntensity * 0.6})`;
    ctx.shadowBlur = 15 * scale * glowIntensity;
  }
  
  // Hose body
  const hoseGrad = ctx.createLinearGradient(
    hosePort.x, hosePort.y,
    endPos.x, endPos.y
  );
  hoseGrad.addColorStop(0, 'rgba(80, 60, 50, 0.9)');
  hoseGrad.addColorStop(0.5, 'rgba(100, 75, 60, 0.85)');
  hoseGrad.addColorStop(1, 'rgba(70, 50, 40, 0.9)');
  
  ctx.strokeStyle = hoseGrad;
  ctx.lineWidth = hoseWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(hosePort.x, hosePort.y);
  ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, endPos.x, endPos.y);
  ctx.stroke();
  
  // Hose texture lines (spiral wrap)
  ctx.strokeStyle = 'rgba(60, 40, 30, 0.3)';
  ctx.lineWidth = 1 * scale;
  const points = cubicBezier(hosePort, cp1, cp2, endPos, 40);
  for (let i = 0; i < points.length - 1; i += 3) {
    const p = points[i];
    const next = points[Math.min(i + 1, points.length - 1)];
    const angle = Math.atan2(next.y - p.y, next.x - p.x) + Math.PI / 2;
    
    ctx.beginPath();
    ctx.moveTo(
      p.x + Math.cos(angle) * hoseWidth * 0.4,
      p.y + Math.sin(angle) * hoseWidth * 0.4
    );
    ctx.lineTo(
      p.x - Math.cos(angle) * hoseWidth * 0.4,
      p.y - Math.sin(angle) * hoseWidth * 0.4
    );
    ctx.stroke();
  }
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  
  // Mouthpiece at the end
  drawMouthpiece(ctx, endPos, scale, glowIntensity);
  
  ctx.restore();
}

/**
 * Draw the mouthpiece at the end of the hose
 */
function drawMouthpiece(ctx: CanvasRenderingContext2D, pos: Vec2, scale: number, glow: number) {
  const mpWidth = 10 * scale;
  const mpHeight = 30 * scale;
  
  ctx.save();
  
  // Glow
  if (glow > 0.01) {
    ctx.shadowColor = `rgba(139, 92, 246, ${glow * 0.8})`;
    ctx.shadowBlur = 20 * glow;
  }
  
  // Metal mouthpiece body
  const mpGrad = ctx.createLinearGradient(
    pos.x - mpWidth, pos.y,
    pos.x + mpWidth, pos.y
  );
  mpGrad.addColorStop(0, 'rgba(140, 140, 160, 0.9)');
  mpGrad.addColorStop(0.3, 'rgba(200, 200, 220, 1)');
  mpGrad.addColorStop(0.5, 'rgba(230, 230, 245, 1)');
  mpGrad.addColorStop(0.7, 'rgba(200, 200, 220, 1)');
  mpGrad.addColorStop(1, 'rgba(140, 140, 160, 0.9)');
  
  ctx.fillStyle = mpGrad;
  ctx.beginPath();
  ctx.roundRect(
    pos.x - mpWidth / 2,
    pos.y - mpHeight / 2,
    mpWidth,
    mpHeight,
    4 * scale
  );
  ctx.fill();
  
  // Tip
  ctx.fillStyle = 'rgba(180, 180, 200, 0.9)';
  ctx.beginPath();
  ctx.roundRect(
    pos.x - mpWidth * 0.35,
    pos.y - mpHeight / 2 - 5 * scale,
    mpWidth * 0.7,
    8 * scale,
    3 * scale
  );
  ctx.fill();
  
  ctx.restore();
}

/**
 * Draw ambient background effects (subtle gradient, faint radial light behind hookah)
 */
export function renderBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layout: HookahLayout,
  time: number,
  mirrorMode: boolean = false
) {
  if (mirrorMode) {
    // In mirror mode: user's live camera feed is visible behind canvas.
    // We draw an atmospheric lounge vignette:
    // Left side (hookah side) has a dark backdrop so the hookah, water, and glass pop.
    // Center & right side (user side) are translucent so the user's face & hands are clearly visible.
    const leftVignette = ctx.createLinearGradient(0, 0, width, 0);
    leftVignette.addColorStop(0, 'rgba(5, 5, 16, 0.85)');
    leftVignette.addColorStop(0.35, 'rgba(5, 5, 16, 0.60)');
    leftVignette.addColorStop(0.65, 'rgba(5, 5, 16, 0.25)');
    leftVignette.addColorStop(1, 'rgba(5, 5, 16, 0.35)');

    ctx.fillStyle = leftVignette;
    ctx.fillRect(0, 0, width, height);

    // Radial glow behind hookah
    const ambientPulse = 0.3 + Math.sin(time * 0.001) * 0.05;
    const ambGrad = ctx.createRadialGradient(
      layout.centerX, layout.centerY, 0,
      layout.centerX, layout.centerY, 280 * layout.scale
    );
    ambGrad.addColorStop(0, `rgba(139, 92, 246, ${ambientPulse * 0.15})`);
    ambGrad.addColorStop(0.6, `rgba(6, 182, 212, ${ambientPulse * 0.08})`);
    ambGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = ambGrad;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  // Dark gradient background (standard mode when mirror is off or no camera)
  const bgGrad = ctx.createRadialGradient(
    layout.centerX, layout.centerY,
    50,
    layout.centerX, layout.centerY,
    Math.max(width, height) * 0.7
  );
  bgGrad.addColorStop(0, '#0a0a1a');
  bgGrad.addColorStop(0.5, '#050510');
  bgGrad.addColorStop(1, '#020208');

  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle ambient glow behind hookah
  const ambientPulse = 0.3 + Math.sin(time * 0.001) * 0.05;
  const ambGrad = ctx.createRadialGradient(
    layout.centerX, layout.centerY, 0,
    layout.centerX, layout.centerY, 250 * layout.scale
  );
  ambGrad.addColorStop(0, `rgba(139, 92, 246, ${ambientPulse * 0.08})`);
  ambGrad.addColorStop(0.5, `rgba(80, 50, 180, ${ambientPulse * 0.04})`);
  ambGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = ambGrad;
  ctx.fillRect(0, 0, width, height);
}
