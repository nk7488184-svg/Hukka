'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Vec2 } from '@/lib/physics';

let FaceLandmarker: any = null;
let FilesetResolver: any = null;

export interface FaceTrackingState {
  faceDetected: boolean;
  mouthPosition: Vec2 | null;
  nosePosition: Vec2 | null;
  leftNostril: Vec2 | null;
  rightNostril: Vec2 | null;
  mouthOpen: boolean;
  isInitialized: boolean;
  isLoading: boolean;
}

export function useFaceTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean
) {
  const faceLandmarkerRef = useRef<any>(null);
  const [state, setState] = useState<FaceTrackingState>({
    faceDetected: false,
    mouthPosition: null,
    nosePosition: null,
    leftNostril: null,
    rightNostril: null,
    mouthOpen: false,
    isInitialized: false,
    isLoading: false,
  });
  const stateRef = useRef(state);
  const lastTimeRef = useRef(-1);

  const initialize = useCallback(async () => {
    if (faceLandmarkerRef.current || state.isLoading) return;

    setState((s) => ({ ...s, isLoading: true }));

    try {
      const vision = await import('@mediapipe/tasks-vision');
      FaceLandmarker = vision.FaceLandmarker;
      FilesetResolver = vision.FilesetResolver;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      try {
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'GPU',
            },
            numFaces: 1,
            runningMode: 'VIDEO',
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          }
        );
      } catch (gpuErr) {
        console.warn('Face tracking GPU delegate failed, falling back to CPU:', gpuErr);
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'CPU',
            },
            numFaces: 1,
            runningMode: 'VIDEO',
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          }
        );
      }

      setState((s) => ({ ...s, isInitialized: true, isLoading: false }));
      console.log('Face tracking initialized');
    } catch (err) {
      console.error('Failed to initialize face tracking:', err);
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [state.isLoading]);

  const detect = useCallback(
    (timestamp: number) => {
      const video = videoRef.current;
      if (
        !faceLandmarkerRef.current ||
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

      if (timestamp <= lastTimeRef.current) return;
      lastTimeRef.current = timestamp;

      try {
        const results = faceLandmarkerRef.current.detectForVideo(
          video,
          timestamp
        );

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];

          // Mouth center: average of key lip landmarks
          // Upper lip center: 13, Lower lip center: 14
          // Left corner: 61, Right corner: 291
          const upperLip = landmarks[13];
          const lowerLip = landmarks[14];

          const mouthPosition: Vec2 = {
            x: (upperLip.x + lowerLip.x) / 2,
            y: (upperLip.y + lowerLip.y) / 2,
          };

          // Nose & nostrils (landmark 2: nose base, 98: left nostril, 327: right nostril)
          const nosePosition: Vec2 = {
            x: landmarks[2]?.x ?? mouthPosition.x,
            y: landmarks[2]?.y ?? mouthPosition.y - 0.04,
          };
          const leftNostril: Vec2 = {
            x: landmarks[98]?.x ?? nosePosition.x - 0.015,
            y: landmarks[98]?.y ?? nosePosition.y,
          };
          const rightNostril: Vec2 = {
            x: landmarks[327]?.x ?? nosePosition.x + 0.015,
            y: landmarks[327]?.y ?? nosePosition.y,
          };

          // Mouth open detection: distance between upper and lower lip
          const mouthGap = Math.abs(upperLip.y - lowerLip.y);
          const mouthOpen = mouthGap > 0.02; // Normalized threshold

          const newState: FaceTrackingState = {
            faceDetected: true,
            mouthPosition,
            nosePosition,
            leftNostril,
            rightNostril,
            mouthOpen,
            isInitialized: true,
            isLoading: false,
          };
          stateRef.current = newState;
          setState(newState);
        } else {
          if (stateRef.current.faceDetected) {
            const newState: FaceTrackingState = {
              ...stateRef.current,
              faceDetected: false,
              mouthPosition: null,
              nosePosition: null,
              leftNostril: null,
              rightNostril: null,
              mouthOpen: false,
            };
            stateRef.current = newState;
            setState(newState);
          }
        }
      } catch {
        // Silently handle detection errors
      }
    },
    [enabled, videoRef]
  );

  useEffect(() => {
    return () => {
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    initialize,
    detect,
  };
}
