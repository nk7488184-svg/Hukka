// ============================================================
// Photorealistic Volumetric Smoke & Bubble Particle System
// ============================================================

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  opacity: number;
  initialOpacity: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
  turbulenceSeed: number;
  colorType: 'white' | 'cyan' | 'purple';
}

export class SmokeParticleSystem {
  particles: Particle[] = [];
  private maxParticles = 350;

  emit(
    x: number,
    y: number,
    count: number,
    intensity: number = 1,
    colorType: 'white' | 'cyan' | 'purple' = 'white'
  ) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        // Remove oldest particle to make room for fresh smoke
        this.particles.shift();
      }

      // Fan out upward with spread
      const angle = (Math.random() * Math.PI * 0.8) - Math.PI * 0.9;
      const speed = (1.0 + Math.random() * 2.5) * Math.max(0.6, intensity);
      const maxLife = 70 + Math.random() * 90;
      const initialSize = (18 + Math.random() * 24) * Math.max(0.7, intensity);
      const maxSize = initialSize * (3.0 + Math.random() * 2.0);
      const initialOpacity = 0.70 + Math.random() * 0.25;

      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.8,
        vy: Math.sin(angle) * speed - 1.0, // Strong upward buoyancy
        size: initialSize,
        maxSize,
        opacity: initialOpacity,
        initialOpacity,
        life: 0,
        maxLife,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        turbulenceSeed: Math.random() * 100,
        colorType,
      });
    }
  }

  /**
   * Dual mouth & nose (nostril) exhale smoke clouds
   */
  emitExhaleSmoke(
    mouthX: number,
    mouthY: number,
    leftNostrilX?: number,
    leftNostrilY?: number,
    rightNostrilX?: number,
    rightNostrilY?: number,
    intensity: number = 1
  ) {
    const emitPower = Math.max(0.65, intensity);

    // 1. Mouth smoke cloud (dense, billowy)
    const mouthCount = Math.ceil(3 + emitPower * 5);
    for (let i = 0; i < mouthCount; i++) {
      if (this.particles.length >= this.maxParticles) this.particles.shift();

      const angle = (Math.random() * Math.PI * 0.7) - Math.PI * 0.85;
      const speed = (1.2 + Math.random() * 2.8) * emitPower;
      const initialSize = 22 + Math.random() * 24 * emitPower;
      const maxSize = initialSize * 3.8;

      this.particles.push({
        x: mouthX + (Math.random() - 0.5) * 16,
        y: mouthY + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.8,
        vy: Math.sin(angle) * speed - 0.8,
        size: initialSize,
        maxSize,
        opacity: 0.82 + Math.random() * 0.16,
        initialOpacity: 0.85,
        life: 0,
        maxLife: 85 + Math.random() * 95,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
        turbulenceSeed: Math.random() * 100,
        colorType: 'white',
      });
    }

    // 2. Dual Nostril Streams (Dragon nose smoke jets!)
    if (leftNostrilX !== undefined && leftNostrilY !== undefined) {
      for (let i = 0; i < 2; i++) {
        if (this.particles.length >= this.maxParticles) this.particles.shift();
        this.particles.push({
          x: leftNostrilX + (Math.random() - 0.5) * 5,
          y: leftNostrilY + 3,
          vx: -(0.6 + Math.random() * 1.0) * emitPower, // angled left
          vy: (0.9 + Math.random() * 1.3) * emitPower,  // downward stream initially
          size: 11 + Math.random() * 8,
          maxSize: 45 + Math.random() * 20,
          opacity: 0.75 + Math.random() * 0.2,
          initialOpacity: 0.8,
          life: 0,
          maxLife: 75 + Math.random() * 80,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.03,
          turbulenceSeed: Math.random() * 100,
          colorType: 'white',
        });
      }
    }

    if (rightNostrilX !== undefined && rightNostrilY !== undefined) {
      for (let i = 0; i < 2; i++) {
        if (this.particles.length >= this.maxParticles) this.particles.shift();
        this.particles.push({
          x: rightNostrilX + (Math.random() - 0.5) * 5,
          y: rightNostrilY + 3,
          vx: (0.6 + Math.random() * 1.0) * emitPower,  // angled right
          vy: (0.9 + Math.random() * 1.3) * emitPower,  // downward stream initially
          size: 11 + Math.random() * 8,
          maxSize: 45 + Math.random() * 20,
          opacity: 0.75 + Math.random() * 0.2,
          initialOpacity: 0.8,
          life: 0,
          maxLife: 75 + Math.random() * 80,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.03,
          turbulenceSeed: Math.random() * 100,
          colorType: 'white',
        });
      }
    }
  }

  update(dt: number) {
    const dtFactor = Math.min(dt / 16.67, 3); // Normalize to 60fps

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dtFactor;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      const lifeRatio = p.life / p.maxLife;

      // Physics update
      p.x += p.vx * dtFactor;
      p.y += p.vy * dtFactor;

      // Continuous upward buoyancy (hot smoke rises)
      p.vy -= 0.025 * dtFactor;

      // Realistic smoke curling / atmospheric turbulence
      p.vx += Math.sin(p.life * 0.05 + p.turbulenceSeed) * 0.08 * dtFactor;

      // Air resistance damping
      p.vx *= 0.985;
      p.vy *= 0.985;

      // Expand cloud as it billows outward
      const growthProgress = Math.min(1, lifeRatio * 1.5);
      p.size = p.size + (p.maxSize - p.size) * 0.025 * dtFactor;

      // Opacity curve: holds thick for first 35%, then fades out gently
      if (lifeRatio < 0.25) {
        p.opacity = p.initialOpacity;
      } else {
        const fadeProgress = (lifeRatio - 0.25) / 0.75;
        p.opacity = Math.max(0, p.initialOpacity * (1 - Math.pow(fadeProgress, 1.2)));
      }

      p.rotation += p.rotationSpeed * dtFactor;
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.particles.length === 0) return;

    ctx.save();
    // Use source-over for thick visible clouds with realistic alpha layering
    ctx.globalCompositeOperation = 'source-over';

    for (const p of this.particles) {
      if (p.opacity <= 0.01) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      // Create rich volumetric smoke puff
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);

      if (p.colorType === 'cyan') {
        grad.addColorStop(0, `rgba(200, 245, 255, ${p.opacity * 0.95})`);
        grad.addColorStop(0.35, `rgba(140, 225, 245, ${p.opacity * 0.75})`);
        grad.addColorStop(0.70, `rgba(60, 180, 220, ${p.opacity * 0.35})`);
        grad.addColorStop(1, 'rgba(30, 140, 180, 0)');
      } else if (p.colorType === 'purple') {
        grad.addColorStop(0, `rgba(240, 225, 255, ${p.opacity * 0.95})`);
        grad.addColorStop(0.35, `rgba(190, 160, 245, ${p.opacity * 0.75})`);
        grad.addColorStop(0.70, `rgba(130, 90, 220, ${p.opacity * 0.35})`);
        grad.addColorStop(1, 'rgba(80, 50, 160, 0)');
      } else {
        // Natural dense white/silver hookah cloud
        grad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity * 0.92})`);
        grad.addColorStop(0.30, `rgba(235, 235, 245, ${p.opacity * 0.78})`);
        grad.addColorStop(0.65, `rgba(205, 205, 225, ${p.opacity * 0.38})`);
        grad.addColorStop(1, 'rgba(180, 180, 205, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  clear() {
    this.particles = [];
  }
}

// Bubble particles for the hookah water chamber
export interface Bubble {
  x: number;
  y: number;
  vy: number;
  size: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

export class BubbleSystem {
  bubbles: Bubble[] = [];
  private maxBubbles = 45;
  private regionX: number;
  private regionY: number;
  private regionWidth: number;
  private regionHeight: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.regionX = x;
    this.regionY = y;
    this.regionWidth = width;
    this.regionHeight = height;
  }

  updateRegion(x: number, y: number, width: number, height: number) {
    this.regionX = x;
    this.regionY = y;
    this.regionWidth = width;
    this.regionHeight = height;
  }

  emit(count: number = 1) {
    for (let i = 0; i < count; i++) {
      if (this.bubbles.length >= this.maxBubbles) break;

      this.bubbles.push({
        x: this.regionX + Math.random() * this.regionWidth,
        y: this.regionY + this.regionHeight - Math.random() * 10,
        vy: -(1.5 + Math.random() * 2.5),
        size: 2.5 + Math.random() * 5.0,
        opacity: 0.6 + Math.random() * 0.4,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05 + Math.random() * 0.1,
      });
    }
  }

  update(dt: number) {
    const dtFactor = Math.min(dt / 16.67, 3);

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.y += b.vy * dtFactor;
      b.wobble += b.wobbleSpeed * dtFactor;
      b.x += Math.sin(b.wobble) * 0.8 * dtFactor;

      // Pop when reaching water surface
      if (b.y <= this.regionY) {
        this.bubbles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.bubbles.length === 0) return;

    ctx.save();
    for (const b of this.bubbles) {
      ctx.save();
      ctx.globalAlpha = b.opacity;

      // Bubble outline
      ctx.strokeStyle = 'rgba(200, 230, 255, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.stroke();

      // Bubble highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }
}
