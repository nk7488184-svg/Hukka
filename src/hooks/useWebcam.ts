'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export interface WebcamState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  cameraActive: boolean;
  isConnecting: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useWebcam(): WebcamState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setCameraActive(false);
    setIsConnecting(false);
  }, []);

  const startCamera = useCallback(async () => {
    // If already streaming, don't re-request
    if (streamRef.current && streamRef.current.active) {
      setCameraActive(true);
      return;
    }

    // Stop any dormant tracks first
    stopCamera();
    setIsConnecting(true);
    setError(null);

    let mediaStream: MediaStream | null = null;

    try {
      // First attempt: standard ideal constraints
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 },
        },
      });
    } catch (firstErr: any) {
      console.warn('Initial camera constraints failed, attempting fallback:', firstErr);
      try {
        // Fallback attempt: basic video constraint
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      } catch (fallbackErr: any) {
        console.error('All camera attempts failed:', fallbackErr);
        let errorMsg = 'Camera access denied or unavailable.';
        if (
          fallbackErr.name === 'NotReadableError' ||
          fallbackErr.message?.includes('Device in use')
        ) {
          errorMsg =
            'Camera is in use by another app or tab (e.g. Zoom, Teams, Meet). Close other apps and click Retry.';
        } else if (fallbackErr.name === 'NotAllowedError') {
          errorMsg = 'Camera permission blocked. Please allow camera in your browser address bar.';
        } else if (fallbackErr.name === 'NotFoundError') {
          errorMsg = 'No camera found on this device.';
        }
        setError(errorMsg);
        setIsConnecting(false);
        setCameraActive(false);
        return;
      }
    }

    if (mediaStream) {
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCameraActive(true);
      setIsConnecting(false);
    }
  }, [stopCamera]);

  // Keep videoRef synchronized whenever stream or cameraActive updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    const handlePlay = () => {
      video.play().catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('Video play error:', err);
        }
      });
    };

    video.addEventListener('loadedmetadata', handlePlay);

    if (video.readyState >= 1) {
      handlePlay();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handlePlay);
    };
  }, [stream, cameraActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    stream,
    cameraActive,
    isConnecting,
    error,
    startCamera,
    stopCamera,
  };
}
