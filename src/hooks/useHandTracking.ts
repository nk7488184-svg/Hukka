'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Vec2 } from '@/lib/physics';

// We'll dynamically import MediaPipe to avoid SSR issues
let HandLandmarker: any = null;
let FilesetResolver: any = null;

export interface HandTrackingState {
  handDetected: boolean;
  palmCenter: Vec2 | null;
  indexTip: Vec2 | null;
  gripPoint: Vec2 | null;
  isGrabbing: boolean;
  isInitialized: boolean;
  isLoading: boolean;
}

export function useHandTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean
) {
  const handLandmarkerRef = useRef<any>(null);
  const [state, setState] = useState<HandTrackingState>({
    handDetected: false,
    palmCenter: null,
    indexTip: null,
    gripPoint: null,
    isGrabbing: false,
    isInitialized: false,
    isLoading: false,
  });
  const stateRef = useRef(state);
  const lastTimeRef = useRef(-1);

  const initialize = useCallback(async () => {
    if (handLandmarkerRef.current || state.isLoading) return;

    setState((s) => ({ ...s, isLoading: true }));

    try {
      // Dynamic import for client-side only
      const vision = await import('@mediapipe/tasks-vision');
      HandLandmarker = vision.HandLandmarker;
      FilesetResolver = vision.FilesetResolver;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      try {
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU',
            },
            numHands: 2,
            runningMode: 'VIDEO',
            minHandDetectionConfidence: 0.35,
            minHandPresenceConfidence: 0.35,
            minTrackingConfidence: 0.35,
          }
        );
      } catch (gpuErr) {
        console.warn('Hand tracking GPU delegate failed, falling back to CPU:', gpuErr);
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            numHands: 2,
            runningMode: 'VIDEO',
            minHandDetectionConfidence: 0.35,
            minHandPresenceConfidence: 0.35,
            minTrackingConfidence: 0.35,
          }
        );
      }

      setState((s) => ({ ...s, isInitialized: true, isLoading: false }));
      console.log('Hand tracking initialized');
    } catch (err) {
      console.error('Failed to initialize hand tracking:', err);
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [state.isLoading]);

  // Detect hand in video frame
  const detect = useCallback(
    (timestamp: number) => {
      const video = videoRef.current;
      if (
        !handLandmarkerRef.current ||
        !video ||
        !enabled ||
        video.paused ||
        video.ended ||
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        return;
      }

      // Avoid processing same frame or backwards timestamp
      if (timestamp <= lastTimeRef.current) return;
      lastTimeRef.current = timestamp;

      try {
        const results = handLandmarkerRef.current.detectForVideo(
          video,
          timestamp
        );

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];

          // Palm center: average of wrist (0) and middle finger MCP (9)
          const palmCenter: Vec2 = {
            x: (landmarks[0].x + landmarks[9].x) / 2,
            y: (landmarks[0].y + landmarks[9].y) / 2,
          };

          // Index fingertip (landmark 8)
          const indexTip: Vec2 = {
            x: landmarks[8].x,
            y: landmarks[8].y,
          };

          // Grip point: between thumb tip (4) and index tip (8) - where fingers hold the pipe
          const thumbTip = landmarks[4];
          const gripPoint: Vec2 = {
            x: (thumbTip.x + landmarks[8].x) / 2,
            y: (thumbTip.y + landmarks[8].y) / 2,
          };

          // Grab detection: check if fingertips are curled toward palm
          // Compare fingertip distance to palm vs finger MCP distance to palm
          const fingertips = [8, 12, 16, 20]; // index, middle, ring, pinky tips
          const mcps = [5, 9, 13, 17]; // corresponding MCPs
          let curlCount = 0;

          for (let i = 0; i < fingertips.length; i++) {
            const tipDist = Math.sqrt(
              Math.pow(landmarks[fingertips[i]].x - landmarks[0].x, 2) +
              Math.pow(landmarks[fingertips[i]].y - landmarks[0].y, 2)
            );
            const mcpDist = Math.sqrt(
              Math.pow(landmarks[mcps[i]].x - landmarks[0].x, 2) +
              Math.pow(landmarks[mcps[i]].y - landmarks[0].y, 2)
            );
            if (tipDist < mcpDist * 1.1) {
              curlCount++;
            }
          }

          const isGrabbing = curlCount >= 2;

          const newState: HandTrackingState = {
            handDetected: true,
            palmCenter,
            indexTip,
            gripPoint,
            isGrabbing,
            isInitialized: true,
            isLoading: false,
          };
          stateRef.current = newState;
          setState(newState);
        } else {
          if (stateRef.current.handDetected) {
            const newState: HandTrackingState = {
              ...stateRef.current,
              handDetected: false,
              palmCenter: null,
              indexTip: null,
              gripPoint: null,
              isGrabbing: false,
            };
            stateRef.current = newState;
            setState(newState);
          }
        }
      } catch {
        // Silently handle detection errors during frame processing
      }
    },
    [enabled, videoRef]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    initialize,
    detect,
  };
}
