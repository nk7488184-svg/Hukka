// ============================================================
// Game State for Hookah Baar
// ============================================================

import { Vec2 } from './physics';

export interface Settings {
  cameraEnabled: boolean;
  micEnabled: boolean;
  soundEnabled: boolean;
  particlesEnabled: boolean;
}

export interface DetectionState {
  handDetected: boolean;
  faceDetected: boolean;
  blowDetected: boolean;
  blowIntensity: number;
  mouthPosition: Vec2 | null;
  handPosition: Vec2 | null;
  isGrabbing: boolean;
}

export interface HoseState {
  // The current mouthpiece position (smoothed)
  mouthpiecePos: Vec2;
  mouthpieceVel: Vec2;
  // Target position (raw from hand tracking or default)
  targetPos: Vec2;
  // Whether the hose is being held
  isHeld: boolean;
  // Whether the mouthpiece is near the mouth
  nearMouth: boolean;
  // Glow intensity for hose highlight (0-1)
  glowIntensity: number;
}

export interface TutorialState {
  active: boolean;
  step: number; // 0, 1, 2
  completed: boolean;
}

export interface GameState {
  settings: Settings;
  detection: DetectionState;
  hose: HoseState;
  tutorial: TutorialState;
  isSmokingActive: boolean;
  isBubblingActive: boolean;
}

export function createInitialGameState(canvasWidth: number, canvasHeight: number): GameState {
  // Default hose rest position (hanging from hookah)
  const defaultHosePos: Vec2 = {
    x: canvasWidth * 0.35,
    y: canvasHeight * 0.55,
  };

  return {
    settings: {
      cameraEnabled: true,
      micEnabled: true,
      soundEnabled: true,
      particlesEnabled: true,
    },
    detection: {
      handDetected: false,
      faceDetected: false,
      blowDetected: false,
      blowIntensity: 0,
      mouthPosition: null,
      handPosition: null,
      isGrabbing: false,
    },
    hose: {
      mouthpiecePos: { ...defaultHosePos },
      mouthpieceVel: { x: 0, y: 0 },
      targetPos: { ...defaultHosePos },
      isHeld: false,
      nearMouth: false,
      glowIntensity: 0,
    },
    tutorial: {
      active: true,
      step: 0,
      completed: false,
    },
    isSmokingActive: false,
    isBubblingActive: false,
  };
}

// Proximity threshold for "near mouth" detection (in canvas pixels)
export const MOUTH_PROXIMITY_THRESHOLD = 160;

// Proximity threshold for "near hose" for grabbing
export const HOSE_GRAB_THRESHOLD = 150;
