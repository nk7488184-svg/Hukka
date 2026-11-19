'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { SmokeParticleSystem, BubbleSystem } from '@/lib/particleSystem';
import {
  renderHookah,
  renderBackground,
  calculateLayout,
  HookahLayout,
} from '@/lib/hookahRenderer';
import { springInterp, mediaPipeToCanvas, distance, lerp, Vec2 } from '@/lib/physics';
import { MOUTH_PROXIMITY_THRESHOLD } from '@/lib/gameState';

export interface HookahCanvasProps {
  handPosition: Vec2 | null; // Normalized 0-1 from MediaPipe
  mouthPosition: Vec2 | null; // Normalized 0-1 from MediaPipe
  nosePosition?: Vec2 | null;
  leftNostril?: Vec2 | null;
  rightNostril?: Vec2 | null;
  isGrabbing: boolean;
  blowDetected: boolean;
  blowIntensity: number;
  handDetected: boolean;
  particlesEnabled: boolean;
  mirrorMode?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onNearMouth: (near: boolean) => void;
  onSmokingActive: (active: boolean) => void;
  onInhaleActive?: (inhaling: boolean) => void;
}

export function HookahCanvas({
  handPosition,
  mouthPosition,
  nosePosition,
  leftNostril,
  rightNostril,
  isGrabbing,
  blowDetected,
  blowIntensity,
  handDetected,
  particlesEnabled,
  mirrorMode = false,
  videoRef,
  onNearMouth,
  onSmokingActive,
  onInhaleActive,
}: HookahCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smokeSystemRef = useRef<SmokeParticleSystem>(new SmokeParticleSystem());
  const bubbleSystemRef = useRef<BubbleSystem>(new BubbleSystem(0, 0, 0, 0));
  const layoutRef = useRef<HookahLayout | null>(null);

  // Hose physics state
  const hosePositionRef = useRef<Vec2>({ x: 0, y: 0 });
  const hoseVelocityRef = useRef<Vec2>({ x: 0, y: 0 });
  const hoseTargetRef = useRef<Vec2>({ x: 0, y: 0 });
  const glowIntensityRef = useRef(0);
  const isNearMouthRef = useRef(false);
  const isSmokingRef = useRef(false);
  const isInhalingRef = useRef(false);
  const lungSmokeRef = useRef(0); // Smoke capacity in lungs from inhaling (0 to 1)
  const burnIntensityRef = useRef(0); // Coal flare intensity during inhalation

  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const initializedRef = useRef(false);

  const mousePosRef = useRef<Vec2 | null>(null);
  const isMouseDownRef = useRef(false);

  // Initialize canvas and start render loop
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const layout = calculateLayout(canvas.width, canvas.height);
      layoutRef.current = layout;

      // Set default hose position
      if (!initializedRef.current) {
        const defaultPos: Vec2 = {
          x: layout.hosePort.x + 100 * layout.scale,
          y: layout.hosePort.y + 80 * layout.scale,
        };
        hosePositionRef.current = { ...defaultPos };
        hoseTargetRef.current = { ...defaultPos };
        initializedRef.current = true;
      }

      // Update bubble system region
      bubbleSystemRef.current.updateRegion(
        layout.baseCenter.x - 40 * layout.scale,
        layout.waterLevel,
        80 * layout.scale,
        (layout.baseBottom.y - layout.waterLevel) * 0.8
      );
    };

    const handlePointerDown = (e: PointerEvent) => {
      isMouseDownRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isMouseDownRef.current) {
        mousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerUp = () => {
      isMouseDownRef.current = false;
      mousePosRef.current = null;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  useEffect(() => {
    const cleanup = initCanvas();
    return cleanup;
  }, [initCanvas]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = (timestamp: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !layoutRef.current) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      // Delta time
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const dt = Math.min(timestamp - lastTimeRef.current, 50);
      lastTimeRef.current = timestamp;

      const layout = layoutRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // --- UPDATE PHASE ---

      // Update hose target based on hand tracking or mouse dragging fallback
      const hasHand = Boolean(handPosition && handDetected);
      const isMouseDragging = Boolean(isMouseDownRef.current && mousePosRef.current);
      const vw = videoRef?.current?.videoWidth;
      const vh = videoRef?.current?.videoHeight;

      if (hasHand && handPosition) {
        const canvasPos = mediaPipeToCanvas(handPosition.x, handPosition.y, w, h, true, vw, vh);
        hoseTargetRef.current = canvasPos;
      } else if (isMouseDragging && mousePosRef.current) {
        hoseTargetRef.current = { ...mousePosRef.current };
      } else {
        // Return to default position when no hand or mouse drag
        hoseTargetRef.current = {
          x: layout.hosePort.x + 100 * layout.scale,
          y: layout.hosePort.y + 80 * layout.scale,
        };
      }

      // Spring physics for responsive, smooth hose movement
      const springResult = springInterp(
        hosePositionRef.current,
        hoseTargetRef.current,
        hoseVelocityRef.current,
        hasHand || isMouseDragging ? 0.26 : 0.08,
        0.68,
        dt
      );
      hosePositionRef.current = springResult.position;
      hoseVelocityRef.current = springResult.velocity;

      // Glow intensity - increases when hand or mouse is interacting with hose
      const isInteracting = hasHand || isMouseDragging;
      const targetGlow = isInteracting ? 1.0 : 0.0;
      glowIntensityRef.current = lerp(glowIntensityRef.current, targetGlow, 0.12);

      // Check if mouthpiece is near mouth (or fallback if face tracking isn't active)
      let nearMouth = false;
      if (mouthPosition) {
        const mouthCanvas = mediaPipeToCanvas(mouthPosition.x, mouthPosition.y, w, h, true, vw, vh);
        const dist = distance(hosePositionRef.current, mouthCanvas);
        nearMouth = dist < MOUTH_PROXIMITY_THRESHOLD * layout.scale;
      } else if (hasHand || isMouseDragging) {
        // If face is not detected yet but user is actively interacting with the hose,
        // treat holding hose above center as near mouth
        nearMouth = hosePositionRef.current.y < h * 0.60;
      }

      if (nearMouth !== isNearMouthRef.current) {
        isNearMouthRef.current = nearMouth;
        onNearMouth(nearMouth);
      }

      // ----------------------------------------------------
      // HOOKAH RITUAL: INHALE (PULL) vs EXHALE (SMOKE)
      // ----------------------------------------------------
      // 1. Inhale / Pull Phase:
      // When the pipe is brought to the mouth, the user pulls/inhales.
      // - Coals glow super hot and red/orange.
      // - Water chamber bubbles actively.
      // - NO smoke is released from mouth or nose yet (it is being inhaled!).
      // - Lung smoke charges up.
      const isPullingHookah = nearMouth && isInteracting;

      if (isPullingHookah) {
        // Accumulate smoke in lungs (charges from 0.0 to 1.0)
        lungSmokeRef.current = Math.min(1.0, lungSmokeRef.current + (dt / 1000) * 0.9);

        // Coals flare hot red/orange
        burnIntensityRef.current = lerp(burnIntensityRef.current, 1.0, 0.2);

        // Water bubbles vigorously as air pulls through the pipe
        if (particlesEnabled && Math.random() < 0.65) {
          bubbleSystemRef.current.emit(Math.ceil(1 + Math.random() * 2));
        }

        if (!isInhalingRef.current) {
          isInhalingRef.current = true;
          onInhaleActive?.(true);
        }
      } else {
        burnIntensityRef.current = lerp(burnIntensityRef.current, 0.0, 0.08);
        if (isInhalingRef.current) {
          isInhalingRef.current = false;
          onInhaleActive?.(false);
        }
      }

      // 2. Exhale / Smoke Phase:
      // Smoke is released when the user exhales:
      // Either by blowing (microphone blow / button hold), OR pulling pipe away with smoke in lungs!
      // Smoke billows simultaneously from BOTH the MOUTH and the NOSTRILS (NOSE)!
      const hasSmokeInLungs = lungSmokeRef.current > 0.05;
      const isExhaling = (blowDetected || (hasSmokeInLungs && !nearMouth)) && !isPullingHookah;

      if (isExhaling !== isSmokingRef.current) {
        isSmokingRef.current = isExhaling;
        onSmokingActive(isExhaling);
      }

      // Emit dual mouth & nose smoke clouds
      if (isExhaling && particlesEnabled) {
        const exhaleIntensity = Math.max(0.65, blowIntensity || lungSmokeRef.current);

        // Compute screen coordinates for mouth and nostrils
        let mPos: Vec2 = { x: w * 0.55, y: h * 0.45 };
        let lNostril: Vec2 | undefined = undefined;
        let rNostril: Vec2 | undefined = undefined;

        if (mouthPosition) {
          mPos = mediaPipeToCanvas(mouthPosition.x, mouthPosition.y, w, h, true, vw, vh);
        } else if (hasHand || isMouseDragging) {
          mPos = { ...hosePositionRef.current };
        }

        if (leftNostril && rightNostril) {
          lNostril = mediaPipeToCanvas(leftNostril.x, leftNostril.y, w, h, true, vw, vh);
          rNostril = mediaPipeToCanvas(rightNostril.x, rightNostril.y, w, h, true, vw, vh);
        } else if (nosePosition) {
          const nPos = mediaPipeToCanvas(nosePosition.x, nosePosition.y, w, h, true, vw, vh);
          lNostril = { x: nPos.x - 12 * layout.scale, y: nPos.y };
          rNostril = { x: nPos.x + 12 * layout.scale, y: nPos.y };
        } else if (mouthPosition) {
          // Fallback nostrils slightly above mouth
          lNostril = { x: mPos.x - 10 * layout.scale, y: mPos.y - 18 * layout.scale };
          rNostril = { x: mPos.x + 10 * layout.scale, y: mPos.y - 18 * layout.scale };
        }

        // Emit realistic dual mouth & nose smoke!
        smokeSystemRef.current.emitExhaleSmoke(
          mPos.x,
          mPos.y,
          lNostril?.x,
          lNostril?.y,
          rNostril?.x,
          rNostril?.y,
          exhaleIntensity
        );

        // Gradually deplete lung smoke as it billows out
        if (lungSmokeRef.current > 0) {
          lungSmokeRef.current = Math.max(0, lungSmokeRef.current - (dt / 1000) * 0.40);
        }
      }

      // Gentle ambient smoke wisp from hookah bowl coals even when idle!
      if (particlesEnabled && Math.random() < 0.22) {
        smokeSystemRef.current.emit(
          layout.bowlCenter.x + (Math.random() - 0.5) * 14 * layout.scale,
          layout.bowlCenter.y - 22 * layout.scale,
          1,
          0.35,
          'purple'
        );
      }

      // Ambient bubbles (slow, occasional)
      if (particlesEnabled && Math.random() < 0.04) {
        bubbleSystemRef.current.emit(1);
      }

      // Update particle systems
      smokeSystemRef.current.update(dt);
      bubbleSystemRef.current.update(dt);

      // --- RENDER PHASE ---
      ctx.clearRect(0, 0, w, h);

      // Background
      renderBackground(ctx, w, h, layout, timestamp, mirrorMode);

      // Bubbles (behind hookah glass)
      bubbleSystemRef.current.render(ctx);

      // Hookah with reactive coal flare
      renderHookah(
        ctx,
        layout,
        hosePositionRef.current,
        glowIntensityRef.current,
        timestamp,
        burnIntensityRef.current
      );

      // Smoke particles (on top)
      smokeSystemRef.current.render(ctx);

      // Grab indicator near mouthpiece when interacting
      if (glowIntensityRef.current > 0.1) {
        const mp = hosePositionRef.current;
        ctx.save();
        ctx.globalAlpha = glowIntensityRef.current * 0.35;
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, 30 * layout.scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Near-mouth indicator
      if (nearMouth) {
        const mp = hosePositionRef.current;
        ctx.save();
        const pulse = 0.5 + Math.sin(timestamp * 0.005) * 0.3;
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, 35 * layout.scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    handPosition,
    mouthPosition,
    nosePosition,
    leftNostril,
    rightNostril,
    isGrabbing,
    blowDetected,
    blowIntensity,
    handDetected,
    particlesEnabled,
    mirrorMode,
    videoRef,
    onNearMouth,
    onSmokingActive,
    onInhaleActive,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
}
