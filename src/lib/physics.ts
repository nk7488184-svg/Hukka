// ============================================================
// Physics utilities for Hookah Baar
// ============================================================

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Lerp a Vec2
 */
export function lerpVec2(a: Vec2, b: Vec2, t: number): Vec2 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  };
}

/**
 * Distance between two points
 */
export function distance(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Spring-like interpolation with damping
 * Returns new velocity and position
 */
export function springInterp(
  current: Vec2,
  target: Vec2,
  velocity: Vec2,
  stiffness: number = 0.08,
  damping: number = 0.75,
  dt: number = 1
): { position: Vec2; velocity: Vec2 } {
  const dtFactor = dt / 16.67;
  
  const ax = (target.x - current.x) * stiffness;
  const ay = (target.y - current.y) * stiffness;
  
  const newVx = (velocity.x + ax * dtFactor) * damping;
  const newVy = (velocity.y + ay * dtFactor) * damping;
  
  return {
    position: {
      x: current.x + newVx * dtFactor,
      y: current.y + newVy * dtFactor,
    },
    velocity: { x: newVx, y: newVy },
  };
}

/**
 * Generate points along a quadratic bezier curve
 */
export function quadBezier(p0: Vec2, p1: Vec2, p2: Vec2, segments: number): Vec2[] {
  const points: Vec2[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    points.push({
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    });
  }
  return points;
}

/**
 * Generate points along a cubic bezier curve
 */
export function cubicBezier(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, segments: number): Vec2[] {
  const points: Vec2[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    points.push({
      x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
      y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
    });
  }
  return points;
}

/**
 * Smooth (ease) a 0-1 value
 */
export function smoothStep(t: number): number {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Map normalized MediaPipe coords (0-1) to canvas coords
 * MediaPipe X is mirrored (webcam mirror)
 * Accurately accounts for object-cover video cropping
 */
export function mediaPipeToCanvas(
  mpX: number,
  mpY: number,
  canvasWidth: number,
  canvasHeight: number,
  mirror: boolean = true,
  videoWidth?: number,
  videoHeight?: number
): Vec2 {
  if (videoWidth && videoHeight && videoWidth > 0 && videoHeight > 0) {
    const scale = Math.max(canvasWidth / videoWidth, canvasHeight / videoHeight);
    const renderW = videoWidth * scale;
    const renderH = videoHeight * scale;
    const offsetX = (canvasWidth - renderW) / 2;
    const offsetY = (canvasHeight - renderH) / 2;
    const screenX = mirror ? offsetX + (1 - mpX) * renderW : offsetX + mpX * renderW;
    const screenY = offsetY + mpY * renderH;
    return { x: screenX, y: screenY };
  }
  return {
    x: mirror ? (1 - mpX) * canvasWidth : mpX * canvasWidth,
    y: mpY * canvasHeight,
  };
}
